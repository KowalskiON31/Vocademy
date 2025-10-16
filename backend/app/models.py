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
    vocab_items = relationship("VocabItem", back_populates="vocab_list")


class VocabItem(Base):
    __tablename__ = "vocab_items"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, index=True)
    translation = Column(String, index=True)

    vocab_list_id = Column(Integer, ForeignKey("vocab_lists.id"))
    vocab_list = relationship("VocabList", back_populates="vocab_items")
