from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.dependencies import AppointmentCRUDDep, CurrentUser
from backend.app.models.user import User
from backend.app.schemas.appointment import (
    AppointmentCreate,
    AppointmentRead,
    AppointmentUpdate,
)

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("/", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
async def create_appointment_endpoint(
    appointment: AppointmentCreate,
    appointment_crud: AppointmentCRUDDep,
    current_user: User = Depends(CurrentUser),
):
    if appointment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create appointments for other users.",
        )
    return await appointment_crud.create_appointment(
        appointment=appointment,
        user_id=current_user.id,
        agent_id=appointment.agent_id,
        lead_id=appointment.lead_id,
    )


@router.get("/{appointment_id}", response_model=AppointmentRead)
async def get_appointment_endpoint(
    appointment_id: str,
    appointment_crud: AppointmentCRUDDep,
    current_user: User = Depends(CurrentUser),
):
    db_appointment = await appointment_crud.get_appointment(
        appointment_id=appointment_id, user_id=current_user.id
    )
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return db_appointment


@router.get("/", response_model=List[AppointmentRead])
async def get_appointments_endpoint(
    appointment_crud: AppointmentCRUDDep,
    current_user: User = Depends(CurrentUser),
    skip: int = 0,
    limit: int = 100,
):
    return await appointment_crud.get_appointments(
        user_id=current_user.id, skip=skip, limit=limit
    )


@router.put("/{appointment_id}", response_model=AppointmentRead)
async def update_appointment_endpoint(
    appointment_id: str,
    appointment: AppointmentUpdate,
    appointment_crud: AppointmentCRUDDep,
    current_user: User = Depends(CurrentUser),
):
    db_appointment = await appointment_crud.update_appointment(
        appointment_id=appointment_id,
        appointment=appointment,
        user_id=current_user.id,
    )
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return db_appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment_endpoint(
    appointment_id: str,
    appointment_crud: AppointmentCRUDDep,
    current_user: User = Depends(CurrentUser),
):
    success = await appointment_crud.delete_appointment(
        appointment_id=appointment_id, user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted successfully"}
