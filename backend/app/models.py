from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default='User')
    is_active = Column(Boolean, default=True)

    lists = relationship("VocabList", back_populates="owner")


class VocabList(Base):
    __tablename__ = "vocab_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="lists")
    columns = relationship("ListColumn", back_populates="vocab_list", cascade="all, delete-orphan", order_by="ListColumn.position")
    entries = relationship("VocabEntry", back_populates="vocab_list", cascade="all, delete-orphan")


class ListColumn(Base):
    """
    Definiert eine Spalte in der Vokabelliste.
    Kann alles sein: Sprachen, Zeitformen, Bedeutungen, etc.
    
    Beispiele:
    - Sprachen: "Deutsch", "English", "Français"
    - Zeitformen: "Infinitiv", "Präteritum", "Perfekt"
    - Medizin: "Fachbegriff", "Lateinisch", "Definition", "Beispiel"
    - Allgemein: "Begriff", "Bedeutung 1", "Bedeutung 2", "Kontext"
    """
    __tablename__ = "list_columns"

    id = Column(Integer, primary_key=True, index=True)
    vocab_list_id = Column(Integer, ForeignKey("vocab_lists.id"))
    
    # Name der Spalte (z.B. "Deutsch", "Infinitiv", "Definition")
    name = Column(String, nullable=False)
    
    # Optional: Typ-Hinweis für Frontend/Validierung
    # z.B. "language", "verb_form", "definition", "example", "custom"
    column_type = Column(String, default="custom")
    
    # Reihenfolge der Spalte (0, 1, 2, ...)
    position = Column(Integer, default=0)
    
    # Optional: Sprach-Code wenn es eine Sprache ist (z.B. "de", "en")
    language_code = Column(String, nullable=True)
    
    # Ist diese Spalte die Hauptspalte? (für Suche/Sortierung)
    is_primary = Column(Boolean, default=False)

    vocab_list = relationship("VocabList", back_populates="columns")
    field_values = relationship("EntryFieldValue", back_populates="column", cascade="all, delete-orphan")


class VocabEntry(Base):
    """
    Ein Eintrag in der Vokabelliste (eine Zeile).
    Die eigentlichen Werte stehen in EntryFieldValue.
    """
    __tablename__ = "vocab_entries"

    id = Column(Integer, primary_key=True, index=True)
    vocab_list_id = Column(Integer, ForeignKey("vocab_lists.id"))
    
    # Optional: Position für manuelle Sortierung
    position = Column(Integer, default=0)

    vocab_list = relationship("VocabList", back_populates="entries")
    field_values = relationship("EntryFieldValue", back_populates="entry", cascade="all, delete-orphan")


class EntryFieldValue(Base):
    """
    Der Wert eines Feldes für einen Eintrag.
    Verbindet VocabEntry mit ListColumn und speichert den konkreten Wert.
    
    Beispiel:
    - entry_id=1, column_id=1 (Deutsch), value="laufen"
    - entry_id=1, column_id=2 (Infinitiv), value="laufen"
    - entry_id=1, column_id=3 (Präteritum), value="lief"
    - entry_id=1, column_id=4 (Perfekt), value="ist gelaufen"
    """
    __tablename__ = "entry_field_values"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("vocab_entries.id"))
    column_id = Column(Integer, ForeignKey("list_columns.id"))
    
    # Der eigentliche Wert/Inhalt
    value = Column(Text)
    
    entry = relationship("VocabEntry", back_populates="field_values")
    column = relationship("ListColumn", back_populates="field_values")