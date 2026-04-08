from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Importiere die Models und Base für Autogenerate
import sys
from pathlib import Path

# Füge das app-Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base
from app.models import User, VocabList, ListColumn, VocabGroup, VocabEntry, EntryFieldValue

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def process_revision_directives(context, revision, directives):
    """
    Filtert generierte Migration-Operationen.
    Entfernt Operationen, die nur auf Unterschiede zwischen SQLite und
    SQLAlchemy zurückzuführen sind (z.B. fehlende Foreign Keys, Index-Unterschiede).
    """
    if directives[0].upgrade_ops is None:
        return

    # Filter für Operationen die ignoriert werden sollen
    def should_keep_op(op):
        op_type = type(op).__name__

        # Ignoriere create_foreign_key und drop_constraint für bestehende Tabellen
        if op_type in ('CreateForeignKeyOp', 'DropConstraintOp'):
            return False

        # Ignoriere create_index und drop_index für bestehende Indexes
        if op_type in ('CreateIndexOp', 'DropIndexOp'):
            # Prüfe ob es ein "ix_" Index ist (automatisch generiert)
            index_name = getattr(op, 'index_name', '')
            if index_name and index_name.startswith('ix_'):
                return False

        # Ignoriere alter_column wenn es nur um nullable oder autoincrement geht
        # bei bestehenden Primary Keys (SQLite vs SQLAlchemy Unterschiede)
        if op_type == 'AlterColumnOp':
            column_name = getattr(op, 'column_name', '')
            # Ignoriere nullable-Änderungen bei id-Spalten (Primary Keys)
            if column_name == 'id':
                return False
            # Ignoriere nur wenn keine echte Änderung (z.B. TEXT vs String)
            if hasattr(op, 'modify_type') and op.modify_type is not None:
                # Prüfe ob es nur ein String/TEXT Unterschied ist
                old_type = str(getattr(op, 'existing_type', ''))
                new_type = str(op.modify_type)
                if 'TEXT' in old_type.upper() and 'STRING' in new_type.upper():
                    return False
                if 'STRING' in old_type.upper() and 'TEXT' in new_type.upper():
                    return False

        return True

    # Filtere die upgrade_ops und downgrade_ops
    script = directives[0]
    if script.upgrade_ops:
        for modify_ops in script.upgrade_ops.ops:
            if hasattr(modify_ops, 'ops'):
                modify_ops.ops = [op for op in modify_ops.ops if should_keep_op(op)]

    if script.downgrade_ops:
        for modify_ops in script.downgrade_ops.ops:
            if hasattr(modify_ops, 'ops'):
                modify_ops.ops = [op for op in modify_ops.ops if should_keep_op(op)]


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
        render_as_batch=True,  # Wichtig für SQLite!
        compare_type=False,
        compare_server_default=False,
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # Wichtig für SQLite!
            compare_type=False,
            compare_server_default=False,
            process_revision_directives=process_revision_directives,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
