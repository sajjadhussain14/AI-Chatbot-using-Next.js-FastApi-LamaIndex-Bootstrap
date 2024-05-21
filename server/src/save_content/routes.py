# routes.py
from fastapi import APIRouter, HTTPException
from src.save_content.services import save_url_content
# routes.py
from fastapi import APIRouter, HTTPException
from src.save_content.services import save_text_as_file
from src.save_content.models import TextInput

router = APIRouter()

@router.get("/save")
async def save_url_content_route(url: str):
    try:
        result = save_url_content(url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save URL content: {str(e)}")
    


@router.post("/save-text")
async def save_text_as_file_route(text_input: TextInput):
    try:
        result = save_text_as_file(text_input)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save text as file: {str(e)}")
    
