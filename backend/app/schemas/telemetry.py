from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class DataSenderEventSubtype(StrEnum):
    PARQUET_CHUNK = "data_sender_parquet_chunk"


class PcStatPoint(BaseModel):
    t: datetime
    cpu: float | None
    memory: float | None
    disk: float | None


class PcStatsResponse(BaseModel):
    bucket: str
    series: list[PcStatPoint]


class IgnitionStatPoint(BaseModel):
    t: datetime
    cpu: float | None
    jvm_memory: float | None
    db_status: str | None


class IgnitionStatsResponse(BaseModel):
    bucket: str
    series: list[IgnitionStatPoint]


class DataSenderItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_subtype: DataSenderEventSubtype
    parquet_subfolder: str | None
    parquet_filename: str | None
    rows_count: int | None
    processing_timestamp_utc: datetime | None


class DataSenderResponse(BaseModel):
    items: list[DataSenderItem]
    page: int
    page_size: int
    total: int
    total_rows: int


class EdgeStatusPoint(BaseModel):
    t: datetime
    online: bool


class EdgeStatusResponse(BaseModel):
    uptime_percent: float
    series: list[EdgeStatusPoint]
