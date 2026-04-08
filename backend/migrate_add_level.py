"""
Migrations-Script zum Hinzufügen des level-Feldes zur vocab_entries Tabelle.

Dieses Script fügt die 'level' Spalte hinzu und setzt alle existierenden Einträge auf Level 1.
"""

import sqlite3
import sys
from pathlib import Path

# Pfad zur Datenbank
db_path = Path(__file__).parent / "vokabeln.db"

def migrate():
    if not db_path.exists():
        print(f"[ERROR] Datenbank nicht gefunden: {db_path}")
        print("[INFO] Die Spalte wird automatisch erstellt, wenn die Datenbank neu angelegt wird.")
        return

    print(f"[INFO] Verbinde mit Datenbank: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # Prüfe, ob die Spalte bereits existiert
        cursor.execute("PRAGMA table_info(vocab_entries)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'level' in columns:
            print("[OK] Die 'level' Spalte existiert bereits!")
            return

        print("[INFO] Fuege 'level' Spalte zur vocab_entries Tabelle hinzu...")
        cursor.execute("ALTER TABLE vocab_entries ADD COLUMN level INTEGER DEFAULT 1")

        # Setze alle existierenden Einträge auf Level 1
        cursor.execute("UPDATE vocab_entries SET level = 1 WHERE level IS NULL")

        conn.commit()
        print("[OK] Migration erfolgreich abgeschlossen!")
        print("[INFO] Alle Vokabeln wurden auf Level 1 gesetzt.")

    except sqlite3.OperationalError as e:
        print(f"[ERROR] Fehler bei der Migration: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
