from pydantic import BaseModel
from typing import List

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
        from_attributes = True


# ============== VOKABELLISTEN ==============
class VocabListBase(BaseModel):
    name:str

class VocabListCreate(VocabListBase):
    pass
    
class VocabList(VocabListBase):
    id: int
    user_id: int
    vocab_items: List[VocabItem] = []

    class Config:
        from_attributes = True


# ============== USER ==============
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    lists: List[VocabList] = []

    class Config:
        from_attributes = True