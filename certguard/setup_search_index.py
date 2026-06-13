import os
import json
import glob
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType,
)

# Load environment variables
load_dotenv()

AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")
INDEX_NAME = "certguard-index"

def load_documents_from_docs():
    docs_dir = os.path.join(os.path.dirname(__file__), "docs")
    documents = []
    
    # Read markdown files
    md_files = glob.glob(os.path.join(docs_dir, "*.md"))
    for idx, filepath in enumerate(md_files):
        filename = os.path.basename(filepath)
        title = filename.replace(".md", "").replace("_", " ").title()
        
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            
        doc_id = f"doc_{idx}"
        documents.append({
            "id": doc_id,
            "title": title,
            "content": content,
            "category": "certification_guide",
            "filename": filename
        })
        
    return documents

def setup_azure_search():
    if not AZURE_SEARCH_ENDPOINT or not AZURE_SEARCH_KEY:
        print("Azure Search endpoint or key not found in environment variables. Skipping Azure setup.")
        return False
        
    print(f"Connecting to Azure AI Search at {AZURE_SEARCH_ENDPOINT}...")
    
    try:
        credential = AzureKeyCredential(AZURE_SEARCH_KEY)
        index_client = SearchIndexClient(endpoint=AZURE_SEARCH_ENDPOINT, credential=credential)
        
        # Check if index exists, delete it if it does (to recreate)
        existing_indexes = [index.name for index in index_client.list_indexes()]
        if INDEX_NAME in existing_indexes:
            print(f"Index '{INDEX_NAME}' already exists. Deleting it to refresh...")
            index_client.delete_index(INDEX_NAME)
            
        # Define the schema
        fields = [
            SimpleField(name="id", type=SearchFieldDataType.String, key=True),
            SearchableField(name="title", type=SearchFieldDataType.String, analyzer_name="en.microsoft"),
            SearchableField(name="content", type=SearchFieldDataType.String, analyzer_name="en.microsoft"),
            SimpleField(name="category", type=SearchFieldDataType.String, filterable=True, facetable=True),
            SimpleField(name="filename", type=SearchFieldDataType.String)
        ]
        
        index = SearchIndex(name=INDEX_NAME, fields=fields)
        print(f"Creating index '{INDEX_NAME}'...")
        index_client.create_index(index)
        
        # Upload documents
        documents = load_documents_from_docs()
        if not documents:
            print("No documents found in docs/ directory.")
            return True
            
        search_client = SearchClient(endpoint=AZURE_SEARCH_ENDPOINT, index_name=INDEX_NAME, credential=credential)
        print(f"Uploading {len(documents)} documents to index '{INDEX_NAME}'...")
        results = search_client.upload_documents(documents=documents)
        for result in results:
            print(f"Document {result.key} upload success: {result.succeeded}")
            
        print("Azure AI Search indexing completed successfully.")
        return True
    except Exception as e:
        print(f"Failed to setup Azure Search: {e}")
        return False

def save_local_index():
    # Keep local copy as fallback if Azure Search is not available or credentials fail
    documents = load_documents_from_docs()
    db_dir = os.path.join(os.path.dirname(__file__), "db")
    os.makedirs(db_dir, exist_ok=True)
    
    local_index_path = os.path.join(db_dir, "local_search_index.json")
    with open(local_index_path, "w", encoding="utf-8") as f:
        json.dump(documents, f, indent=4)
    print(f"Saved local search index fallback with {len(documents)} documents to {local_index_path}")

if __name__ == "__main__":
    print("Starting search index setup...")
    azure_success = setup_azure_search()
    save_local_index()
    print("Search index setup step finished.")
