# Vokabel Level-System

## Übersicht

Das Level-System verfolgt automatisch den Lernfortschritt jeder Vokabel. Jede Vokabel beginnt bei **Level 1** und kann bis zu **Level 5** aufsteigen.

## Funktionsweise

### Level-Updates
- **Richtige Antwort**: Level +1 (Maximum: 5)
- **Falsche Antwort**: Level -1 (Minimum: 1)

### Level-Bedeutung
- **Level 1**: Neu / Noch nicht gelernt / Schwierig
- **Level 2**: Einmal richtig beantwortet
- **Level 3**: Zweimal richtig beantwortet
- **Level 4**: Dreimal richtig beantwortet
- **Level 5**: Gut gelernt / Mehrfach richtig

## Verwendung

### Test starten mit Level-Auswahl

1. Gehe zu "Vokabeltest"
2. Wähle eine oder mehrere Listen aus
3. Wähle die Quelle (Sprache) für jede Liste
4. **NEU: Wähle die Levels aus**, die du üben möchtest:
   - Einzelne Levels: z.B. nur Level 1 (schwierige Vokabeln)
   - Mehrere Levels: z.B. Level 1, 2, 3
   - Alle Levels: Button "Alle auswählen"
5. Wähle den Testmodus (Manuell oder Multiple Choice)
6. Starte den Test

### Automatische Level-Anpassung

Nach jeder Antwort wird das Level der Vokabel automatisch aktualisiert:
- Die Änderung erfolgt im Hintergrund
- Du musst nichts manuell tun
- Beim nächsten Test werden die aktualisierten Levels berücksichtigt

## Lernstrategien

### Gezieltes Üben schwieriger Vokabeln
Wähle nur **Level 1** aus, um dich auf die schwierigsten Vokabeln zu konzentrieren.

### Wiederholung mittlerer Vokabeln
Wähle **Level 2-3** aus, um Vokabeln zu wiederholen, die du teilweise kennst.

### Auffrischung gut gelernter Vokabeln
Wähle **Level 4-5** aus, um dein Wissen zu festigen.

### Gemischtes Training
Wähle **Alle Levels** aus für einen vollständigen Test.

## Technische Details

### Backend

#### Datenbank-Schema
```sql
ALTER TABLE vocab_entries ADD COLUMN level INTEGER DEFAULT 1;
```

#### API-Endpoint
```
PATCH /api/vocab/entries/{entry_id}/level?is_correct={true|false}
```

**Response:**
```json
{
  "entry_id": 123,
  "new_level": 2,
  "is_correct": true
}
```

### Frontend

#### Neue Features
- Level-Auswahl-Buttons (1-5) auf der Test-Startseite
- Filter nach ausgewählten Levels beim Laden der Vokabeln
- Automatischer API-Call nach jeder Antwort

### Migration

Für bestehende Datenbanken:
```bash
cd backend
python migrate_add_level.py
```

Das Script:
- Fügt die `level`-Spalte hinzu
- Setzt alle existierenden Vokabeln auf Level 1
- Ist idempotent (kann mehrfach ausgeführt werden)

## Dateien

### Backend
- `backend/app/models.py` - VocabEntry Model mit level-Feld
- `backend/app/schemas.py` - VocabEntry Schema mit level-Feld
- `backend/app/routes/vocab.py` - API-Endpoint für Level-Updates
- `backend/migrate_add_level.py` - Migrations-Script

### Frontend
- `frontend/src/pages/VocabTest.tsx` - Level-Auswahl UI und Filter-Logik
- `frontend/src/services/vocab.ts` - API-Service für Level-Updates

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- Visualisierung der Level-Verteilung (Statistiken)
- Level-Anzeige in der Vokabellisten-Ansicht
- Automatische Empfehlungen basierend auf Levels
- Zeitbasierte Level-Reduktion (Vergessenskurve)
- Export von Level-Statistiken
