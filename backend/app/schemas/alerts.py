from datetime import datetime

from pydantic import BaseModel


class AlertTypeInfo(BaseModel):
    id: int
    code: str
    description: str
    severity: str


class AlertRuleInfo(BaseModel):
    id: int
    enabled: bool
    threshold: float


class AlertDetailOut(BaseModel):
    id: int
    id_machine: int
    status: str
    timestamp_start: datetime
    timestamp_end: datetime
    comments: dict
    saved_by_user: bool
    alert_type: AlertTypeInfo
    machine_alert_rule: AlertRuleInfo | None


class AlertListResponse(BaseModel):
    items: list[AlertDetailOut]
    page: int
    page_size: int
    total: int


class AlertSummaryItem(BaseModel):
    day: str
    severity: str
    count: int


class AlertSummaryResponse(BaseModel):
    items: list[AlertSummaryItem]
