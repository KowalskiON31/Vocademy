# Datenbank-Migrationen mit Alembic

Alembic ermöglicht es, Tabellen-Spalten hinzuzufügen oder zu entfernen, auch wenn die Datenbank bereits existiert.

## Schnellstart

Alle Befehle aus dem `backend/`-Verzeichnis ausführen:

```bash
cd /home/kowalski/projects/hosting_website/Vocademy/backend
```

### 1. Spalte in models.py hinzufügen/entfernen

Bearbeite `app/models.py` und füge die neue Spalte hinzu oder entferne eine bestehende:

```python
# Beispiel: Neue Spalte hinzufügen
class User(Base):
    __tablename__ = "users"
    # ... bestehende Spalten ...
    new_column = Column(String, nullable=True)  # NEU
```

### 2. Migration generieren

```bash
./venv/bin/alembic revision --autogenerate -m "beschreibung_der_aenderung"
```

**Wichtig:** Nach dem Generieren solltest du die Migration-Datei in `alembic/versions/` prüfen. Die `upgrade()` und `downgrade()` Funktionen sollten nur die gewünschten Änderungen enthalten.

Beispiele:
```bash
./venv/bin/alembic revision --autogenerate -m "add_bio_to_user"
./venv/bin/alembic revision --autogenerate -m "remove_avatar_column"
./venv/bin/alembic revision --autogenerate -m "add_created_at_timestamps"
```

### 3. Migration anwenden

```bash
./venv/bin/alembic upgrade head
```

## Häufige Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `./venv/bin/alembic current` | Zeigt aktuelle Revision |
| `./venv/bin/alembic history` | Zeigt alle Migrationen |
| `./venv/bin/alembic upgrade head` | Alle Migrationen anwenden |
| `./venv/bin/alembic upgrade +1` | Eine Migration vorwärts |
| `./venv/bin/alembic downgrade -1` | Eine Migration zurück |
| `./venv/bin/alembic downgrade base` | Alle Migrationen rückgängig |

## Beispiel: Neue Spalte "bio" zum User hinzufügen

1. **models.py bearbeiten:**
   ```python
   class User(Base):
       __tablename__ = "users"
       # ... bestehende Spalten ...
       bio = Column(Text, nullable=True)
   ```

2. **Migration generieren:**
   ```bash
   ./venv/bin/alembic revision --autogenerate -m "add_bio_to_user"
   ```

3. **Generierte Migration prüfen** (in `alembic/versions/`):
   ```python
   def upgrade():
       with op.batch_alter_table('users') as batch_op:
           batch_op.add_column(sa.Column('bio', sa.Text(), nullable=True))

   def downgrade():
       with op.batch_alter_table('users') as batch_op:
           batch_op.drop_column('bio')
   ```

4. **Migration anwenden:**
   ```bash
   ./venv/bin/alembic upgrade head
   ```

## Beispiel: Spalte entfernen

1. **models.py bearbeiten** - Spalte entfernen oder auskommentieren

2. **Migration generieren:**
   ```bash
   ./venv/bin/alembic revision --autogenerate -m "remove_old_column"
   ```

3. **Migration anwenden:**
   ```bash
   ./venv/bin/alembic upgrade head
   ```

## Wichtige Hinweise

### SQLite-Einschränkungen

SQLite hat Einschränkungen beim Ändern von Tabellen. Alembic verwendet daher den **Batch-Modus** (`render_as_batch=True`), der:
1. Eine temporäre Tabelle erstellt
2. Daten kopiert
3. Alte Tabelle löscht
4. Temporäre Tabelle umbenennt

Dies ist bereits in `alembic/env.py` konfiguriert.

### Datensicherheit

- **Vor größeren Migrationen:** Backup der Datenbank erstellen
  ```bash
  cp vokabeln.db vokabeln.db.backup
  ```
- **Bei Problemen:** Migration rückgängig machen
  ```bash
  ./venv/bin/alembic downgrade -1
  ```

### Manuelles Schreiben von Migrationen

Falls Autogenerate nicht funktioniert, kannst du Migrationen manuell erstellen:

```bash
./venv/bin/alembic revision -m "manual_migration"
```

Dann die generierte Datei bearbeiten:

```python
def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('new_col', sa.String(100), nullable=True))
        batch_op.alter_column('old_col', new_column_name='renamed_col')

def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('renamed_col', new_column_name='old_col')
        batch_op.drop_column('new_col')
```

## Verzeichnisstruktur

```
backend/
├── alembic/
│   ├── env.py              # Alembic-Konfiguration
│   ├── script.py.mako      # Template für Migrationen
│   └── versions/           # Migrations-Dateien
│       └── a539c9e68a9d_initial_schema.py
├── alembic.ini             # Alembic-Einstellungen
└── app/
    └── models.py           # SQLAlchemy-Models
```
