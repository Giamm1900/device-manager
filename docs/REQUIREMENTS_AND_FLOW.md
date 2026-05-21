# Requirements & Operational Flow

## 1. Requisiti funzionali

### 1.1 Filtri globali

L'header della dashboard espone tre menu a tendina **a cascata**:

1. **Cliente** — popolato da `customer.name`.
2. **Impianto** — popolato da `plant.name` filtrato per `customer_id` selezionato.
3. **Macchina** — popolato da `machine.name` filtrato per `plant_id` selezionato.

La selezione di una macchina è prerequisito per il rendering dei pannelli di telemetria. Le opzioni dei livelli superiori sono ricalcolate quando un livello inferiore viene resettato.

### 1.2 Time picker

Selettore di intervallo temporale **in UTC** (mostrato in TZ locale all'utente):

- preset rapidi: ultime 1h / 6h / 24h / 7 giorni / 30 giorni;
- range custom con due `datetime-local`.

Il range scelto viene applicato a tutti i pannelli simultaneamente.

### 1.3 Metriche hardware PC

Sorgente: `public.telemetry_pc_stats`.

Visualizzazione di tre line chart sincronizzati (asse X = `timestamp_utc`):

- `cpu_percent`
- `memory_percent`
- `disk_percent`

Per range > 24h il backend restituisce una serie **già aggregata** (media e p95 per bucket orario o giornaliero); per range ≤ 24h restituisce i punti grezzi.

### 1.4 Metriche Ignition

Sorgente: `public.telemetry_ignition_stats`.

- line chart per `process_cpu_load_percent`;
- line chart per `jvm_memory_percent`;
- KPI a colpo d'occhio con l'ultimo `db_status` osservato nel range (campo `varchar(20)`, valori osservati lato dump: tipicamente `OK` / stati di errore).

### 1.5 Trasferimento dati Parquet

Sorgente: `public.telemetry_data_sender`.

Tabella paginata con colonne:

- `processing_timestamp_utc` (ordinabile, default desc);
- `event_subtype`;
- `parquet_subfolder` / `parquet_filename`;
- `rows_count`.

Header con totali: numero di chunk e somma `rows_count` nel range.

### 1.6 Edge client status

Sorgente: `public.edge_client_status`.

Strip-chart binario (online/offline) nel range, e KPI "% uptime" calcolata lato server come `SUM(durata_segmento_online) / durata_range`.

### 1.7 Gestione allarmi

Sorgenti: `public.alert`, `public.alert_type`, `public.machine_alert_rule`.

- Pannello "Allarmi attivi": elenco di `alert` con `status = 'active'` per la macchina selezionata, raggruppati per `severity` (`low` | `medium` | `high` | `critical`) — il colore segue la severity.
- Heatmap o tabella "Storico nel range": conteggio degli `alert` con `status = 'resolved'` per (giorno × severity).
- Per ogni allarme, dettaglio con `alert_type.code`, `alert_type.description`, `timestamp_start`, `timestamp_end`, `comments` (json), `machine_alert_rule.threshold` se collegato.

> Nota schema: esiste un indice unico parziale `uq_alert_active_machine_type` su `(id_machine, id_alert_type) WHERE status = 'active'`. Significa che **non possono coesistere due allarmi attivi dello stesso tipo sulla stessa macchina**: il frontend può assumere unicità nella lista attivi.

## 2. Endpoint REST (proposta)

Prefisso comune: `/api/v1`. Tutte le date sono ISO-8601 in UTC.

| Verbo | Path                                                          | Descrizione                                                                  |
| ----- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| GET   | `/customers`                                                  | Elenco clienti                                                               |
| GET   | `/customers/{id}/plants`                                      | Impianti di un cliente                                                       |
| GET   | `/plants/{id}/machines`                                       | Macchine di un impianto                                                      |
| GET   | `/machines/{id}`                                              | Dettaglio macchina (con plant e customer espansi)                            |
| GET   | `/telemetry/pc-stats?machine_id&start&end&bucket=raw\|1h\|1d` | Serie PC stats                                                               |
| GET   | `/telemetry/ignition-stats?machine_id&start&end&bucket=...`   | Serie Ignition                                                               |
| GET   | `/telemetry/data-sender?machine_id&start&end&page&page_size`  | Lista paginata chunk Parquet                                                 |
| GET   | `/telemetry/edge-status?machine_id&start&end`                 | Serie binaria + KPI uptime                                                   |
| GET   | `/alerts/active?machine_id`                                   | Allarmi attivi per macchina                                                  |
| GET   | `/alerts?machine_id&start&end&status&severity&page&page_size` | Storico allarmi filtrato                                                     |
| GET   | `/alerts/summary?machine_id&start&end`                        | Aggregato per severity × giorno                                              |

### 2.1 Convenzioni

- Errori in formato RFC 7807 (`application/problem+json`).
- Risposte paginate: `{ "items": [...], "page": 1, "page_size": 50, "total": 1234 }`.
- I parametri `start` ed `end` sono **obbligatori** sugli endpoint time-series e validati con `start < end` e range massimo configurabile (default 90 giorni).

## 3. Flusso operativo

```
[Macchine] ──telemetry──▶ [PostgreSQL `device-manager`]
                                  ▲
                                  │ SQLAlchemy (read-only consigliato)
                                  │
                          [FastAPI /api/v1]
                                  ▲
                                  │ fetch JSON
                                  │
                          [React Dashboard]
                                  ▲
                                  │
                               [Utente]
```

### 3.1 Sequenza di una richiesta tipica

1. L'utente seleziona `Cliente → Impianto → Macchina = M` e range `[start, end]`.
2. Il frontend lancia in parallelo le chiamate ai pannelli abilitati (`pc-stats`, `ignition-stats`, `data-sender`, `edge-status`, `alerts/active`, `alerts/summary`).
3. Per ogni endpoint, FastAPI:
   - valida il payload con Pydantic;
   - decide il `bucket` (raw o aggregato) in base alla durata del range;
   - costruisce la query SQLAlchemy filtrando su `id_machine` e sulla colonna `timestamp_utc` (o `processing_timestamp_utc`/`timestamp_start` a seconda della tabella);
   - serializza il risultato come `{"series": [{"t": "...", "value": ...}, ...]}` o come collezione paginata.
4. Il frontend aggiorna lo stato globale dei filtri e renderizza ECharts e tabelle.

### 3.2 Aggregazione lato server

Per evitare grafici illeggibili e payload enormi, gli endpoint time-series accettano `bucket`:

- `raw` — restituisce i punti come sono (consigliato solo per range ≤ 6h);
- `1h` — `date_trunc('hour', timestamp_utc)` + `AVG()` per metrica;
- `1d` — `date_trunc('day', timestamp_utc)` + `AVG()` e `MAX()` per metrica.

Il backend sceglie automaticamente `bucket` in base alla durata del range se il client passa `bucket=auto`.

### 3.3 Cache (opzionale)

Cache lato API (in-memory o Redis) con chiave `(endpoint, machine_id, start, end, bucket)` e TTL di 30s — utile se il frontend fa polling per "near real-time". Da considerare solo se necessario; non parte del minimo richiesto.

## 4. Out of scope (per ora)

- Autenticazione/autorizzazione utenti.
- Push real-time (WebSocket/SSE).
- Editing dei `machine_alert_rule.threshold` da UI.
- Tabelle `file_excel` e `generated_files` presenti nel dump: non fanno parte della dashboard di telemetria e sono ignorate.
