# noqa: E402
import asyncio
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))


from backend.app.database import AsyncSessionLocal  # noqa: E402

from backend.app.models.pricing_plan import PricingPlan  # noqa: E402


async def seed_pricing_plans(session: AsyncSession):
    """Seed initial pricing plans for the landing page."""
    pricing_plans = [
        {
            "name": "Iniciador",
            "description": "El punto de partida ideal",
            "credits": 1500,
            "price": "$29",
            "features": [
                "Tabla de Gestión de Leads (CRM Lite)",
                "1 Espacio para Archivo de Negocio",
                "Acceso a 1 Canal (Web/WhatsApp)",
                "Soporte por Email Estándar",
            ],
            "popular": False,
            "is_active": True,
        },
        {
            "name": "Negocio Pro",
            "description": "El mejor balance para crecer",
            "credits": 2500,
            "price": "$49",
            "features": [
                "Tabla de Gestión de Leads PRO (Integración Avanzada)",
                "3 Espacios para Archivos de Negocio",
                "Acceso a 3 Canales Integrados",
                "Soporte Prioritario 24/7",
                "Análisis de Rendimiento Completo",
            ],
            "popular": True,
            "is_active": True,
        },
        {
            "name": "Escala Máxima",
            "description": "Para grandes volúmenes de tráfico",
            "credits": 5000,
            "price": "$89",
            "features": [
                "Tabla de Gestión de Leads Avanzada",
                "5 Espacios para Archivos de Negocio",
                "Canales Ilimitados",
                "Consultoría de IA Dedicada",
            ],
            "popular": False,
            "is_active": True,
        },
    ]

    # Check if pricing plans already exist
    existing_plans = await session.execute(select(PricingPlan))
    if existing_plans.scalars().first():
        print("Pricing plans already exist, skipping...")
        return

    for plan_data in pricing_plans:
        plan = PricingPlan(**plan_data)
        session.add(plan)

    await session.commit()
    print(f"Seeded {len(pricing_plans)} pricing plans successfully!")


async def seed_database():
    """Main function to seed the database with initial data."""
    print("Starting database seeding...")

    async with AsyncSessionLocal() as session:
        try:
            await seed_pricing_plans(session)
            print("Database seeding completed successfully!")
        except Exception as e:
            print(f"Error during seeding: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
