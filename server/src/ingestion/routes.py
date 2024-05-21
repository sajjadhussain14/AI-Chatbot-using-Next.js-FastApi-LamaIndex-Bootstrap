# src/ingestion/routes.py
from fastapi import APIRouter, HTTPException,Depends,Request
from src.ingestion.services import ingest_documents,delete_Ingested_content, check_ingestion

router = APIRouter()

'''
@router.get("/ingest-all")
async def ingest_all(request: Request):
    index = request.app.state.index

    try:
        res= await  delete_Ingested_content(index)
        ingest_documents(index)
        return {"message": "Successfully ingested data!"}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Failed to ingest data: {str(e)}")
'''


@router.get("/delete-all-ingestions")
async def delete_all_ingestions(request: Request):
    index = request.app.state.index
    try:
        res= await delete_Ingested_content(index)
        return {"message": "Deleted all ingestions successfully!"}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Failed to delete ingestions: {str(e)}")


@router.get("/check-ingestion")
async def check_ingestion_route(request: Request):
    index = request.app.state.index

    try:
        ingestion_status = check_ingestion(index)
        return ingestion_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check ingestion status: {str(e)}")
        
