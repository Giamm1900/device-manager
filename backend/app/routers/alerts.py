from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select, text
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.alarm import Alert, AlertType, MachineAlertRule
from app.schemas.alerts import (
    AlertDetailOut,
    AlertListResponse,
    AlertRuleInfo,
    AlertSummaryItem,
    AlertSummaryResponse,
    AlertTypeInfo,
)

router = APIRouter(tags=["alerts"])

_SEVERITY_ORDER = case(
    (AlertType.severity == "critical", 4),
    (AlertType.severity == "high", 3),
    (AlertType.severity == "medium", 2),
    (AlertType.severity == "low", 1),
    else_=0,
)


def _to_alert_detail(alert: Alert, alert_type: AlertType, rule: MachineAlertRule | None) -> AlertDetailOut:
    return AlertDetailOut(
        id=alert.id,
        id_machine=alert.id_machine,
        status=alert.status,
        timestamp_start=alert.timestamp_start,
        timestamp_end=alert.timestamp_end,
        comments=alert.comments,
        saved_by_user=alert.saved_by_user,
        alert_type=AlertTypeInfo(
            id=alert_type.id,
            code=alert_type.code,
            description=alert_type.description,
            severity=alert_type.severity,
        ),
        machine_alert_rule=AlertRuleInfo(
            id=rule.id,
            enabled=rule.enabled,
            threshold=rule.threshold,
        ) if rule else None,
    )


@router.get("/alerts/active", response_model=list[AlertDetailOut])
def get_active_alerts(machine_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Alert, AlertType, MachineAlertRule)
        .join(AlertType, Alert.id_alert_type == AlertType.id)
        .outerjoin(MachineAlertRule, Alert.id_machine_alert_rule == MachineAlertRule.id)
        .where(Alert.id_machine == machine_id, Alert.status == "active")
        .order_by(_SEVERITY_ORDER.desc(), Alert.timestamp_start.desc())
    ).all()
    return [_to_alert_detail(a, at, rule) for a, at, rule in rows]


@router.get("/alerts", response_model=AlertListResponse)
def list_alerts(
    machine_id: int,
    start: datetime | None = None,
    end: datetime | None = None,
    status: Literal["active", "resolved"] | None = None,
    severity: Literal["low", "medium", "high", "critical"] | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    conditions = [Alert.id_machine == machine_id]
    if start:
        conditions.append(Alert.timestamp_start >= start)
    if end:
        conditions.append(Alert.timestamp_start < end)
    if status:
        conditions.append(Alert.status == status)
    if severity:
        conditions.append(AlertType.severity == severity)

    total = db.scalar(
        select(func.count(Alert.id))
        .join(AlertType, Alert.id_alert_type == AlertType.id)
        .where(*conditions)
    )
    rows = db.execute(
        select(Alert, AlertType, MachineAlertRule)
        .join(AlertType, Alert.id_alert_type == AlertType.id)
        .outerjoin(MachineAlertRule, Alert.id_machine_alert_rule == MachineAlertRule.id)
        .where(*conditions)
        .order_by(_SEVERITY_ORDER.desc(), Alert.timestamp_start.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return AlertListResponse(
        items=[_to_alert_detail(a, at, rule) for a, at, rule in rows],
        page=page,
        page_size=page_size,
        total=total,
    )


@router.get("/alerts/summary", response_model=AlertSummaryResponse)
def get_alerts_summary(
    machine_id: int,
    start: datetime | None = None,
    end: datetime | None = None,
    db: Session = Depends(get_db),
):
    conditions = [Alert.id_machine == machine_id]
    if start:
        conditions.append(Alert.timestamp_start >= start)
    if end:
        conditions.append(Alert.timestamp_start < end)

    rows = db.execute(
        select(
            func.date_trunc("day", Alert.timestamp_start).label("day"),
            AlertType.severity,
            func.count().label("count"),
        )
        .join(AlertType, Alert.id_alert_type == AlertType.id)
        .where(*conditions)
        .group_by(text("1"), AlertType.severity)
        .order_by(text("1"), AlertType.severity)
    ).all()
    return AlertSummaryResponse(
        items=[
            AlertSummaryItem(day=r.day.date().isoformat(), severity=r.severity, count=int(r.alert_count))
            for r in rows
        ]
    )
