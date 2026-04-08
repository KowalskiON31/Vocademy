# Vocademy - Vokabel-Lern-App

## Projekt-Übersicht

Vocademy ist eine flexible Vokabel-Lern-App mit Level-System. Benutzer können eigene Vokabellisten mit beliebigen Spalten erstellen (z.B. Deutsch-Englisch, Medizinische Fachbegriffe, Verbformen).

## Tech Stack

| Komponente | Technologie |
|------------|-------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | FastAPI (Python) |
| **Datenbank** | SQLite (vokabeln.db) |
| **Auth** | JWT Tokens (python-jose) |
| **Migrationen** | Alembic |

## Verzeichnisstruktur

```
Vocademy/
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Toaster, ProtectedRoute
│   │   ├── pages/           # Dashboard, Login, Register, VocabListFlexible, VocabTest, Profile
│   │   ├── services/        # api.ts, auth.ts, vocab.ts, users.ts
│   │   └── utils/           # Hilfsfunktionen
│   ├── dist/                # Production Build
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI App
│   │   ├── models.py        # SQLAlchemy Models
│   │   ├── schemas.py       # Pydantic Schemas
│   │   ├── crud.py          # Datenbank-Operationen
│   │   ├── auth.py          # JWT Auth
│   │   ├── database.py      # DB Connection
│   │   └── routes/          # API Router (user.py, vocab.py, vocablist.py)
│   ├── alembic/             # Datenbank-Migrationen
│   ├── venv/                # Python Virtual Environment
│   ├── vokabeln.db          # SQLite Datenbank
│   └── requirements.txt
├── deploy/                  # Deployment-Konfigurationen
└── tests/                   # Backend-Tests
```

## Datenbank-Modelle

### User
- id, username, email, firstname, password, role, is_active, avatar

### VocabList
- id, name, description, user_id, group_id

### VocabGroup
- id, name, description, user_id

### ListColumn (Flexible Spalten)
- id, vocab_list_id, name, column_type, position, language_code, is_primary

### VocabEntry
- id, vocab_list_id, position, level (1-5)

### EntryFieldValue
- id, entry_id, column_id, value

## API Endpoints

### Auth
- `POST /api/login/` - Login
- `POST /api/register/` - Registrierung

### Vocab Lists
- `GET /api/vocablist/` - Alle Listen
- `GET /api/vocablist/{id}` - Eine Liste mit Spalten und Einträgen
- `POST /api/vocablist/` - Liste erstellen
- `PUT /api/vocablist/{id}` - Liste aktualisieren
- `DELETE /api/vocablist/{id}` - Liste löschen

### Columns
- `POST /api/vocablist/{id}/columns` - Spalte hinzufügen
- `PUT /api/vocablist/columns/{id}` - Spalte umbenennen
- `DELETE /api/vocablist/columns/{id}` - Spalte löschen

### Entries
- `POST /api/vocab/entries` - Eintrag erstellen
- `PUT /api/vocab/entries/{id}` - Eintrag aktualisieren
- `DELETE /api/vocab/entries/{id}` - Eintrag löschen
- `PATCH /api/vocab/entries/{id}/level` - Level anpassen

### Groups
- `GET /api/vocabgroup/` - Alle Gruppen
- `POST /api/vocabgroup/` - Gruppe erstellen
- `PUT /api/vocabgroup/{id}` - Gruppe aktualisieren
- `DELETE /api/vocabgroup/{id}` - Gruppe löschen

## Entwicklung

### Frontend starten
```bash
cd frontend
npm install
npm run dev      # Development (Port 5173)
npm run build    # Production Build
npm run preview  # Preview Build
```

### Backend starten
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Tests ausführen
```bash
cd backend
pytest
```

## Datenbank-Migrationen (Alembic)

### Spalte hinzufügen/entfernen
1. `models.py` bearbeiten
2. Migration generieren:
   ```bash
   cd backend
   ./venv/bin/alembic revision --autogenerate -m "beschreibung"
   ```
3. Migration prüfen in `alembic/versions/`
4. Migration anwenden:
   ```bash
   ./venv/bin/alembic upgrade head
   ```

### Rückgängig machen
```bash
./venv/bin/alembic downgrade -1
```

## Level-System

Vokabeln haben ein Level von 1-5:
- **Level 1**: Neu/Schwierig
- **Level 2-4**: Fortschreitend gelernt
- **Level 5**: Gut gelernt

Bei richtig: Level +1 (max 5)
Bei falsch: Level -1 (min 1)

## Deployment

- **Backend Service**: `vocademy-backend.service`
- **Frontend**: Statische Dateien aus `dist/`
- **Ports**: Frontend 5173, Backend 8000

### Neustart
```bash
sudo systemctl restart vocademy-backend.service
```

## Wichtige Hinweise

1. **Backend neu starten** nach Änderungen an Routes/Models
2. **Frontend neu bauen** (`npm run build`) nach Änderungen
3. **SQLite Batch-Mode**: Alembic verwendet `render_as_batch=True` für SQLite-Kompatibilität
4. **Auth Token**: Wird im localStorage gespeichert
