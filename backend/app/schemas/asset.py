from pydantic import BaseModel, ConfigDict


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    adx_database: str | None


class PlantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    city: str
    customer_id: int


class MachineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    machine_id: str | None
    iot_device_id: str | None
    plant_id: int


class PlantDetailOut(PlantOut):
    customer: CustomerOut


class MachineDetailOut(MachineOut):
    plant: PlantDetailOut
