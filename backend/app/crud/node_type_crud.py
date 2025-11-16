from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.node_type import NodeType


class NodeTypeCRUD:
    @staticmethod
    async def get_all_node_types(db: AsyncSession):
        """Get all node types from database."""
        result = await db.execute(select(NodeType))
        node_types = result.scalars().all()
        return [
            {
                "type": node_type.type,
                "name": node_type.name,
                "description": node_type.description,
                "inputs": node_type.inputs or {},
                "outputs": node_type.outputs or {},
            }
            for node_type in node_types
        ]

    @staticmethod
    async def get_node_type_by_type(db: AsyncSession, node_type: str):
        """Get a specific node type by type identifier."""
        result = await db.execute(select(NodeType).where(NodeType.type == node_type))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_node_type(db: AsyncSession, node_type_data: dict):
        """Create a new node type."""
        db_node_type = NodeType(**node_type_data)
        db.add(db_node_type)
        await db.commit()
        await db.refresh(db_node_type)
        return db_node_type
