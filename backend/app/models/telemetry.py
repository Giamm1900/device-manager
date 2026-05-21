from datetime import datetime

from sqlalchemy import Boolean, Double, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TelemetryPcStats(Base):
    __tablename__ = "telemetry_pc_stats"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    id_machine: Mapped[int] = mapped_column(
        ForeignKey("public.machine.id"), nullable=False, index=True
    )
    timestamp_utc: Mapped[datetime] = mapped_column(nullable=False, index=True)
    cpu_percent: Mapped[float | None] = mapped_column(Double)
    memory_percent: Mapped[float | None] = mapped_column(Double)
    disk_percent: Mapped[float | None] = mapped_column(Double)
    os_name: Mapped[str | None] = mapped_column(String(120))


class TelemetryIgnitionStats(Base):
    __tablename__ = "telemetry_ignition_stats"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    id_machine: Mapped[int] = mapped_column(
        ForeignKey("public.machine.id"), nullable=False, index=True
    )
    timestamp_utc: Mapped[datetime] = mapped_column(nullable=False, index=True)
    process_cpu_load_percent: Mapped[float | None] = mapped_column(Double)
    jvm_memory_percent: Mapped[float | None] = mapped_column(Double)
    db_status: Mapped[str | None] = mapped_column(String(20))


class TelemetryDataSender(Base):
    __tablename__ = "telemetry_data_sender"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    id_machine: Mapped[int] = mapped_column(
        ForeignKey("public.machine.id"), nullable=False, index=True
    )
    event_subtype: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    parquet_subfolder: Mapped[str | None] = mapped_column(String(255))
    parquet_filename: Mapped[str | None] = mapped_column(String(255))
    rows_count: Mapped[int | None]
    processing_timestamp_utc: Mapped[datetime | None] = mapped_column(index=True)


class EdgeClientStatus(Base):
    __tablename__ = "edge_client_status"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    id_machine: Mapped[int] = mapped_column(
        ForeignKey("public.machine.id"), nullable=False, index=True
    )
    value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    timestamp_utc: Mapped[datetime] = mapped_column(nullable=False, index=True)
