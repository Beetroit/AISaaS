import asyncio
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import AsyncSessionLocal
from backend.app.models.node_type import NodeType
from backend.app.models.pricing_plan import PricingPlan


async def seed_node_types(session: AsyncSession):
    """Seed initial node types for workflow system."""
    node_types = [
        # Core workflow actions
        {
            "type": "start",
            "name": "Start",
            "description": "The entry point of the workflow",
            "inputs": {},
            "outputs": {"start_data": "any"},
        },
        {
            "type": "end",
            "name": "End",
            "description": "The termination point of the workflow",
            "inputs": {"end_data": "any"},
            "outputs": {},
        },
        {
            "type": "ask_question",
            "name": "Ask a Question",
            "description": "Pauses the workflow and asks the user a question",
            "inputs": {"context": "any"},
            "outputs": {"answer": "string"},
        },
        # Business workflow nodes
        {
            "type": "send_message",
            "name": "Send Message",
            "description": "Send a text message to the user",
            "inputs": {"message": "The message text to send"},
            "outputs": {},
        },
        {
            "type": "save_lead",
            "name": "Save Lead",
            "description": "Capture and save lead information",
            "inputs": {
                "phone": "User phone number",
                "name": "User name (optional)",
                "email": "User email (optional)",
            },
            "outputs": {"lead_id": "Generated lead ID"},
        },
        {
            "type": "conditional_logic",
            "name": "Conditional Logic",
            "description": "Branch based on conditions",
            "inputs": {
                "condition": "Condition to evaluate",
                "true_output": "Output if condition is true",
                "false_output": "Output if condition is false",
            },
            "outputs": {"result": "Result of the condition evaluation"},
        },
        {
            "type": "wait",
            "name": "Wait",
            "description": "Add a delay before proceeding",
            "inputs": {"duration": "Wait duration in seconds"},
            "outputs": {},
        },
        {
            "type": "api_call",
            "name": "API Call",
            "description": "Make an external API call",
            "inputs": {
                "url": "API endpoint URL",
                "method": "HTTP method (GET, POST, etc.)",
                "headers": "Request headers (JSON)",
                "body": "Request body (JSON)",
            },
            "outputs": {"response": "API response data"},
        },
        {
            "type": "database_query",
            "name": "Database Query",
            "description": "Execute a database query",
            "inputs": {
                "query": "SQL query to execute",
                "params": "Query parameters (JSON)",
            },
            "outputs": {"results": "Query results"},
        },
    ]

    # Check if node types already exist
    existing_types = await session.execute(select(NodeType))
    if existing_types.scalars().first():
        print("Node types already exist, skipping...")
        return

    for node_type_data in node_types:
        node_type = NodeType(**node_type_data)
        session.add(node_type)

    await session.commit()
    print(f"Seeded {len(node_types)} node types successfully!")


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
            await seed_node_types(session)
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
