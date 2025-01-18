from sqlalchemy import Column, Integer, String, DateTime
from .database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_filename = Column(String)
    expiry_date = Column(DateTime, index=True)
    upload_date = Column(DateTime)
    file_path = Column(String)