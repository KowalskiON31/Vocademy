from pydantic import BaseModel
from typing import List, Optional

# ============== VOKABELN ==============
class VocabTranslationBase(BaseModel):
    text: str
    language: str

class VocabTranslationCreate(VocabTranslationBase):
    pass

class VocabTranslation(VocabTranslationBase):
    id: int
    entry_id: int

    class Config:
        from_attributes = True


class VocabEntryBase(BaseModel):
    term: str
    source_language: Optional[str] = "de"

class VocabEntryCreate(VocabEntryBase):
    vocab_list_id: int
    translations: Optional[List[VocabTranslationCreate]] = None

class VocabEntryUpdate(BaseModel):
    term: Optional[str] = None
    source_language: Optional[str] = None

class VocabEntry(VocabEntryBase):
    id: int
    vocab_list_id: int
    translations: List[VocabTranslation] = []

    class Config:
        from_attributes = True


# ============== VOKABELLISTEN ==============
class VocabListBase(BaseModel):
    name:str

class VocabListCreate(VocabListBase):
    pass
    
class VocabList(VocabListBase):
    id: int
    user_id: int
    entries: List[VocabEntry] = []

    class Config:
        from_attributes = True


# ============== USER ==============
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    
class User(UserBase):
    id: int
    role: str
    is_active: bool
    lists: List[VocabList] = []

    class Config:
        from_attributes = True