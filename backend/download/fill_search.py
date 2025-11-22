import os
import psycopg2
from elasticsearch import Elasticsearch

# Database connection
DB_NAME = os.getenv("DB_NAME", "search")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    host=DB_HOST,
    port=DB_PORT
)
cur = conn.cursor()

# Elasticsearch connection
es = Elasticsearch("http://localhost:9200")
INDEX = "documents"

mapping = {
    "mappings": {
        "properties": {
            "name": {"type": "text"},
            "tagline": {"type": "text"},
            "description": {"type": "text"},
            "how_its_made": {"type": "text"}
        }
    }
}

if not es.indices.exists(index=INDEX):
    es.indices.create(index=INDEX, body=mapping)

cur.execute("""
    SELECT uuid, name, tagline, description, how_its_made
    FROM project
""")
projects = cur.fetchall()

for uuid, name, tagline, description, how_its_made in projects:
    
    es.index(
        index=INDEX,
        id=uuid, 
        document={
            "name": name,
            "tagline": tagline,
            "description": description,
            "how_its_made": how_its_made
        }
    )
    

cur.close()
conn.close()

print(f"Indexed {len(projects)} projects in Elasticsearch")
print("Elasticsearch index ready")
