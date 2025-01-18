import os
import uuid
import logging
from datetime import datetime
from fastapi import UploadFile, HTTPException
from .date_extractor import DateExtractor

logger = logging.getLogger(__name__)
date_extractor = DateExtractor()

async def validate_file(file: UploadFile) -> bool:
    """Validate file type and size."""
    # Check file size (5MB limit)
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size too large. Maximum size is 5MB.")

    allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG"
        )
    
    return True

async def extract_expiry_date(file: UploadFile) -> datetime:
    """Extract expiry date from document if possible"""
    try:
        content = await file.read()
        date = date_extractor.extract_date(content, file.filename)
        await file.seek(0)  # Reset file pointer
        return date
    except Exception as e:
        logger.error(f"Error extracting date: {str(e)}")
        await file.seek(0)
        return None

async def save_upload_file(upload_file: UploadFile) -> tuple[str, str]:
    """Save an uploaded file and return the filename."""
    try:
        os.makedirs("uploads", exist_ok=True)
        
        file_extension = os.path.splitext(upload_file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join("uploads", unique_filename)
        
        content = await upload_file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        await upload_file.seek(0)  # Reset file pointer
        return unique_filename, file_path
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")