from fastapi import APIRouter, HTTPException,Request
from .services import search_query

router = APIRouter()

# Query API Definition
@router.get("/query")
async def search_query_route(request: Request,query: str):
    index = request.app.state.index

    try: 
        results = await search_query(query,index)
        return results
    except HTTPException as e:
        return e
