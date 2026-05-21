from datetime import datetime
from typing import Literal

from pydantic import BaseModel, model_validator


class TimeRangeParams(BaseModel):
    machine_id: int
    start: datetime
    end: datetime
    bucket: Literal["raw", "1h", "1d", "auto"] = "auto"

    @model_validator(mode="after")
    def check_range(self) -> "TimeRangeParams":
        if self.start >= self.end:
            raise ValueError("start must be before end")
        return self
