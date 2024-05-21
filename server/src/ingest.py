import os
import asyncio
from llama_index.core import SimpleDirectoryReader, load_index_from_storage, StorageContext
from src.ingestion.services import delete_Ingested_content
from fastapi.responses import JSONResponse

async def ingest_all(index, directory_path, file_metadata, new_documents):
    res = delete_Ingested_content(index)

    try:
        reader = SimpleDirectoryReader(directory_path, file_metadata=file_metadata)
        documents = reader.load_data()
        for d in documents:
            index.insert(document=d)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to store file in index: {str(e)}"})

    try:
        index.storage_context.persist()
        # Assuming 'update_query_engine' function is defined elsewhere
        update_query_engine(index)
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Failed to update index and query engine: {str(e)}"})

    # Cleanup temp files after insert into index
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

    return {"message": "Successfully ingested data!"}
