# Vocademy

Ein Vokabeltrainer mit FastAPI-Backend und einfachem Frontend.

## Voraussetzungen

- Python 3.10 oder neuer
- [pip](https://pip.pypa.io/en/stable/)
- (Optional) [virtualenv](https://virtualenv.pypa.io/en/latest/) für eine virtuelle Umgebung

## Backend einrichten und starten

1. **Repository klonen**

   ```sh
   git clone <REPO_URL>
   cd Vocademy/backend
   ```

2. **Virtuelle Umgebung erstellen (empfohlen)**

   ```sh
   python -m venv venv
   source venv/bin/activate  # Auf Windows: venv\Scripts\activate
   ```

3. **Abhängigkeiten installieren**

   ```sh
   pip install -r requirements.txt
   ```

4. **.env Datei anlegen**

   Lege im Verzeichnis `backend/app/` eine Datei `.env` mit folgendem Inhalt an (Beispielwerte):

   ```
   SECRET_KEY=dein_geheimer_schluessel
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

5. **Backend starten**

   ```sh
   uvicorn app.main:app --host 127.0.0.1 --port 5050
   ```

   Das Backend läuft dann unter [http://localhost:8000](http://localhost:8000).

6. **API-Dokumentation**

   Die automatisch generierte API-Doku findest du unter [http://localhost:8000/docs](http://localhost:8000/docs).

## Frontend

Das Frontend besteht aktuell nur aus einer statischen HTML-Datei (`frontend/index.html`). Öffne sie einfach im Browser.

## Hinweise

- Die SQLite-Datenbank wird automatisch als `vokabeln.db` im Backend-Verzeichnis angelegt.
- Standardmäßig gibt es keine Benutzer. Registriere dich über die API (`/register/`), um einen Account zu erstellen.
- Admin-Funktionen sind nur für Benutzer mit der Rolle `Admin` verfügbar.

---

Viel Spaß beim Lernen!