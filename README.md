# 📘 Vocademy

**Vocademy** ist ein moderner **Vokabeltrainer**, bestehend aus einem leistungsstarken **FastAPI-Backend** und einem schicken **React + Tailwind-Frontend**.  
Er unterstützt Benutzerverwaltung, Rollen (User/Admin) und das Erstellen und Verwalten von Vokabellisten.

---

## 🚀 Features

- 🔐 Benutzerregistrierung & Login mit JWT
- 🧑‍💼 Rollenverwaltung (User / Admin)
- 📚 Vokabel- und Vokabellistenverwaltung
- 🚫 Aktivieren / Deaktivieren / Löschen von Benutzern (nur Admin)
- ⚡ Frontend mit React + TailwindCSS
- 🧠 Lernfreundliches, minimalistisches UI

---

## 🧩 Projektstruktur
```bash
Vocademy/
├── backend/
│ ├── app/
│ │ ├── main.py
│ │ ├── models.py
│ │ ├── schemas.py
│ │ ├── crud.py
│ │ ├── auth.py
│ │ ├── routes/
│ │ └── database.py
│ ├── vokabeln.db
│ └── requirements.txt
│
└── frontend/
├── src/
│ ├── pages/
│ │ ├── Login.tsx
│ │ ├── Register.tsx
│ │ └── Dashboard.tsx
│ ├── components/
│ ├── services/
│ ├── App.tsx
│ ├── main.tsx
│ └── index.css
├── package.json
└── tailwind.config.js
````

## ⚙️ Backend einrichten

### 1️⃣ In den Backend-Ordner wechseln
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate
pip install -r requirements.txt
```
5️⃣ Backend starten
uvicorn app.main:app --reload --port 8000


🖥️ Frontend einrichten
1️⃣ In den Frontend-Ordner wechseln
cd ../frontend

2️⃣ Abhängigkeiten installieren
npm install

3️⃣ Tailwind konfigurieren (falls noch nicht)
npx tailwindcss init -p

4️⃣ Entwicklungsserver starten
npm run dev

🔐 Admin-Benutzer erstellen

Standardmäßig werden neue User mit der Rolle User erstellt.
Um jemanden zum Admin zu machen:
```bash
cd backend
python

from app.database import SessionLocal
from app import models

db = SessionLocal()
user = db.query(models.User).filter(models.User.username == "dein_username").first()
user.role = "Admin"
db.commit()
db.close()
```
