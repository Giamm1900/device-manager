# Diagrammi (ER & UML)

I blocchi Mermaid sotto sono visualizzabili direttamente su GitHub, GitLab, Notion, Obsidian o VS Code con l'estensione Markdown Preview Mermaid Support.

## 1. Diagramma ER (schema effettivo del dump)

```mermaid
erDiagram
    CUSTOMER {
        integer id PK
        varchar(50) name "UNIQUE"
        varchar(100) adx_database
        timestamptz created_at
        timestamptz modified_at
    }
    PLANT {
        integer id PK
        varchar(50) name
        varchar(50) city
        integer customer_id FK
        timestamptz created_at
        timestamptz modified_at
    }
    MACHINE {
        integer id PK
        varchar(50) name
        varchar(50) machine_id "UNIQUE"
        varchar(255) iot_device_id "UNIQUE"
        integer plant_id FK
        timestamptz created_at
        timestamptz modified_at
    }
    TELEMETRY_PC_STATS {
        integer id PK
        integer id_machine FK
        timestamp timestamp_utc
        double cpu_percent
        double memory_percent
        double disk_percent
        varchar(120) os_name
    }
    TELEMETRY_IGNITION_STATS {
        integer id PK
        integer id_machine FK
        timestamp timestamp_utc
        double process_cpu_load_percent
        double jvm_memory_percent
        varchar(20) db_status
    }
    TELEMETRY_DATA_SENDER {
        integer id PK
        integer id_machine FK
        varchar(40) event_subtype
        varchar(255) parquet_subfolder
        varchar(255) parquet_filename
        integer rows_count
        timestamp processing_timestamp_utc
    }
    EDGE_CLIENT_STATUS {
        integer id PK
        integer id_machine FK
        boolean value
        timestamp timestamp_utc
    }
    ALERT_TYPE {
        integer id PK
        varchar(120) code "UNIQUE"
        varchar(255) description
        varchar(20) severity "CHECK in (low,medium,high,critical)"
        timestamp created_at
        timestamp updated_at
    }
    MACHINE_ALERT_RULE {
        integer id PK
        integer id_machine FK
        integer id_alert_type FK
        boolean enabled
        double threshold
        timestamp created_at
        timestamp updated_at
    }
    ALERT {
        integer id PK
        integer id_machine FK
        integer id_alert_type FK
        integer id_machine_alert_rule FK
        varchar(20) status "CHECK in (active,resolved)"
        timestamp timestamp_start
        timestamp timestamp_end
        json comments
        boolean saved_by_user
    }

    CUSTOMER ||--o{ PLANT : "has"
    PLANT    ||--o{ MACHINE : "contains"
    MACHINE  ||--o{ TELEMETRY_PC_STATS       : "emits"
    MACHINE  ||--o{ TELEMETRY_IGNITION_STATS : "emits"
    MACHINE  ||--o{ TELEMETRY_DATA_SENDER    : "emits"
    MACHINE  ||--o{ EDGE_CLIENT_STATUS       : "emits"
    MACHINE  ||--o{ ALERT                    : "triggers"
    MACHINE  ||--o{ MACHINE_ALERT_RULE       : "is configured by"
    ALERT_TYPE ||--o{ ALERT                  : "classifies"
    ALERT_TYPE ||--o{ MACHINE_ALERT_RULE     : "parametrizes"
    MACHINE_ALERT_RULE ||--o{ ALERT          : "raises (optional)"
```

> Tabelle `file_excel` e `generated_files` esistono nel dump ma sono fuori dallo scope della dashboard e omesse di proposito.

## 2. Diagramma di sequenza — caricamento pannello PC stats

```mermaid
sequenceDiagram
    actor User
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant DB as PostgreSQL (device-manager)

    User->>UI: Sceglie Customer → Plant → Machine, range "Ultime 24h"
    UI->>API: GET /api/v1/telemetry/pc-stats?machine_id=42&start=...&end=...&bucket=auto
    activate API
    API->>API: Valida con Pydantic, decide bucket=1h
    API->>DB: SELECT date_trunc('hour',...), AVG(cpu/mem/disk) FROM public.telemetry_pc_stats WHERE id_machine=42 AND timestamp_utc IN [start,end)
    activate DB
    DB-->>API: rows (bucket, cpu_avg, mem_avg, disk_avg)
    deactivate DB
    API-->>UI: 200 OK { "series": [...] }
    deactivate API
    UI->>UI: ECharts setOption con la serie ricevuta
    UI-->>User: Grafico CPU/RAM/Disco renderizzato
```

## 3. Diagramma di flusso — selezione filtri a cascata

```mermaid
flowchart TD
    A[Load dashboard] --> B[GET /customers]
    B --> C{Customer selected?}
    C -- no --> C
    C -- yes --> D[GET /customers/&#123;id&#125;/plants]
    D --> E{Plant selected?}
    E -- no --> E
    E -- yes --> F[GET /plants/&#123;id&#125;/machines]
    F --> G{Machine selected?}
    G -- no --> G
    G -- yes --> H[Read time range from picker]
    H --> I[Parallel fetch:<br/>pc-stats, ignition-stats,<br/>data-sender, edge-status,<br/>alerts/active, alerts/summary]
    I --> J[Render dashboard panels]
```

## 4. Componenti frontend (vista logica)

```mermaid
flowchart LR
    subgraph Pages
        D[Dashboard.tsx]
    end
    subgraph Features
        F1[filters/CascadingFilters]
        F2[filters/TimeRangePicker]
        F3[pc-stats/PcStatsPanel]
        F4[ignition-stats/IgnitionPanel]
        F5[data-sender/DataSenderTable]
        F6[edge-status/EdgeStatusStrip]
        F7[alerts/ActiveAlerts]
        F8[alerts/AlertHistory]
    end
    subgraph API client
        C1[api/customers.ts]
        C2[api/telemetry.ts]
        C3[api/alerts.ts]
    end

    D --> F1 --> C1
    D --> F2
    D --> F3 --> C2
    D --> F4 --> C2
    D --> F5 --> C2
    D --> F6 --> C2
    D --> F7 --> C3
    D --> F8 --> C3
```
