from typing import List, Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.appointment import Appointment
from backend.app.schemas.appointment import AppointmentCreate, AppointmentUpdate


class AppointmentCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_appointment(
        self, appointment: AppointmentCreate, user_id: str, agent_id: str, lead_id: str
    ) -> Appointment:
        db_appointment = Appointment(
            **appointment.model_dump(),
            user_id=user_id,
            agent_id=agent_id,
            lead_id=lead_id,
        )
        self.session.add(db_appointment)
        self.session.flush()
        return db_appointment

    async def get_appointment(
        self, appointment_id: str, user_id: str
    ) -> Optional[Appointment]:
        result = await self.session.execute(
            select(Appointment)
            .where(Appointment.id == appointment_id)
            .where(Appointment.user_id == user_id)
        )
        return result.scalars().first()

    async def get_appointments(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Appointment]:
        result = await self.session.execute(
            select(Appointment)
            .where(Appointment.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_appointment(
        self, appointment_id: str, appointment: AppointmentUpdate, user_id: str
    ) -> Optional[Appointment]:
        db_appointment = await self.get_appointment(appointment_id, user_id)
        if db_appointment:
            update_data = appointment.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_appointment, key, value)
            self.session.flush()
            return db_appointment
        return None

    async def delete_appointment(self, appointment_id: str, user_id: str) -> bool:
        query = delete(Appointment).where(
            Appointment.id == appointment_id, Appointment.user_id == user_id
        )

        await self.session.execute(query)

        return True
