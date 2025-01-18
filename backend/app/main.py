from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import os
from fastapi.responses import JSONResponse
import logging
from typing import Optional



from . import models, schemas, utils
from .database import engine, get_db
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Document Expiry Tracker API"}

@app.post("/documents/", response_model=schemas.Document)
async def create_document(
    file: UploadFile = File(...),
    expiry_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        # Validate file
        await utils.validate_file(file)

        final_expiry_date = None
        if expiry_date:
            try:
                final_expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d")
            except ValueError:
                return JSONResponse(
                    status_code=422,
                    content={"detail": "Invalid date format. Use YYYY-MM-DD"}
                )
        else:
            extracted_date = await utils.extract_expiry_date(file)
            if extracted_date:
                final_expiry_date = extracted_date
            else:
                return JSONResponse(
                    status_code=422,
                    content={"detail": "Could not extract date. Please provide manually."}
                )

        try:
            filename, file_path = await utils.save_upload_file(file)
        except Exception as e:
            logger.error(f"File save error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Error saving file: {str(e)}"}
            )

        try:
            db_document = models.Document(
                filename=filename,
                original_filename=file.filename,
                expiry_date=final_expiry_date,
                upload_date=datetime.now(),
                file_path=file_path
            )

            db.add(db_document)
            db.commit()
            db.refresh(db_document)
            return db_document

        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            if os.path.exists(file_path):
                os.remove(file_path)
            return JSONResponse(
                status_code=500,
                content={"detail": f"Database error: {str(e)}"}
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

@app.get("/documents/", response_model=list[schemas.Document])
def get_documents(db: Session = Depends(get_db)):
    return db.query(models.Document).all()

@app.put("/documents/{document_id}", response_model=schemas.Document)
async def replace_document(
    document_id: int,
    file: UploadFile = File(...),
    expiry_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        await utils.validate_file(file)

        final_expiry_date = None
        if expiry_date:
            try:
                final_expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d")
            except ValueError:
                return JSONResponse(
                    status_code=422,
                    content={"detail": "Invalid date format. Use YYYY-MM-DD"}
                )
        else:
            extracted_date = await utils.extract_expiry_date(file)
            if extracted_date:
                final_expiry_date = extracted_date
            else:
                return JSONResponse(
                    status_code=422,
                    content={"detail": "Could not extract date. Please provide manually."}
                )

        # Delete old file
        if os.path.exists(document.file_path):
            try:
                os.remove(document.file_path)
            except Exception as e:
                logger.error(f"Error deleting old file: {str(e)}")

        try:
            filename, file_path = await utils.save_upload_file(file)
        except Exception as e:
            logger.error(f"Error saving new file: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Error saving file: {str(e)}"}
            )

        try:
            document.filename = filename
            document.original_filename = file.filename
            document.expiry_date = final_expiry_date
            document.upload_date = datetime.now()
            document.file_path = file_path

            db.commit()
            db.refresh(document)
            return document

        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            if os.path.exists(file_path):
                os.remove(file_path)
            return JSONResponse(
                status_code=500,
                content={"detail": f"Database error: {str(e)}"}
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

@app.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Error deleting file: {str(e)}"}
            )

    try:
        db.delete(document)
        db.commit()
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Database error: {str(e)}"}
        )