r"""
Safe migration: add `vocab_groups` table and nullable `group_id` column to `vocab_lists`.
Creates a timestamped backup of the SQLite DB before making changes.

Usage:
    cd backend
    .\venv\Scripts\activate
    python migrations\add_groups.py

This script is intentionally simple and only supports SQLite. It will not
drop data and performs checks before making changes.
"""
from pathlib import Path
import shutil
import sqlite3
import sys
import time

# Ensure backend package is importable
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

DB_PATH = ROOT / "vokabeln.db"
BACKUP_DIR = ROOT / "migrations" / "backups"


def backup_db(db_path: Path) -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = time.strftime("%Y%m%d_%H%M%S")
    dest = BACKUP_DIR / f"vokabeln.db.bak.{ts}"
    print(f"Creating DB backup: {dest}")
    shutil.copy2(db_path, dest)
    return dest


def table_exists(conn: sqlite3.Connection, name: str) -> bool:
    c = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,))
    return c.fetchone() is not None


def column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    c = conn.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in c.fetchall()]
    return column in cols


def main():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}. Aborting.")
        return

    # Backup first
    try:
        backup_db(DB_PATH)
    except Exception as e:
        print("Backup failed:", e)
        return

    conn = sqlite3.connect(str(DB_PATH))
    try:
        if not table_exists(conn, 'vocab_groups'):
            print('Creating table vocab_groups...')
            conn.execute('''
                CREATE TABLE vocab_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    user_id INTEGER
                )
            ''')
            conn.commit()
        else:
            print('Table vocab_groups already exists')

        if not column_exists(conn, 'vocab_lists', 'group_id'):
            # SQLite supports ADD COLUMN but not many ALTER operations; this is safe additive
            print('Adding column group_id to vocab_lists...')
            conn.execute('ALTER TABLE vocab_lists ADD COLUMN group_id INTEGER')
            conn.commit()
        else:
            print('Column group_id already exists on vocab_lists')

        print('Migration finished successfully.')
    finally:
        conn.close()


if __name__ == '__main__':
    main()
