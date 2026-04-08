# Vocademy

Vokabel-Lern-App mit Python Backend (FastAPI) und React Frontend.

## Starten

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
