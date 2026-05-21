from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.models.asset import Customer, Machine, Plant
from app.schemas.asset import CustomerOut, MachineDetailOut, MachineOut, PlantOut

router = APIRouter(tags=["assets"])


@router.get("/customers", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.scalars(select(Customer)).all()


@router.get("/customers/{id}/plants", response_model=list[PlantOut])
def list_plants(id: int, db: Session = Depends(get_db)):
    if not db.get(Customer, id):
        raise HTTPException(status_code=404, detail="Customer not found")
    return db.scalars(select(Plant).where(Plant.customer_id == id)).all()


@router.get("/plants/{id}/machines", response_model=list[MachineOut])
def list_machines(id: int, db: Session = Depends(get_db)):
    if not db.get(Plant, id):
        raise HTTPException(status_code=404, detail="Plant not found")
    return db.scalars(select(Machine).where(Machine.plant_id == id)).all()


@router.get("/machines/{id}", response_model=MachineDetailOut)
def get_machine(id: int, db: Session = Depends(get_db)):
    machine = db.scalar(
        select(Machine)
        .options(joinedload(Machine.plant).joinedload(Plant.customer))
        .where(Machine.id == id)
    )
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine
