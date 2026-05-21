# Database Architecture

Documento di riferimento sullo schema effettivamente contenuto nel dump `backup-dm-dev` (estratto verificando il TOC binario del file PGDMP). Tutto ciò che segue rispecchia il dump, non un'ipotesi.

## 1. Identità del database

- **Nome del DB**: `device-manager` (contiene un trattino → va **quotato** in ogni stringa di connessione e comando psql).
- **Encoding**: `UTF8`.
- **Locale**: `LOCALE_PROVIDER = libc`, `LOCALE = 'C'`.
- **Timezone**: il dump esegue `ALTER DATABASE "device-manager" SET "TimeZone" TO 'UTC'`.
- **`search_path`**: il dump imposta `SELECT pg_catalog.set_config('search_path', '', false)`. Tutte le query del backend devono o usare nomi **qualificati** (`public.machine`) o impostare il search_path nella sessione.
- **Schema**: tutto in `public`.

## 2. Ripristino del dump

Il dump è in formato **custom** (header `PGDMP`). Va ripristinato con `pg_restore`, non con `psql`.

```bash
# Con il container già up, su un DB vuoto:
docker exec -i postgres pg_restore \
    --clean --create --if-exists \
    -U postgres -d postgres \
    /dump/backup-dm-dev
```

Note:

- `--create` ricrea il database `device-manager` dal dump stesso.
- `--clean --if-exists` rende il ripristino idempotente in dev.
- Non passare `--schema-only`: servono anche i dati.

## 3. Gerarchia asset

### `public.customer`

| Colonna       | Tipo                          | Vincoli                              |
| ------------- | ----------------------------- | ------------------------------------ |
| `id`          | `integer`                     | PK, sequence `customer_id_seq`       |
| `name`        | `varchar(50)`                 | NOT NULL, UNIQUE (`customer_name_key`) |
| `adx_database`| `varchar(100)`                | NULL                                 |
| `created_at`  | `timestamptz`                 | DEFAULT `now()`                      |
| `modified_at` | `timestamptz`                 | NULL                                 |

### `public.plant`

| Colonna       | Tipo                          | Vincoli                                                   |
| ------------- | ----------------------------- | --------------------------------------------------------- |
| `id`          | `integer`                     | PK                                                         |
| `name`        | `varchar(50)`                 | NOT NULL                                                  |
| `city`        | `varchar(50)`                 | NOT NULL                                                  |
| `customer_id` | `integer`                     | NOT NULL, FK → `customer(id)` `ON DELETE CASCADE`         |
| `created_at`  | `timestamptz`                 | DEFAULT `now()`                                           |
| `modified_at` | `timestamptz`                 | NULL                                                      |

### `public.machine`

| Colonna         | Tipo                          | Vincoli                                              |
| --------------- | ----------------------------- | ---------------------------------------------------- |
| `id`            | `integer`                     | PK                                                    |
| `name`          | `varchar(50)`                 | NOT NULL                                              |
| `machine_id`    | `varchar(50)`                 | UNIQUE                                                |
| `iot_device_id` | `varchar(255)`                | UNIQUE                                                |
| `plant_id`      | `integer`                     | NOT NULL, FK → `plant(id)` `ON DELETE CASCADE`        |
| `created_at`    | `timestamptz`                 | DEFAULT `now()`                                       |
| `modified_at`   | `timestamptz`                 | NULL                                                  |

> `machine.id` è la chiave referenziata da tutte le tabelle di telemetria come `id_machine`. `machine.machine_id` è invece un identificativo business string-based.

## 4. Tabelle di telemetria (time-series)

Tutte hanno `id` PK, `id_machine` FK → `machine(id)` e una colonna timestamp **senza time zone**, indicizzata.

### `public.telemetry_pc_stats`

| Colonna           | Tipo                          | Note                          |
| ----------------- | ----------------------------- | ----------------------------- |
| `id`              | `integer`                     | PK                            |
| `id_machine`      | `integer`                     | NOT NULL, FK, indicizzata     |
| `timestamp_utc`   | `timestamp`                   | NOT NULL, indicizzata         |
| `cpu_percent`     | `double precision`            | NULL                          |
| `memory_percent`  | `double precision`            | NULL                          |
| `disk_percent`    | `double precision`            | NULL                          |
| `os_name`         | `varchar(120)`                | NULL                          |

### `public.telemetry_ignition_stats`

| Colonna                    | Tipo                          | Note                          |
| -------------------------- | ----------------------------- | ----------------------------- |
| `id`                       | `integer`                     | PK                            |
| `id_machine`               | `integer`                     | NOT NULL, FK, indicizzata     |
| `timestamp_utc`            | `timestamp`                   | NOT NULL, indicizzata         |
| `process_cpu_load_percent` | `double precision`            | NULL                          |
| `jvm_memory_percent`       | `double precision`            | NULL                          |
| `db_status`                | `varchar(20)`                 | NULL — testuale, non booleano |

### `public.telemetry_data_sender`

| Colonna                     | Tipo                          | Note                                       |
| --------------------------- | ----------------------------- | ------------------------------------------ |
| `id`                        | `integer`                     | PK                                         |
| `id_machine`                | `integer`                     | NOT NULL, FK, indicizzata                  |
| `event_subtype`             | `varchar(40)`                 | NOT NULL, indicizzata                      |
| `parquet_subfolder`         | `varchar(255)`                | NULL                                       |
| `parquet_filename`          | `varchar(255)`                | NULL                                       |
| `rows_count`                | `integer`                     | NULL                                       |
| `processing_timestamp_utc`  | `timestamp`                   | NULL — colonna temporale per i filtri      |

### `public.edge_client_status`

| Colonna         | Tipo          | Note                           |
| --------------- | ------------- | ------------------------------ |
| `id`            | `integer`     | PK                             |
| `id_machine`    | `integer`     | NOT NULL, FK, indicizzata      |
| `value`         | `boolean`     | NOT NULL — online/offline      |
| `timestamp_utc` | `timestamp`   | NOT NULL, indicizzata          |

## 5. Allarmi

### `public.alert_type`

| Colonna       | Tipo            | Vincoli                                                                                       |
| ------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `id`          | `integer`       | PK                                                                                            |
| `code`        | `varchar(120)`  | NOT NULL, UNIQUE (`ix_alert_type_code`)                                                       |
| `description` | `varchar(255)`  | NOT NULL                                                                                      |
| `severity`    | `varchar(20)`   | NOT NULL, CHECK `severity IN ('low','medium','high','critical')`, indice `ix_alert_type_severity` |
| `created_at`  | `timestamp`     | NOT NULL                                                                                      |
| `updated_at`  | `timestamp`     | NOT NULL                                                                                      |

### `public.machine_alert_rule`

| Colonna         | Tipo            | Vincoli                                                                                |
| --------------- | --------------- | -------------------------------------------------------------------------------------- |
| `id`            | `integer`       | PK                                                                                     |
| `id_machine`    | `integer`       | NOT NULL, FK → `machine(id)`, indicizzata                                              |
| `id_alert_type` | `integer`       | NOT NULL, FK → `alert_type(id)`, indicizzata                                           |
| `enabled`       | `boolean`       | NOT NULL                                                                               |
| `threshold`     | `double precision` | NOT NULL                                                                            |
| `created_at`    | `timestamp`     | NOT NULL                                                                               |
| `updated_at`    | `timestamp`     | NOT NULL                                                                               |

Unique: `uq_machine_alert_rule_machine_type (id_machine, id_alert_type)` — una sola regola per coppia (macchina, tipo).

### `public.alert`

| Colonna                  | Tipo            | Vincoli                                                                                            |
| ------------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| `id`                     | `integer`       | PK                                                                                                 |
| `id_machine`             | `integer`       | NOT NULL, FK → `machine(id)`, indicizzata                                                          |
| `id_alert_type`          | `integer`       | NOT NULL, FK → `alert_type(id)`, indicizzata                                                       |
| `id_machine_alert_rule`  | `integer`       | NULL, FK → `machine_alert_rule(id)`, indicizzata                                                   |
| `status`                 | `varchar(20)`   | NOT NULL, CHECK `status IN ('active','resolved')`, indice `ix_alert_status`                        |
| `timestamp_start`        | `timestamp`     | NOT NULL, indicizzata                                                                              |
| `timestamp_end`          | `timestamp`     | NOT NULL, indicizzata                                                                              |
| `comments`               | `json`          | NOT NULL — payload strutturato (non testo libero)                                                  |
| `saved_by_user`          | `boolean`       | NOT NULL, default `false`, indicizzata                                                             |

Vincolo notevole — **un solo allarme attivo per coppia (macchina, tipo)**:

```sql
CREATE UNIQUE INDEX uq_alert_active_machine_type
ON public.alert (id_machine, id_alert_type)
WHERE ((status)::text = 'active'::text);
```

Implicazioni:

- In UI, lo stato "attivi" per una macchina ha al più una riga per `alert_type`.
- Lato backend, transizionare da `resolved` ad `active` non rischia duplicati ma può fallire se ne esiste già uno attivo dello stesso tipo: gestire l'eccezione lato service.

## 6. Tabelle non-dashboard (ignorate)

Il dump contiene anche `public.file_excel` e `public.generated_files` (con FK `file_excel_id → file_excel(id) ON DELETE CASCADE`). Riguardano un'altra pipeline (caricamento file Excel + invio IoT) e **non sono usate** dalla dashboard di telemetria. I modelli SQLAlchemy del backend possono ometterle.

## 7. Modelli SQLAlchemy — strategia

Scelte raccomandate per il backend:

- **Modelli scritti a mano** (preferito): si limita la mappatura alle tabelle realmente usate; più facile da rivedere. Esempio per `machine`:

  ```python
  class Machine(Base):
      __tablename__ = "machine"
      __table_args__ = {"schema": "public"}

      id: Mapped[int] = mapped_column(primary_key=True)
      name: Mapped[str] = mapped_column(String(50), nullable=False)
      machine_id: Mapped[str | None] = mapped_column(String(50), unique=True)
      iot_device_id: Mapped[str | None] = mapped_column(String(255), unique=True)
      plant_id: Mapped[int] = mapped_column(ForeignKey("public.plant.id", ondelete="CASCADE"))
      created_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
      modified_at: Mapped[datetime | None]
  ```

- **Automap** (`sqlalchemy.ext.automap`): valido per un avvio rapido, ma rende meno espliciti i tipi delle colonne e va combinato con Pydantic per il contratto API. Da evitare in produzione.
- **sqlacodegen**: utile come **generatore iniziale**, da rifinire poi a mano. Non lasciare il file generato senza pulizia.

> Tassativo: `Base.metadata.create_all()` **non va eseguito**. Lo schema è di sola lettura dal punto di vista del backend.

## 8. Configurazione connessione consigliata

```python
DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/device-manager"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"options": "-csearch_path=public"},  # compensa search_path vuoto
)
```

In alternativa, eseguire una volta:

```sql
ALTER ROLE postgres IN DATABASE "device-manager" SET search_path TO public;
```

Per evitare race in pool, è preferibile passare `options` nei `connect_args` come sopra.

## 9. Pattern di query ricorrenti

### 9.1 Time-series con bucket orario

```sql
SELECT date_trunc('hour', timestamp_utc) AS bucket,
       AVG(cpu_percent)    AS cpu_avg,
       AVG(memory_percent) AS mem_avg,
       AVG(disk_percent)   AS disk_avg
FROM public.telemetry_pc_stats
WHERE id_machine = :machine_id
  AND timestamp_utc >= :start
  AND timestamp_utc <  :end
GROUP BY 1
ORDER BY 1;
```

### 9.2 Allarmi attivi con join

```sql
SELECT a.id, a.timestamp_start, a.comments,
       t.code, t.description, t.severity,
       r.threshold
FROM public.alert a
JOIN public.alert_type t            ON t.id = a.id_alert_type
LEFT JOIN public.machine_alert_rule r ON r.id = a.id_machine_alert_rule
WHERE a.id_machine = :machine_id
  AND a.status = 'active'
ORDER BY t.severity DESC, a.timestamp_start DESC;
```

### 9.3 Summary giornaliera per severity

```sql
SELECT date_trunc('day', a.timestamp_start) AS day,
       t.severity,
       COUNT(*) AS n
FROM public.alert a
JOIN public.alert_type t ON t.id = a.id_alert_type
WHERE a.id_machine = :machine_id
  AND a.timestamp_start >= :start
  AND a.timestamp_start <  :end
GROUP BY 1, 2
ORDER BY 1, 2;
```
