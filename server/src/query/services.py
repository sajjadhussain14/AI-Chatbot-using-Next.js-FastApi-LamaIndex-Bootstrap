from fastapi.responses import JSONResponse
from IPython.display import Markdown
from llama_index.core import query_engine
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader,StorageContext, load_index_from_storage


from llama_index.core import VectorStoreIndex, SimpleDirectoryReader,StorageContext, load_index_from_storage
from IPython.display import Markdown
from llama_index.core import Settings
from dotenv import load_dotenv
import os





async def search_query(query: str,index):
    
    
    
    Settings.chunk_size = 1024

    Settings.llm = OpenAI(temperature=0, model="gpt-4")

    Settings.chunk_overlap = 512

    # Set up variables for directory path and file metadata
    directory_path = "./data"
    file_metadata = lambda x : {"filename": x}

    #Ensure the data directory exists
    os.makedirs('data', exist_ok=True)

    # check if storage already exists
    PERSIST_DIR = "./storage"
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

    
    
    
    
    #Retrieve response from the query engine
    if query =='':
        return JSONResponse(status_code=400, content={"message": "No query text detected. Please ensure query is not empty."}) 
    try: 
        # Generate query using the query engine, markdown the response and return the results
        response =  query_engine.query(query)

        results = Markdown(f"{response}")
        return {"query": query, "results": results.data}
    except Exception as e:
        print(e)
        return JSONResponse(status_code=500, content={"message": f"Failed to process query: {str(e)}"})
