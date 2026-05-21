from datetime import datetime

from sqlalchemy import Boolean, Double, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class AlertType(Base):
    __tablename__ = "alert_type"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)


class MachineAlertRule(Base):
    __tablename__ = "machine_alert_rule"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    id_machine: Mapped[int] = mapped_column(
        ForeignKey("public.machine.id"), nullable=False, index=True
    )
    id_alert_type: Mapped[int] = mapped_column(
        ForeignKey("public.alert_type.id"), nullable=False, index=True
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    threshold: Mapped[float] = mapped_column(Double, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)


class Alert(Base):
    __tablename__ = "alert"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    id_machine: Mapped[int] = mapped_column(
        ForeignKey("public.machine.id"), nullable=False, index=True
    )
    id_alert_type: Mapped[int] = mapped_column(
        ForeignKey("public.alert_type.id"), nullable=False, index=True
    )
    id_machine_alert_rule: Mapped[int | None] = mapped_column(
        ForeignKey("public.machine_alert_rule.id"), index=True
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    timestamp_start: Mapped[datetime] = mapped_column(nullable=False, index=True)
    timestamp_end: Mapped[datetime] = mapped_column(nullable=False, index=True)
    comments: Mapped[dict] = mapped_column(JSON, nullable=False)
    saved_by_user: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false", index=True
    )
