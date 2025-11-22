# type: ignore
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from backend.app.config import settings
from backend.app.database import Base
from backend.app.models.agent import Agent  # noqa: F401
from backend.app.models.appointment import Appointment  # noqa: F401
from backend.app.models.user import User  # noqa: F401
from backend.app.models.chat_session import ChatSession  # noqa: F401
from backend.app.models.knowledge_base_document import KnowledgeBaseDocument  # noqa: F401
from backend.app.models.lead import Lead  # noqa: F401
from backend.app.models.message import Message  # noqa: F401
from backend.app.models.workflow import Workflow  # noqa: F401
from backend.app.models.credential import Credential  # noqa: F401
from backend.app.models.workflow_run import WorkflowRun  # noqa: F401
from backend.app.models.agent_workflow import AgentWorkflow  # noqa: F401
from backend.app.models.pricing_plan import PricingPlan  # noqa: F401
from backend.app.models.admin_log import AdminActivityLog  # noqa: F401
from backend.app.models.transaction import Transaction  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
config.set_main_option(
    "sqlalchemy.url",
    settings.database_url,
)
print("Using database URL:", settings.database_url)
# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
