from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default='User')
    is_active = Column(Boolean, default=True)

    lists = relationship("VocabList", back_populates="owner")


class VocabList(Base):
    __tablename__ = "vocab_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="lists")
    entries = relationship("VocabEntry", back_populates="vocab_list", cascade="all, delete-orphan")


class VocabEntry(Base):
    __tablename__ = "vocab_entries"

    id = Column(Integer, primary_key=True, index=True)
    term = Column(String, index=True)
    source_language = Column(String, default="de")
    vocab_list_id = Column(Integer, ForeignKey("vocab_lists.id"))

    vocab_list = relationship("VocabList", back_populates="entries")
    translations = relationship("VocabTranslation", back_populates="entry", cascade="all, delete-orphan")


class VocabTranslation(Base):
    __tablename__ = "vocab_translations"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, index=True)
    language = Column(String, default="en")
    entry_id = Column(Integer, ForeignKey("vocab_entries.id"))

    entry = relationship("VocabEntry", back_populates="translations")
