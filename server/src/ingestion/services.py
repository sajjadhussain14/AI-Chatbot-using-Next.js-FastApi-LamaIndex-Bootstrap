from typing import Annotated,List
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader,StorageContext, load_index_from_storage
from IPython.display import Markdown
from llama_index.core import Settings
from dotenv import load_dotenv
import os
import asyncio
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pypdf import PdfReader

from fastapi import HTTPException
from requests.exceptions import HTTPError

from pydantic import BaseModel
from fake_useragent import UserAgent

import shutil
from fastapi import FastAPI, UploadFile, HTTPException
from typing import List

from llama_index.llms.openai import OpenAI

import easyocr
import os


from docx import Document


class TextInput(BaseModel):
    text: str




#define function to update query engine from api calls to ensure real-time update
def update_query_engine(index):
    global query_engine
    query_engine = index.as_query_engine()

# Function to ingest documents
def ingest_documents(index):
    return ''

# Function to delete all ingested content
async def delete_Ingested_content(index):
    
    
    doc_ref_ids = list(index.ref_doc_info.keys())
    try:
        for doc_ref_id in doc_ref_ids:
            print(doc_ref_id)
            index.delete_ref_doc(doc_ref_id, delete_from_docstore=True)
        return {"message": "Deleted all Ingestion Successfully!"}
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to delete Ingestion: {str(e)}"})

# Function to check if ingestion exists
def check_ingestion(index):
    
    doc_ref_ids = list(index.ref_doc_info.keys())
    print("I am here")
    print(doc_ref_ids)

    if doc_ref_ids:
        # Ingestion exists
        return True
    else:
        # No ingestion exists
        return False

