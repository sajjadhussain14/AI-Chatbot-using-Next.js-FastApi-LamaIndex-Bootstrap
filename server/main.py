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
from src.ingestion.services import delete_Ingested_content

from fastapi.middleware.cors import CORSMiddleware

class TextInput(BaseModel):
    text: str



# Start OPENAI credentials
config_path = "./openai_key.env"
load_dotenv(dotenv_path=config_path)
api_key = os.getenv('OPENAI_API_KEY')
# If api_key is not None, then assign it to os.environ["OPENAI_API_KEY"]
if api_key is not None:
    os.environ["OPENAI_API_KEY"] = api_key
else:
    print("API Key is not set in the environment variables.")
# End OPENAI credentials

new_documents = []
removed_documents=[]
UPLOAD_DIR = "data"

# Setting chunk size for llamaindex, 512 and 50 are the default parameters, which are proved to be effective based on the documentation
# https://www.llamaindex.ai/blog/evaluating-the-ideal-chunk-size-for-a-rag-system-using-llamaindex-6207e5d3fec5
Settings.chunk_size = 1024

Settings.llm = OpenAI(temperature=0, model="gpt-4")

Settings.chunk_overlap = 512

# Get the absolute path to the data directory
directory_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "./data"))
file_metadata = lambda x : {"filename": x}
#Ensure the data directory exists
os.makedirs('data', exist_ok=True)
# Set up storage directory with absolute path
PERSIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "./storage"))

if not os.path.exists(PERSIST_DIR):
    # load the documents from data folder and create the index
    reader = SimpleDirectoryReader(directory_path, file_metadata=file_metadata)
    documents=reader.load_data()
    index = VectorStoreIndex.from_documents(documents)

    # store vectors and index in storage for future use
    index.storage_context.persist()
else:
    # load the existing index
    storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
    index = load_index_from_storage(storage_context)

#initialize query engine
query_engine = index.as_query_engine(response_mode="refine") #tree_summarize





from src.query.routes import router as query_router
from src.save_content.routes import router as save_content_router
from src.ingestion.routes import router as ingestion_router



app = FastAPI()


origins = [
     
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",

    
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)



# Mount the directory containing static files
app.mount("/static", StaticFiles(directory="static"), name="static")
# Mounting the 'data' directory to serve static files
app.mount("/data", StaticFiles(directory="data"), name="data")

app.state.index = index



# Include the routes here
app.include_router(query_router)
app.include_router(save_content_router)
app.include_router(ingestion_router)





# ******************* start ingestion all ***************

#define function to update query engine from api calls to ensure real-time update
def update_query_engine(index):
    global query_engine
    query_engine = index.as_query_engine()




@app.get("/ingest-all")
async def ingest_all():
    res=delete_Ingested_content(index)

    try:
        reader = SimpleDirectoryReader(directory_path, file_metadata=file_metadata)
        documents=reader.load_data()
        for d in documents:
            index.insert(document = d)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to store file in index: {str(e)}"})

    # Save the index storage and reload query engine
    try:
        index.storage_context.persist()
        update_query_engine(index)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to update index and query engine: {str(e)}"})


    # cleanup temp file after insert into index
    try:
        for temp_file_path in new_documents:
            os.unlink(temp_file_path)
    except Exception as e:
        # If unable to delete, close the file first
        async def close_and_delete(file_path):
            try:
                # Open the file in binary read mode and close it
                #async with open(file_path, 'rb'):
                    pass
            except FileNotFoundError:
                pass  # File already deleted
            except Exception as e:
                return JSONResponse(status_code=500, content={"message": f"Failed to close file: {str(e)}"})

            # Now attempt to delete the file
            try:
                os.unlink(file_path)
            except Exception as e:
                return JSONResponse(status_code=500, content={"message": f"Failed to clean up temp file: {str(e)}"})

        # Close and delete each file asynchronously
        close_and_delete_tasks = [close_and_delete(temp_file_path) for temp_file_path in new_documents]
        for task in close_and_delete_tasks:
            asyncio.create_task(task)

    return {"message": f"Successfully Ingested data Successfully!"}
# ******************* start ingestion all ***************









# Function to filter out all non txt files, and record their filename in a list
def filter_file_format(files: List[UploadFile]):
    filtered_files = [file for file in files if file.filename and file.filename.endswith('.txt')]

    # Record removed files for response
    removed_files = [file for file in files if not (file.filename and file.filename.endswith('.txt'))]
    removed_documents = [removed_file.filename for removed_file in removed_files]

    return removed_documents, filtered_files




#Retrieve html code for the main interface from index.html
def load_content():
    try:
        with open('index.html', 'r') as file:
            content = file.read()
        return content
    except IOError as e:
        print(f"Error reading file: {e}")
        return None

def load_admin():
    try:
        with open('admin.html', 'r') as file:
            content = file.read()
        return content
    except IOError as e:
        print(f"Error reading file: {e}")
        return None



@app.get("/ids")
async def ids():
    doc_ref_ids = list(index.ref_doc_info.keys())

    return doc_ref_ids

# ********************** start query *********************

#Query API Definition
'''
@app.get("/query")
async def search_query(query: str ):
    #Retrieve response from the query engine
    if query =='':
        return JSONResponse(status_code=400, content={"message": "No query text detected. Please ensure query is not empty."}) 
    try: 
      # Generate query using the query engine, markdown the response and return the results
      response =  query_engine.query(query)

      results = Markdown(f"{response}")
      return {"query": query, "results": results.data}
    except Exception as e:
      return JSONResponse(status_code=500, content={"message": f"Failed to process query: {str(e)}"})

'''






#Main interface for web application
@app.get("/")
async def main():
    content = load_content()
    return HTMLResponse(content=content)

@app.get("/admin")
async def admin():
    content = load_admin()
    return HTMLResponse(content=content)





    






 



def generate_filename_with_datetime(filename: str) -> str:
    """Generate a filename with datetime appended at the end."""
    base_name, ext = os.path.splitext(filename)
    current_datetime = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{base_name}-{current_datetime}{ext}" if base_name else ""

async def upload_file(file_location: str):
    """Upload text file to the specified location."""
    try:
        # Rename the uploaded text file to remove the original extension
        new_file_location = os.path.join(UPLOAD_DIR, os.path.basename(file_location))
        os.rename(file_location, new_file_location)
        print(f"Text file uploaded to: {new_file_location}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

async def convert_docx_to_text(uploaded_file, file_location):
    """Convert DOCX file to text."""
    try:
        with open(file_location, "wb") as file_object:
            shutil.copyfileobj(uploaded_file.file, file_object)
        doc = Document(file_location)
        text = ''
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        with open(file_location + '.txt', "w", encoding='utf-8') as text_file:
            text_file.write(text)
        # Upload the converted text file
        await upload_file(file_location + '.txt')
        # Remove the temporary DOCX file
        os.remove(file_location)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to convert DOCX to text: {str(e)}")

async def convert_pdf_to_text(uploaded_file, file_location):
    """Convert PDF file to text."""
    try:
        # Save the PDF file temporarily
        temp_pdf_file = os.path.join(UPLOAD_DIR, 'temp.pdf')
        with open(temp_pdf_file, "wb") as file_object:
            shutil.copyfileobj(uploaded_file.file, file_object)
        # Read the PDF file and extract text
        text = ''
        reader = PdfReader(temp_pdf_file)
        for page in reader.pages:
            text += page.extract_text() 
        # Delete the temporary PDF file
        os.remove(temp_pdf_file)
        # Save the extracted text to a text file
        pdf_text_file_location = file_location + '.txt'
        with open(pdf_text_file_location, "w", encoding='utf-8') as text_file:
            text_file.write(text)
        # Upload the converted text file
        await upload_file(pdf_text_file_location)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to convert PDF to text: {str(e)}")

@app.post("/upload-files")
async def upload_files(files: List[UploadFile] = File(...)):
    try:
        for uploaded_file in files:
            if uploaded_file.filename:
                filename = generate_filename_with_datetime(uploaded_file.filename)
                file_location = os.path.join(UPLOAD_DIR, filename)
                # Convert PDF file to text
                if uploaded_file.filename.lower().endswith('.pdf'):
                    await convert_pdf_to_text(uploaded_file, file_location)
                # Convert image file to text
                elif uploaded_file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp','.webp')):
                    await convert_image_to_text(uploaded_file, file_location)
                # Convert DOCX files to text
                elif uploaded_file.filename.lower().endswith(('.doc', '.docx')):
                    await convert_docx_to_text(uploaded_file, file_location)
                else:
                    # If file type is not supported, simply save it
                    with open(file_location, "wb") as file_object:
                        shutil.copyfileobj(uploaded_file.file, file_object)
                    await upload_file(file_location)
        return {"message": "Files uploaded and converted to text successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")

async def convert_image_to_text(uploaded_file, file_location):
    # Initialize the OCR reader
    reader = easyocr.Reader(['en'])  # 'en' for English, adjust for other languages

    """Convert image file to text using EasyOCR."""
    try:
        # Save the uploaded image file
        with open(file_location, "wb") as file_object:
            shutil.copyfileobj(uploaded_file.file, file_object)
        
        # Get the current directory of the script
        current_dir = os.path.dirname(os.path.realpath(__file__))
        
        # Path to the image file
        image_path = file_location
        
        # Read the image using EasyOCR
        result = reader.readtext(image_path)
        
        # Extract text from the result
        extracted_text = ' '.join([text[1] for text in result])
        print(extracted_text)
        
        # Write the extracted text to a text file
        text_file_location = file_location + ".txt"
        with open(text_file_location, "w", encoding="utf-8") as text_file:
            text_file.write(extracted_text)
        
        # Upload the converted text file
        await upload_file(text_file_location)
        
        # Remove the uploaded image file
        os.remove(file_location)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Failed to convert image to text: {str(e)}")


# Endpoint to list files in the 'data' directory with their creation date
@app.get("/list-files")
async def list_files():
    files = []
    data_dir = "data"  # Path to the directory containing files
    for filename in os.listdir(data_dir):
        if os.path.isfile(os.path.join(data_dir, filename)):
            file_path = os.path.join(data_dir, filename)
            creation_time = datetime.fromtimestamp(os.path.getctime(file_path)).strftime('%Y-%m-%d %H:%M:%S')
            files.append({"name": filename, "created_at": creation_time})
    return files

# Endpoint to delete a file by name
@app.delete("/delete-file/{file_name}")
async def delete_file(file_name: str):
    try:
        file_path = os.path.join("data", file_name)
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"message": f"File '{file_name}' deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"File '{file_name}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file '{file_name}': {str(e)}")

# Endpoint to delete all files in the 'data' directory
@app.delete("/delete-all-files")
async def delete_all_files():
    try:
        data_dir = "data"  # Path to the directory containing files
        for filename in os.listdir(data_dir):
            file_path = os.path.join(data_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        return {"message": "All files deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete all files: {str(e)}")
