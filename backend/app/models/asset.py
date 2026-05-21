from datetime import datetime

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Customer(Base):
    __tablename__ = "customer"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    adx_database: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
    modified_at: Mapped[datetime | None]

    plants: Mapped[list["Plant"]] = relationship(back_populates="customer")


class Plant(Base):
    __tablename__ = "plant"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("public.customer.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
    modified_at: Mapped[datetime | None]

    customer: Mapped["Customer"] = relationship(back_populates="plants")
    machines: Mapped[list["Machine"]] = relationship(back_populates="plant")


class Machine(Base):
    __tablename__ = "machine"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    machine_id: Mapped[str | None] = mapped_column(String(50), unique=True)
    iot_device_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    plant_id: Mapped[int] = mapped_column(
        ForeignKey("public.plant.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime | None] = mapped_column(server_default=func.now())
    modified_at: Mapped[datetime | None]

    plant: Mapped["Plant"] = relationship(back_populates="machines")
