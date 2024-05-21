import os
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader,StorageContext, load_index_from_storage

UPLOAD_DIR = "data"
CHUNK_SIZE = 1024
CHUNK_OVERLAP = 512
PERSIST_DIR = "storage"
MODEL_TEMPERATURE = 0
MODEL_NAME = "gpt-4"
file_metadata = lambda x : {"filename": x}


def load_or_create_index(data_dir,PERSIST_DIR):
    if not os.path.exists(PERSIST_DIR):
        # load the documents from data folder and create the index
        reader = SimpleDirectoryReader(data_dir, file_metadata=file_metadata)
        documents=reader.load_data()
        index = VectorStoreIndex.from_documents(documents)

        # store vectors and index in storage for future use
        index.storage_context.persist()
    else:
        # load the existing index
        storage_context = StorageContext.from_defaults(persist_dir=PERSIST_DIR)
        index = load_index_from_storage(storage_context)
