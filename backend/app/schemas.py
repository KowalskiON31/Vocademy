from pydantic import BaseModel
from typing import List, Optional

# ============== VOKABELN ==============
class VocabItemBase(BaseModel):
    word: str
    translation: str

class VocabItemCreate(VocabItemBase):
    vocab_list_id: int

class VocabItem(VocabItemBase):
    id:int
    vocab_list_id: int

    class Config:
        orm_mode = True


# ============== VOKABELLISTEN ==============
class VocabListBase(BaseModel):
    name:str

class VocabListCreate(VocabListBase):
    user_id: int

class VocabList(VocabListBase):
    id: int
    user_id: int
    vocab_items: List[VocabItem] = []

    class Config:
        orm_mode = True


# ============== USER ==============
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    password: str
    lists: List[VocabList] = []

    class Config:
        orm_mode = True