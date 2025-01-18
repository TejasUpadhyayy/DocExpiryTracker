from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentBase(BaseModel):
    expiry_date: datetime

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    filename: str
    original_filename: str
    upload_date: datetime
    file_path: str

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.strftime("%Y-%m-%d")
        }

class DocumentUpdate(BaseModel):
    expiry_date: Optional[datetime] = None