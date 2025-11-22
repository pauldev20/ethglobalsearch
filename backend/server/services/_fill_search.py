import os
import psycopg2
import elasticsearch

def fill_search(db_connection: psycopg2.extensions.connection, es: elasticsearch.Elasticsearch) -> int:
    cur = db_connection.cursor()
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
    db_connection.close()

    return len(projects)
