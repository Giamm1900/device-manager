from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.telemetry import (
    EdgeClientStatus,
    TelemetryDataSender,
    TelemetryIgnitionStats,
    TelemetryPcStats,
)
from app.schemas.filters import TimeRangeParams
from app.schemas.telemetry import (
    DataSenderItem,
    DataSenderResponse,
    EdgeStatusPoint,
    EdgeStatusResponse,
    IgnitionStatPoint,
    IgnitionStatsResponse,
    PcStatPoint,
    PcStatsResponse,
)

router = APIRouter(tags=["telemetry"])


def _resolve_bucket(bucket: str, start, end) -> str:
    if bucket != "auto":
        return bucket
    delta = end - start
    if delta <= timedelta(hours=6):
        return "raw"
    if delta <= timedelta(days=7):
        return "1h"
    return "1d"


@router.get("/telemetry/pc-stats", response_model=PcStatsResponse)
def get_pc_stats(filters: TimeRangeParams = Depends(), db: Session = Depends(get_db)):
    resolved = _resolve_bucket(filters.bucket, filters.start, filters.end)
    where = (
        TelemetryPcStats.id_machine == filters.machine_id,
        TelemetryPcStats.timestamp_utc >= filters.start,
        TelemetryPcStats.timestamp_utc < filters.end,
    )
    if resolved == "raw":
        rows = db.execute(
            select(
                TelemetryPcStats.timestamp_utc,
                TelemetryPcStats.cpu_percent,
                TelemetryPcStats.memory_percent,
                TelemetryPcStats.disk_percent,
            )
            .where(*where)
            .order_by(TelemetryPcStats.timestamp_utc)
        ).all()
        series = [
            PcStatPoint(t=r.timestamp_utc, cpu=r.cpu_percent, memory=r.memory_percent, disk=r.disk_percent)
            for r in rows
        ]
    elif resolved == "1h":
        rows = db.execute(
            select(
                func.date_trunc("hour", TelemetryPcStats.timestamp_utc).label("t"),
                func.avg(TelemetryPcStats.cpu_percent).label("cpu"),
                func.avg(TelemetryPcStats.memory_percent).label("memory"),
                func.avg(TelemetryPcStats.disk_percent).label("disk"),
            )
            .where(*where)
            .group_by(text("1"))
            .order_by(text("1"))
        ).all()
        series = [PcStatPoint(**r._mapping) for r in rows]
    else:  # 1d
        rows = db.execute(
            select(
                func.date_trunc("day", TelemetryPcStats.timestamp_utc).label("t"),
                func.avg(TelemetryPcStats.cpu_percent).label("cpu"),
                func.avg(TelemetryPcStats.memory_percent).label("memory"),
                func.avg(TelemetryPcStats.disk_percent).label("disk"),
                func.max(TelemetryPcStats.cpu_percent).label("cpu_max"),
                func.max(TelemetryPcStats.memory_percent).label("memory_max"),
                func.max(TelemetryPcStats.disk_percent).label("disk_max"),
            )
            .where(*where)
            .group_by(text("1"))
            .order_by(text("1"))
        ).all()
        series = [PcStatPoint(**r._mapping) for r in rows]
    return PcStatsResponse(bucket=resolved, series=series)


@router.get("/telemetry/ignition-stats", response_model=IgnitionStatsResponse)
def get_ignition_stats(filters: TimeRangeParams = Depends(), db: Session = Depends(get_db)):
    resolved = _resolve_bucket(filters.bucket, filters.start, filters.end)
    where = (
        TelemetryIgnitionStats.id_machine == filters.machine_id,
        TelemetryIgnitionStats.timestamp_utc >= filters.start,
        TelemetryIgnitionStats.timestamp_utc < filters.end,
    )
    if resolved == "raw":
        rows = db.execute(
            select(
                TelemetryIgnitionStats.timestamp_utc,
                TelemetryIgnitionStats.process_cpu_load_percent,
                TelemetryIgnitionStats.jvm_memory_percent,
                TelemetryIgnitionStats.db_status,
            )
            .where(*where)
            .order_by(TelemetryIgnitionStats.timestamp_utc)
        ).all()
        series = [
            IgnitionStatPoint(
                t=r.timestamp_utc,
                cpu=r.process_cpu_load_percent,
                jvm_memory=r.jvm_memory_percent,
                db_status=r.db_status,
            )
            for r in rows
        ]
    else:
        trunc = "hour" if resolved == "1h" else "day"
        stmt = text(f"""
            SELECT
                date_trunc('{trunc}', timestamp_utc) AS t,
                AVG(process_cpu_load_percent)         AS cpu,
                AVG(jvm_memory_percent)               AS jvm_memory,
                (array_agg(db_status ORDER BY timestamp_utc DESC))[1] AS db_status
            FROM public.telemetry_ignition_stats
            WHERE id_machine = :machine_id
              AND timestamp_utc >= :start
              AND timestamp_utc < :end
            GROUP BY 1
            ORDER BY 1
        """)
        rows = db.execute(
            stmt,
            {"machine_id": filters.machine_id, "start": filters.start, "end": filters.end},
        ).all()
        series = [IgnitionStatPoint(**r._mapping) for r in rows]

    latest_db_status = db.scalar(
        select(TelemetryIgnitionStats.db_status)
        .where(*where)
        .order_by(TelemetryIgnitionStats.timestamp_utc.desc())
        .limit(1)
    )
    return IgnitionStatsResponse(bucket=resolved, latest_db_status=latest_db_status, series=series)


@router.get("/telemetry/data-sender", response_model=DataSenderResponse)
def get_data_sender(
    filters: TimeRangeParams = Depends(),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=1440),
    db: Session = Depends(get_db),
):
    # NB: includiamo anche i chunk con parquet_filename NULL: rappresentano
    # gli invii senza file scritto (resi "rossi" nella heatmap).
    where = (
        TelemetryDataSender.id_machine == filters.machine_id,
        TelemetryDataSender.event_subtype == 'data_sender_parquet_chunk',
        TelemetryDataSender.processing_timestamp_utc >= filters.start,
        TelemetryDataSender.processing_timestamp_utc < filters.end,
    )
    total = db.scalar(select(func.count(TelemetryDataSender.id)).where(*where)) or 0
    total_rows = db.scalar(
        select(func.coalesce(func.sum(TelemetryDataSender.rows_count), 0)).where(*where)
    ) or 0
    items = [
        DataSenderItem.model_validate(row)
        for row in db.scalars(
            select(TelemetryDataSender)
            .where(*where)
            .order_by(TelemetryDataSender.processing_timestamp_utc.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    ]
    return DataSenderResponse(
        items=list(items),
        page=page,
        page_size=page_size,
        total=total,
        total_rows=total_rows,
    )


@router.get("/telemetry/edge-status", response_model=EdgeStatusResponse)
def get_edge_status(filters: TimeRangeParams = Depends(), db: Session = Depends(get_db)):
    rows = db.execute(
        select(EdgeClientStatus.timestamp_utc, EdgeClientStatus.value)
        .where(
            EdgeClientStatus.id_machine == filters.machine_id,
            EdgeClientStatus.timestamp_utc >= filters.start,
            EdgeClientStatus.timestamp_utc < filters.end,
        )
        .order_by(EdgeClientStatus.timestamp_utc)
    ).all()

    series = [EdgeStatusPoint(t=r.timestamp_utc, online=r.value) for r in rows]

    end_naive   = filters.end.replace(tzinfo=None)
    start_naive = filters.start.replace(tzinfo=None)
    total_duration = (end_naive - start_naive).total_seconds()
    if not rows or total_duration == 0:
        uptime_percent = 0.0
    else:
        online_seconds = 0.0
        for i, row in enumerate(rows):
            t_cur = row.timestamp_utc.replace(tzinfo=None)
            t_next = rows[i + 1].timestamp_utc.replace(tzinfo=None) if i + 1 < len(rows) else end_naive
            duration = (t_next - t_cur).total_seconds()
            if row.value:
                online_seconds += duration
        uptime_percent = round(online_seconds / total_duration * 100, 2)

    return EdgeStatusResponse(uptime_percent=uptime_percent, series=series)
