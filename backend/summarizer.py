from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import tempfile
import os

from backend.model_pipeline import RAGManager
from fastapi import Depends
# from .auth import get_current_user
from backend.auth import get_current_user, get_db
from backend.models import ProcessedDocument, User
from sqlalchemy.orm import Session
import json

import logging
logging.basicConfig(level=logging.INFO)

router = APIRouter()

@router.get("/history")
def get_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] Fetching history for user: {user.username}")
        
    docs = db.query(ProcessedDocument).filter(ProcessedDocument.user_id == user.id).order_by(ProcessedDocument.upload_date.desc()).all()
    
    def safe_json_loads(val):
        if not isinstance(val, str):
            return val
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            return val

    result = [
        {
            "id": str(d.id),
            "name": d.filename,
            "uploadDate": d.upload_date.isoformat(),
            "status": "completed",
            "summary": safe_json_loads(d.summary),
            "sources": d.sources,
            "fileSize": d.file_size,
            "fileType": d.file_type
        } for d in docs
    ]
    print(f"[DEBUG] Found {len(docs)} documents for user {user.username}")
    return result

@router.delete("/history/{doc_id}")
def delete_history_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] Attempting to delete document {doc_id} for user: {user.username}")
    doc = db.query(ProcessedDocument).filter(ProcessedDocument.id == doc_id, ProcessedDocument.user_id == user.id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or unauthorized")
        
    db.delete(doc)
    db.commit()
    print(f"[DEBUG] Successfully deleted document {doc_id}")
    return {"message": "Document deleted successfully"}

@router.post("/summarize")
async def summarize_pdf(
    file: UploadFile = File(...), 
    summary_format: str = "executive",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logging.info("Summarize endpoint hit")
    try:
        print(f"[INFO] Authenticated user: {user.username}")
        print(f"[INFO] Received file: {file.filename}")

        suffix = os.path.splitext(file.filename)[-1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            content = await file.read()
            temp.write(content)
            temp_path = temp.name

        print(f"[INFO] Saved temp file at: {temp_path}")
        
        rag_manager = RAGManager()
        summary, sources = await rag_manager.get_summary(temp_path, format_type=summary_format)

        os.remove(temp_path)
        print("[INFO] Removed temp file")

        # Persistence logic
        new_doc = ProcessedDocument(
            filename=file.filename,
            summary=json.dumps(summary) if not isinstance(summary, str) else summary,
            sources=sources,
            file_size=f"{len(content) / 1024 / 1024:.2f} MB",
            file_type=file.filename.split('.')[-1].upper() if '.' in file.filename else "PDF",
            user_id=user.id
        )
        db.add(new_doc)
        db.commit()
        print(f"[INFO] Saved document {file.filename} to database for user {user.username}")

        return JSONResponse(content={
            "summary": summary,
            "sources": sources
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
