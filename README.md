# Industrial Telemetry Dashboard

Web app per il monitoraggio storico dello stato di salute di un parco macchinari industriali.

**Stack**: PostgreSQL 17 · FastAPI · SQLAlchemy 2 · React + Vite + TailwindCSS + ECharts

---

## Prerequisiti

| Strumento | Versione minima |
|-----------|----------------|
| Docker + Docker Compose | qualsiasi versione recente |
| Python | 3.12+ |
| Node.js | 20+ |

Il file `backup-dm-dev.sql` (dump del DB, non versionato) deve essere presente nella root del repo.

---

## Avvio rapido — tutto in Docker

Avvia database e API in background, poi il frontend in dev mode:

```bash
docker-compose up -d
cd dm-front && npm install && npm run dev
```

Il database viene ripristinato automaticamente al primo avvio del container postgres tramite `docker/init-db.sh`.

| Servizio | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Docs API | http://localhost:8000/docs |

---

## Avvio in sviluppo — backend locale

Usa questa modalità se vuoi modificare il backend senza rebuild Docker.

### 1. Avvia solo il database

```bash
docker-compose up -d postgres
```

Oppure punta a un'istanza PostgreSQL locale (vedi sezione Variabili d'ambiente).

### 2. Configura l'ambiente del backend

Crea (o aggiorna) `backend/.env.local`:

```env
# Opzione A — stringa di connessione completa
DATABASE_URL=postgresql+psycopg://postgres:<password>@localhost:5432/device-manager

# Opzione B — parti separate (il backend le assembla)
DB_USERNAME=postgres
DB_PASSWORD=<password>
DB_URL=localhost:5432/device-manager
```

> Se usi PostgreSQL locale su porta diversa (es. 5434) cambia la porta di conseguenza.

### 3. Crea il virtual environment e installa le dipendenze

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -e .
```

### 4. Avvia il backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Avvia il frontend

In un altro terminale, dalla root del repo:

```bash
cd dm-front
npm install
npm run dev
```

---

## Variabili d'ambiente

### Backend (`backend/.env.local`)

| Variabile | Descrizione | Esempio |
|-----------|------------|---------|
| `DATABASE_URL` | Stringa di connessione completa (ha precedenza sulle tre sotto) | `postgresql+psycopg://postgres:postgres@localhost:5432/device-manager` |
| `DB_USERNAME` | Utente PostgreSQL | `postgres` |
| `DB_PASSWORD` | Password PostgreSQL | `postgres` |
| `DB_URL` | Host, porta e nome DB | `localhost:5432/device-manager` |

In Docker le variabili sono già impostate nel `docker-compose.yml` e non serve `.env.local`.

### Frontend

Nessuna variabile richiesta. Vite proxia automaticamente `/api/*` verso `http://localhost:8000` (configurato in `dm-front/vite.config.ts`).

---

## Ripristino manuale del database

Se il container postgres esiste già e il DB non è stato ripristinato:

```bash
docker exec -i postgres bash -c \
  "psql -U postgres -d postgres -c 'CREATE DATABASE \"device-manager\";' && \
   grep -v '^\\\\restrict' /dump/backup-dm-dev.sql | psql -U postgres -d device-manager"
```

Per ripristinare da zero (distrugge i dati esistenti):

```bash
docker-compose down -v
docker-compose up -d postgres
```

---

## Troubleshooting

**Il container postgres non diventa healthy**
Attendi qualche secondo in più — il restore del dump al primo avvio può richiedere 30–60 secondi. Controlla i log con `docker-compose logs postgres`.

**`search_path` vuoto / relazione non trovata**
Il dump imposta `search_path = ''`. Assicurati che la stringa di connessione includa `options=-csearch_path=public` oppure che `DB_URL` punti a un utente configurato con `SET search_path TO public`.

**Il nome del database contiene un trattino**
`device-manager` va sempre quotato nelle stringhe di connessione psql. Nei connect string SQLAlchemy il trattino è gestito automaticamente.

**CORS error dal frontend**
Verifica che l'API sia raggiungibile su `http://localhost:8000` e che `CORS_ORIGINS` in `docker-compose.yml` (o `cors_origins` in `.env.local`) includa `http://localhost:5173`.
