from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict

# ============== LIST COLUMNS ==============
class ListColumnBase(BaseModel):
    name: str
    column_type: Optional[str] = "custom"
    language_code: Optional[str] = None
    is_primary: Optional[bool] = False

class ListColumnCreate(ListColumnBase):
    position: Optional[int] = 0

class ListColumn(ListColumnBase):
    id: int
    vocab_list_id: int
    position: int

    model_config = {"from_attributes": True}



# ============== ENTRY FIELD VALUES ==============
class EntryFieldValueBase(BaseModel):
    column_id: int
    value: str

class EntryFieldValueCreate(EntryFieldValueBase):
    pass

class EntryFieldValue(EntryFieldValueBase):
    id: int
    entry_id: int

    model_config = {"from_attributes": True}



# ============== VOCAB ENTRIES ==============
class VocabEntryBase(BaseModel):
    pass

class VocabEntryCreate(VocabEntryBase):
    vocab_list_id: int
    field_values: List[EntryFieldValueCreate]

class VocabEntryUpdate(BaseModel):
    field_values: Optional[List[EntryFieldValueCreate]] = None

class VocabEntry(VocabEntryBase):
    id: int
    vocab_list_id: int
    position: int
    field_values: List[EntryFieldValue] = []

    model_config = {"from_attributes": True}



# ============== VOCAB LISTS ==============
class VocabListBase(BaseModel):
    name: str
    description: Optional[str] = None

class VocabListCreate(VocabListBase):
    columns: List[ListColumnCreate]

class VocabListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class VocabList(VocabListBase):
    id: int
    user_id: int
    columns: List[ListColumn] = []
    entries: List[VocabEntry] = []

    model_config = {"from_attributes": True}



# ============== USER ==============
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    role: str
    is_active: bool
    lists: List[VocabList] = []

    model_config = {"from_attributes": True}



# ============== TABLE VIEW (Helper Schema) ==============
class VocabEntryTableRow(BaseModel):
    """Für tabellarische Darstellung der Einträge"""
    entry_id: int
    position: int
    values: Dict[str, str]  # column_name -> value
    
    model_config = {"from_attributes": True}
