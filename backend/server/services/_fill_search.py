import psycopg2
import elasticsearch
from elasticsearch import NotFoundError
from openai import AsyncOpenAI
import tiktoken


INDEX = "documents"

MAPPING = {
    "mappings": {
        "properties": {
            "name": {"type": "text"},
            "tagline": {"type": "text"},
            "description": {"type": "text"},
            "how_its_made": {"type": "text"},
            "event_name": {
                "type": "keyword"
            },
            "type": {
                "type": "keyword"
            },
            "sponsor_organization": {
                "type": "keyword"
            },
            "embedding": {
                "type": "dense_vector",
                "dims": 1536,
                "index": True,
                "similarity": "cosine",
            },
            "raw_embedding": {
                "type": "float"
            }
        }
    }
}


def shorten_text(text: str) -> str:
    encoding = tiktoken.encoding_for_model("text-embedding-3-small")
    MAX_TOKENS = 8000
    tokens = encoding.encode(text)
    if len(tokens) > MAX_TOKENS:
        truncated_tokens = tokens[:MAX_TOKENS]
        return encoding.decode(truncated_tokens)
    return text


async def generate_embedding(openai_client: AsyncOpenAI,
                             text: str) -> list[float]:
    """Generate an embedding for the given text."""
    try:
        response = await openai_client.embeddings.create(
            model="text-embedding-3-small", input=text)
        return response.data[0].embedding
    except Exception as e:
        return [0]


async def ensure_index(es: elasticsearch.Elasticsearch):
    """Create the index if it doesn't exist."""
    # es.indices.delete(index=INDEX, ignore=[404])
    if not es.indices.exists(index=INDEX):
        es.indices.create(index=INDEX, body=MAPPING)
        return

async def fetch_existing_doc(es, uuid):
    """Return existing doc source or None."""
    try:
        return es.get(index=INDEX, id=uuid)
    except NotFoundError:
        return None


async def fill_search(db_connection: psycopg2.extensions.connection,
                      es: elasticsearch.Elasticsearch,
                      openai_client: AsyncOpenAI) -> int:

    await ensure_index(es)

    with db_connection.cursor() as cur:
        # Fetch projects with event_name
        cur.execute("""
            SELECT uuid, name, tagline, description, how_its_made, event_name
            FROM project
            ORDER BY uuid
        """)
        projects = cur.fetchall()

        # Fetch all prizes grouped by project
        cur.execute("""
            SELECT project_uuid, prize_type, sponsor_organization_name
            FROM prize
            ORDER BY project_uuid
        """)
        prizes = cur.fetchall()

    # Build a map of project_uuid -> set of (type, sponsor_organization)
    prizes_map = {}
    for project_uuid, prize_type, sponsor_org in prizes:
        if project_uuid not in prizes_map:
            prizes_map[project_uuid] = {"types": set(), "orgs": set()}
        if prize_type:
            prizes_map[project_uuid]["types"].add(prize_type)
        if sponsor_org:
            prizes_map[project_uuid]["orgs"].add(sponsor_org)

    for uuid, name, tagline, description, how_its_made, event_name in projects:
        existing = await fetch_existing_doc(es, uuid)

        # Get prize data for this project
        prize_data = prizes_map.get(uuid, {"types": set(), "orgs": set()})
        prize_types = sorted(list(
            prize_data["types"]))  # Convert to sorted list for consistency
        sponsor_orgs = sorted(list(prize_data["orgs"]))

        # prepare full text for embedding
        parts = [name, tagline, description, how_its_made]
        full_text = "\n".join(filter(None, parts))
        full_text = shorten_text(full_text)

        # Check if we can reuse the existing embedding
        should_reuse_embedding = False
        if existing and existing['_source']:
            original_parts = []
            original_parts.append(existing['_source'].get('name'))
            original_parts.append(existing['_source'].get('tagline'))
            original_parts.append(existing['_source'].get('description'))
            original_parts.append(existing['_source'].get('how_its_made'))
            original_full_text = "\n".join(filter(None, parts))
            original_full_text = shorten_text(original_full_text)
            # Reuse embedding if text hasn't changed and embedding exists
            if original_full_text == full_text and existing['_source'].get(
                    'raw_embedding') is not None:
                should_reuse_embedding = True
                embedding = existing['_source']['raw_embedding']

        # Generate new embedding if we can't reuse
        if not should_reuse_embedding:
            print("Generating new embedding, uuid: ", uuid, flush=True)
            embedding = await generate_embedding(openai_client, full_text)

        # Always build and index the document with all current fields
        doc = {
            "name": name,
            "tagline": tagline,
            "description": description,
            "how_its_made": how_its_made,
            "event_name": event_name,
            "type": prize_types,
            "sponsor_organization": sponsor_orgs,
            "embedding": embedding,
            "raw_embedding": embedding
        }
        try:
            # Index the document with refresh=False for better performance
            result = es.index(index=INDEX, id=uuid, document=doc, refresh=True)
        except Exception as e:
            print(f"Error indexing document {uuid}: {e}")
            raise

    # Refresh the index once after all documents are indexed
    try:
        es.indices.refresh(index=INDEX)
    except Exception as e:
        print(f"Error refreshing index: {e}")
        raise

    return len(projects)
