# Task tirocinio: Dashboard

## Incarico

Partendo da un **dump del database di sviluppo**, costruite una **Dashboard** secondo la vostra idea.

Stack atteso, in sintesi:

1. Ripristinare il database **PostgreSQL** dal dump
2. Backend in **FastAPI** collegato a quel database
3. Frontend in **React** per la pagina Dashboard

## Cosa ricevete

- File dump PostgreSQL (dev)

## Contesto: telemetria e Dashboard

Il database descrive un parco **macchine industriali** organizzato per cliente e impianto. Ogni macchina invia nel tempo **dati di telemetria**: metriche di sistema, stato del gateway Ignition, eventi legati alla creazione dei file parquet con i dati di processo.

Nel dump troverete, tra le altre cose, tabelle storiche del tipo:

- `telemetry_pc_stats` — CPU, RAM e disco del PC
- `telemetry_ignition_stats` — carico CPU processo, RAM, stato DB
- `telemetry_data_sender` — chunk parquet (nome file, righe scritte, timestamp)

La Dashboard serve a **leggere questi dati nel tempo** e capire se una macchina sta lavorando bene: filtri per macchina e periodo, andamenti (grafici, tabelle, heatmap…), eventuali sintesi a colpo d’occhio. Come impostare layout e visualizzazioni è una scelta vostra.

## Cosa consegnate

Progetto avviabile con un **README** (setup DB, API, frontend).
