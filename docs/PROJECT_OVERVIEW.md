# Industrial Telemetry Dashboard — Project Overview

## Obiettivo

Web app full-stack per il monitoraggio storico (e quasi-real-time, in polling) dello stato di salute di un parco macchinari industriali, partendo dal dump del database di sviluppo `device-manager`.

Il sistema espone, per ogni macchina selezionata e per un intervallo temporale scelto:

- andamento risorse hardware del PC host (CPU, RAM, disco);
- stato del gateway Ignition (CPU del processo, RAM JVM, stato DB);
- log dei file Parquet generati dal Data Sender;
- stato di connessione dell'edge client;
- allarmi attivi e risolti, incrociati con la severity.

## Stack tecnologico

| Layer        | Tecnologia                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| Database     | PostgreSQL 16 (ripristinato dal dump `backup-dm-dev` in formato custom)    |
| Backend      | Python 3.11+, FastAPI, SQLAlchemy 2.x (Core + ORM), Pydantic v2            |
| Frontend     | React + TypeScript, Vite, TailwindCSS, ECharts (per i grafici time-series) |
| Orchestrazione | Docker + docker-compose (DB e backend; il frontend dev si avvia con Vite) |

## Struttura del repository (target)

```
dm-dev/
├── backup-dm-dev                # Dump PostgreSQL custom-format (fornito)
├── docker-compose.yml           # postgres + api
├── docs/                        # Documentazione di progetto (questo file e correlati)
│   ├── PROJECT_OVERVIEW.md
│   ├── REQUIREMENTS_AND_FLOW.md
│   ├── DATABASE_ARCHITECTURE.md
│   └── DIAGRAMS.md
├── backend/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── db.py                # engine, session, search_path
│   │   ├── models/              # modelli SQLAlchemy (riflettono lo schema esistente)
│   │   ├── schemas/             # modelli Pydantic
│   │   ├── routers/             # endpoint REST
│   │   └── services/            # query/aggregazioni
│   └── tests/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── api/                 # client tipizzato verso /api/v1
        ├── components/
        ├── features/
        │   ├── filters/         # cliente → impianto → macchina + time picker
        │   ├── pc-stats/
        │   ├── ignition-stats/
        │   ├── data-sender/
        │   └── alerts/
        └── pages/Dashboard.tsx
```

## Fasi di consegna

1. **Setup DB** — `docker-compose up postgres`, ripristino del dump custom-format via `pg_restore`. Il dump non crea il database: il container ne crea uno vuoto e `pg_restore --create` ricrea `device-manager` dal dump.
2. **Backend skeleton** — connessione, modelli sulle tabelle esistenti, endpoint per la gerarchia asset (customer/plant/machine) per popolare i filtri.
3. **Endpoint telemetria** — PC stats, Ignition stats, Data Sender, Edge Client Status; aggregazione opzionale lato server (es. bucket orari) per range ampi.
4. **Endpoint allarmi** — lista paginata + summary per severity/status.
5. **Frontend** — filtri a cascata, time picker, grafici time-series, tabella file Parquet, pannello allarmi.
6. **README di consegna** — istruzioni di avvio (`docker-compose up` e `npm run dev`), variabili d'ambiente, troubleshooting comuni (encoding, search_path, porte).

## Vincoli non funzionali

- **Schema immutabile dal codice**: il backend NON deve eseguire `Base.metadata.create_all()`. Lo schema è gestito dal dump.
- **Encoding e locale**: il dump è in `UTF8` con `LOCALE=C`. Il container Postgres deve avere la stessa codifica.
- **`search_path` vuoto**: il dump imposta `search_path = ''`. Il backend deve o qualificare ogni oggetto con `public.` o impostare `SET search_path TO public` per sessione/utente.
- **Nome del database**: `device-manager` (con trattino) — va sempre quotato nelle stringhe di connessione.
- **Timestamp**: le tabelle di telemetria usano `timestamp without time zone` con valori in UTC (per convenzione del campo `timestamp_utc`); il backend tratta tutti i tempi come UTC e converte alla TZ utente solo in UI.

## Deliverable finale

Repo Git pubblicabile, avviabile con:

```bash
docker-compose up -d postgres
docker-compose run --rm api pg_restore --clean --create -d postgres /dump/backup-dm-dev
docker-compose up -d api
cd frontend && npm install && npm run dev
```

E `README.md` in root che riassume questi passi (dettagliati in [REQUIREMENTS_AND_FLOW.md](REQUIREMENTS_AND_FLOW.md) e [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)).
