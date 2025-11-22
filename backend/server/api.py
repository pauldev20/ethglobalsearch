from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
import elasticsearch
import asyncio

from services.scheduler import update_projects
from openai import AsyncOpenAI

router = APIRouter(prefix="")


def get_db(request: Request) -> psycopg2.extensions.connection:
    """Dependency to get database connection from app state"""
    return request.app.state.db

def get_es(request: Request) -> elasticsearch.Elasticsearch:
    """Dependency to get Elasticsearch client from app state"""
    return request.app.state.es

def get_openai(request: Request) -> AsyncOpenAI:
    """Dependency to get OpenAI client from app state"""
    return request.app.state.openai_client

@router.get("/types")
def get_types(db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT DISTINCT prize_type FROM prize")
    types = cur.fetchall()
    event_names = cur.execute("SELECT DISTINCT event_name FROM project")
    event_names = cur.fetchall()
    sponsor_organizations = cur.execute("SELECT DISTINCT sponsor_organization_name FROM prize")
    sponsor_organizations = cur.fetchall()

    return {
        "types": [type[0] for type in types],
        "event_names": [event_name[0] for event_name in event_names],
        "sponsor_organizations": [sponsor_organization[0] for sponsor_organization in sponsor_organizations]
    }

class SearchQuery(BaseModel):
    event_name: Optional[List[str]] = None
    prize_type: Optional[List[str]] = None
    sponsor_organization: Optional[List[str]] = None
    query: Optional[str] = None
    page: Optional[int] = 1
    page_size: Optional[int] = 12

@router.post("/search")
def search(q: SearchQuery,
           db: psycopg2.extensions.connection = Depends(get_db),
           es: elasticsearch.Elasticsearch = Depends(get_es)):
    INDEX = "documents"
    
    # Pagination parameters
    page = max(1, q.page or 1)
    page_size = max(1, min(100, q.page_size or 12))  # Limit max page_size to 100
    from_offset = (page - 1) * page_size

    # Build Elasticsearch bool query with all filters
    must_clauses = []
    filter_clauses = []

    # Text search query
    if q.query:
        must_clauses.append({
            "multi_match": {
                "query": q.query,
                "fields":
                ["name^5", "tagline^2", "description", "how_its_made"],
                "type": "best_fields",
                "operator": "or",
                "fuzziness": "AUTO",
                "minimum_should_match": "75%"
            }
        })

    # Filter by event_name
    if q.event_name:
        filter_clauses.append({"terms": {"event_name": q.event_name}})

    # Filter by prize type
    if q.prize_type:
        filter_clauses.append({"terms": {"type": q.prize_type}})

    # Filter by sponsor_organization
    if q.sponsor_organization:
        filter_clauses.append(
            {"terms": {
                "sponsor_organization": q.sponsor_organization
            }})

    # Build the query
    es_query = {}
    if must_clauses or filter_clauses:
        bool_query = {}
        if must_clauses:
            bool_query["must"] = must_clauses
        if filter_clauses:
            bool_query["filter"] = filter_clauses
        es_query = {"bool": bool_query}
    else:
        # If no filters, match all
        es_query = {"match_all": {}}

    # Execute Elasticsearch query with pagination
    res = es.search(
        index=INDEX,
        query=es_query,
        highlight={
            "fields": {
                "name": {},
                "tagline": {},
                "description": {},
                "how_its_made": {}
            }
        },
        from_=from_offset,
        size=page_size
    )

    # Get total count
    total_hits = res["hits"]["total"]["value"] if isinstance(res["hits"]["total"], dict) else res["hits"]["total"]

    # Extract results
    es_result_ids = []
    highlights_map = {}
    for hit in res["hits"]["hits"]:
        es_result_ids.append(hit["_id"])
        highlights_map[hit["_id"]] = {
            "score": hit["_score"],
            "highlights": hit.get("highlight", {})
        }

    # If no results from ES, return empty
    if not es_result_ids:
        return []

    # Fetch full project data from database
    placeholders = ','.join(['%s'] * len(es_result_ids))
    cur = db.cursor()
    cur.execute(
        f"""
        SELECT *
        FROM project
        WHERE uuid IN ({placeholders})
        """, es_result_ids)
    columns = [desc[0] for desc in cur.description]
    projects = cur.fetchall()

    # Fetch prizes for all matching projects
    project_uuids = [project[0]
                     for project in projects]  # uuid is first column
    prizes_map = {}

    if project_uuids:
        prize_placeholders = ','.join(['%s'] * len(project_uuids))
        cur.execute(
            f"""
            SELECT *
            FROM prize
            WHERE project_uuid IN ({prize_placeholders})
        """, project_uuids)
        
        prize_columns = [desc[0] for desc in cur.description]
        for row in cur.fetchall():
            project_uuid = row[0]
            if project_uuid not in prizes_map:
                prizes_map[project_uuid] = []
            prize_dict = dict(zip(prize_columns, row))
            prizes_map[project_uuid].append({
                "project_uuid": prize_dict["project_uuid"],
                "name": prize_dict["name"],
                "pool_prize": prize_dict["pool_prize"],
                "prize_name": prize_dict["prize_name"],
                "prize_emoji": prize_dict["prize_emoji"],
                "prize_type": prize_dict["prize_type"],
                "sponsor_name": prize_dict["sponsor_name"],
                "sponsor_organization_name": prize_dict["sponsor_organization_name"],
                "sponsor_organization_square_logo_url": prize_dict["sponsor_organization_square_logo_url"]
            })

    cur.close()

    # Build response with full entries and highlights
    response = []
    for project in projects:
        project_dict = dict(zip(columns, project))
        uuid = project_dict["uuid"]

        result = {**project_dict, "prizes": prizes_map.get(uuid, [])}

        # Add highlights and score from Elasticsearch
        if uuid in highlights_map:
            result["score"] = highlights_map[uuid]["score"]
            result["highlights"] = highlights_map[uuid]["highlights"]
        else:
            # Set score to 0 for items without ES score (filtered results without text query)
            result["score"] = 0

        response.append(result)

    # Sort by Elasticsearch score (descending), items without score go last
    response.sort(key=lambda x: x.get("score", 0), reverse=True)

    return {
        "results": response,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total_hits,
            "total_pages": (total_hits + page_size - 1) // page_size if total_hits > 0 else 0
        }
    }

@router.post("/graph")
def graph(q: SearchQuery,
          db: psycopg2.extensions.connection = Depends(get_db),
          es: elasticsearch.Elasticsearch = Depends(get_es)):
    INDEX = "documents"
    
    # Build Elasticsearch bool query with all filters (same as /search)
    must_clauses = []
    filter_clauses = []

    # Text search query
    if q.query:
        must_clauses.append({
            "multi_match": {
                "query": q.query,
                "fields":
                ["name^5", "tagline^2", "description", "how_its_made"],
                "type": "best_fields",
                "operator": "or",
                "fuzziness": "AUTO",
                "minimum_should_match": "75%"
            }
        })

    # Filter by event_name
    if q.event_name:
        filter_clauses.append({"terms": {"event_name": q.event_name}})

    # Filter by prize type
    if q.prize_type:
        filter_clauses.append({"terms": {"type": q.prize_type}})

    # Filter by sponsor_organization
    if q.sponsor_organization:
        filter_clauses.append(
            {"terms": {
                "sponsor_organization": q.sponsor_organization
            }})

    # Build the query
    es_query = {}
    if must_clauses or filter_clauses:
        bool_query = {}
        if must_clauses:
            bool_query["must"] = must_clauses
        if filter_clauses:
            bool_query["filter"] = filter_clauses
        es_query = {"bool": bool_query}
    else:
        # If no filters, match all
        es_query = {"match_all": {}}

    # Execute Elasticsearch query (no pagination for graph - get all matching)
    res = es.search(
        index=INDEX,
        query=es_query,
        size=10000  # Get up to 10k results for graph
    )

    # Extract result IDs
    es_result_ids = []
    for hit in res["hits"]["hits"]:
        es_result_ids.append(hit["_id"])

    # If no results, return empty graph
    if not es_result_ids:
        return {"nodes": [], "links": []}

    # Fetch full project data from database
    placeholders = ','.join(['%s'] * len(es_result_ids))
    cur = db.cursor()
    cur.execute(
        f"""
        SELECT *
        FROM project
        WHERE uuid IN ({placeholders})
        """, es_result_ids)
    columns = [desc[0] for desc in cur.description]
    projects = cur.fetchall()

    # Build nodes from projects
    project_uuids = [project[0] for project in projects]  # uuid is first column
    nodes = []
    nodes_map = {}  # uuid -> node index for quick lookup
    
    for idx, project in enumerate(projects):
        project_dict = dict(zip(columns, project))
        uuid = project_dict["uuid"]
        
        # Create node with only id, name, and event_name for force-graph
        node = {
            "id": uuid,
            "name": project_dict.get("name"),
            "event_name": project_dict.get("event_name")
        }
        
        nodes.append(node)
        nodes_map[uuid] = idx

    # Fetch similarity relationships between the filtered projects
    links = []
    if project_uuids:
        # Get all similarity relationships where both projects are in our filtered set
        similarity_placeholders = ','.join(['%s'] * len(project_uuids))
        cur.execute(
            f"""
            SELECT uuid_1, uuid_2, similarity_score
            FROM similarity
            WHERE uuid_1 IN ({similarity_placeholders})
            AND uuid_2 IN ({similarity_placeholders})
            """, project_uuids + project_uuids)
        
        for row in cur.fetchall():
            uuid_1, uuid_2, similarity_score = row
            # Only add link if both nodes are in our graph
            if uuid_1 in nodes_map and uuid_2 in nodes_map:
                links.append({
                    "source": uuid_1,  # force-graph expects source/target to be node ids
                    "target": uuid_2,
                    "similarity_score": similarity_score
                })

    cur.close()

    return {
        "nodes": nodes,
        "links": links
    }

@router.get("/similar")
def similar(uuid: str,
            db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor()
    # Get top 20 most similar projects ordered by similarity score
    cur.execute(
        "SELECT uuid_2, similarity_score FROM similarity WHERE uuid_1 = %s ORDER BY similarity_score DESC LIMIT 20",
        (uuid,)
    )
    results = cur.fetchall()
    cur.close()

    # If no results, return empty list
    if not results:
        return []

    # Extract UUIDs and similarity scores
    similar_uuids = [row[0] for row in results]
    similarity_scores = {row[0]: row[1] for row in results}

    # Fetch full project data from database
    placeholders = ','.join(['%s'] * len(similar_uuids))
    cur = db.cursor()
    cur.execute(
        f"""
        SELECT *
        FROM project
        WHERE uuid IN ({placeholders})
        """, similar_uuids)
    columns = [desc[0] for desc in cur.description]
    projects = cur.fetchall()

    # Fetch prizes for all matching projects
    project_uuids = [project[0] for project in projects]  # uuid is first column
    prizes_map = {}

    if project_uuids:
        prize_placeholders = ','.join(['%s'] * len(project_uuids))
        cur.execute(
            f"""
            SELECT *
            FROM prize
            WHERE project_uuid IN ({prize_placeholders})
        """, project_uuids)
        
        prize_columns = [desc[0] for desc in cur.description]
        for row in cur.fetchall():
            project_uuid = row[0]
            if project_uuid not in prizes_map:
                prizes_map[project_uuid] = []
            prize_dict = dict(zip(prize_columns, row))
            prizes_map[project_uuid].append({
                "project_uuid": prize_dict["project_uuid"],
                "name": prize_dict["name"],
                "pool_prize": prize_dict["pool_prize"],
                "prize_name": prize_dict["prize_name"],
                "prize_emoji": prize_dict["prize_emoji"],
                "prize_type": prize_dict["prize_type"],
                "sponsor_name": prize_dict["sponsor_name"],
                "sponsor_organization_name": prize_dict["sponsor_organization_name"],
                "sponsor_organization_square_logo_url": prize_dict["sponsor_organization_square_logo_url"]
            })

    cur.close()

    # Build response with full entries and similarity scores
    response = []
    for project in projects:
        project_dict = dict(zip(columns, project))
        project_uuid = project_dict["uuid"]

        result = {**project_dict, "prizes": prizes_map.get(project_uuid, [])}

        # Add similarity score
        if project_uuid in similarity_scores:
            result["similarity_score"] = similarity_scores[project_uuid]

        response.append(result)

    # Sort by similarity score (descending) to maintain order
    response.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)

    return response

@router.get("/project")
def get_project(uuid: str,
                db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor()
    
    # Fetch the project by UUID
    cur.execute(
        """
        SELECT *
        FROM project
        WHERE uuid = %s
        """, (uuid,)
    )
    columns = [desc[0] for desc in cur.description]
    project = cur.fetchone()
    
    # If project not found, return 404
    if not project:
        cur.close()
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Convert to dictionary
    project_dict = dict(zip(columns, project))
    project_uuid = project_dict["uuid"]
    
    # Fetch prizes for the project
    cur.execute(
        """
        SELECT *
        FROM prize
        WHERE project_uuid = %s
        """, (project_uuid,)
    )
    
    prize_columns = [desc[0] for desc in cur.description]
    prizes = []
    for row in cur.fetchall():
        prize_dict = dict(zip(prize_columns, row))
        prizes.append({
            "project_uuid": prize_dict["project_uuid"],
            "name": prize_dict["name"],
            "pool_prize": prize_dict["pool_prize"],
            "prize_name": prize_dict["prize_name"],
            "prize_emoji": prize_dict["prize_emoji"],
            "prize_type": prize_dict["prize_type"],
            "sponsor_name": prize_dict["sponsor_name"],
            "sponsor_organization_name": prize_dict["sponsor_organization_name"],
            "sponsor_organization_square_logo_url": prize_dict["sponsor_organization_square_logo_url"]
        })
    
    cur.close()
    
    # Build response with project and prizes
    result = {**project_dict, "prizes": prizes}
    
    return result

class ChatQuery(BaseModel):
    query: str

@router.post("/chat")
async def chat(q: ChatQuery,
               db: psycopg2.extensions.connection = Depends(get_db),
               es: elasticsearch.Elasticsearch = Depends(get_es),
               openai_client: AsyncOpenAI = Depends(get_openai)):
    INDEX = "documents"

    # Step 1: Use OpenAI chat to generate a search query from natural language
    chat_response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role":
            "system",
            "content":
            """
            You transform a natural language request into an expanded list of search keywords.
Your job is to:
- extract the core concepts
- expand them with synonyms, related categories, and domain-relevant terms
- include both specific and broad variants
- output 8-20 search tokens
- avoid stopwords and filler words
- return ONLY a comma-separated list of search keywords. No sentences.

For example, if the user asks "Show me projects like Facebook",
you should output keywords like:
social media, messaging, social network, chat app, community platform, user profiles, feed, timeline, friends list, photo sharing, real-time updates

            """
        }, {
            "role": "user",
            "content": q.query
        }],
        temperature=0.3,
        max_tokens=300)

    search_query = chat_response.choices[0].message.content.strip()
    print(search_query)
    # Step 2: Generate embedding for the search query
    from services._fill_search import generate_embedding
    embedding = await generate_embedding(openai_client, search_query)

    # Step 3: Use KNN search to find similar projects (top 100)
    res = es.search(
        index=INDEX,
        knn={
            "field": "embedding",
            "query_vector": embedding,
            "k": 100,
            "num_candidates": 500,
        },
        size=100,
    )

    # Extract results
    es_result_ids = []
    scores_map = {}
    for hit in res["hits"]["hits"]:
        es_result_ids.append(hit["_id"])
        scores_map[hit["_id"]] = hit["_score"]

    # If no results, return empty
    if not es_result_ids:
        return []

    # Fetch full project data from database
    placeholders = ','.join(['%s'] * len(es_result_ids))
    cur = db.cursor()
    cur.execute(
        f"""
        SELECT *
        FROM project
        WHERE uuid IN ({placeholders})
        """, es_result_ids)
    columns = [desc[0] for desc in cur.description]
    projects = cur.fetchall()

    # Fetch prizes for all matching projects
    project_uuids = [project[0]
                     for project in projects]  # uuid is first column
    prizes_map = {}

    if project_uuids:
        prize_placeholders = ','.join(['%s'] * len(project_uuids))
        cur.execute(
            f"""
            SELECT *
            FROM prize
            WHERE project_uuid IN ({prize_placeholders})
        """, project_uuids)
        
        prize_columns = [desc[0] for desc in cur.description]
        for row in cur.fetchall():
            project_uuid = row[0]
            if project_uuid not in prizes_map:
                prizes_map[project_uuid] = []
            prize_dict = dict(zip(prize_columns, row))
            prizes_map[project_uuid].append({
                "project_uuid": prize_dict["project_uuid"],
                "name": prize_dict["name"],
                "pool_prize": prize_dict["pool_prize"],
                "prize_name": prize_dict["prize_name"],
                "prize_emoji": prize_dict["prize_emoji"],
                "prize_type": prize_dict["prize_type"],
                "sponsor_name": prize_dict["sponsor_name"],
                "sponsor_organization_name": prize_dict["sponsor_organization_name"],
                "sponsor_organization_square_logo_url": prize_dict["sponsor_organization_square_logo_url"]
            })

    cur.close()

    # Build response with full entries and similarity scores
    response = []
    for project in projects:
        project_dict = dict(zip(columns, project))
        uuid = project_dict["uuid"]

        result = {**project_dict, "prizes": prizes_map.get(uuid, [])}

        # Add similarity score from KNN search
        if uuid in scores_map:
            result["similarity_score"] = scores_map[uuid]

        response.append(result)

    # Sort by similarity score (descending) to maintain order
    response.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)

    return response

class EmbeddingsQuery(BaseModel):
    keywords: str

@router.post("/embeddings")
async def embeddings(q: EmbeddingsQuery,
                     db: psycopg2.extensions.connection = Depends(get_db),
                     es: elasticsearch.Elasticsearch = Depends(get_es),
                     openai_client: AsyncOpenAI = Depends(get_openai)):
    INDEX = "documents"

    # Step 1: Generate embedding for the user-provided keywords (no LLM chat step)
    from services._fill_search import generate_embedding
    embedding = await generate_embedding(openai_client, q.keywords)

    # Step 2: Use KNN search to find similar projects (top 100)
    res = es.search(
        index=INDEX,
        knn={
            "field": "embedding",
            "query_vector": embedding,
            "k": 100,
            "num_candidates": 500,
        },
        size=100,
    )

    # Extract results
    es_result_ids = []
    scores_map = {}
    for hit in res["hits"]["hits"]:
        es_result_ids.append(hit["_id"])
        scores_map[hit["_id"]] = hit["_score"]

    # If no results, return empty
    if not es_result_ids:
        return []

    # Fetch full project data from database
    placeholders = ','.join(['%s'] * len(es_result_ids))
    cur = db.cursor()
    cur.execute(
        f"""
        SELECT *
        FROM project
        WHERE uuid IN ({placeholders})
        """, es_result_ids)
    columns = [desc[0] for desc in cur.description]
    projects = cur.fetchall()

    # Fetch prizes for all matching projects
    project_uuids = [project[0]
                     for project in projects]  # uuid is first column
    prizes_map = {}

    if project_uuids:
        prize_placeholders = ','.join(['%s'] * len(project_uuids))
        cur.execute(
            f"""
            SELECT *
            FROM prize
            WHERE project_uuid IN ({prize_placeholders})
        """, project_uuids)
        
        prize_columns = [desc[0] for desc in cur.description]
        for row in cur.fetchall():
            project_uuid = row[0]
            if project_uuid not in prizes_map:
                prizes_map[project_uuid] = []
            prize_dict = dict(zip(prize_columns, row))
            prizes_map[project_uuid].append({
                "project_uuid": prize_dict["project_uuid"],
                "name": prize_dict["name"],
                "pool_prize": prize_dict["pool_prize"],
                "prize_name": prize_dict["prize_name"],
                "prize_emoji": prize_dict["prize_emoji"],
                "prize_type": prize_dict["prize_type"],
                "sponsor_name": prize_dict["sponsor_name"],
                "sponsor_organization_name": prize_dict["sponsor_organization_name"],
                "sponsor_organization_square_logo_url": prize_dict["sponsor_organization_square_logo_url"]
            })

    cur.close()

    # Build response with full entries and similarity scores
    response = []
    for project in projects:
        project_dict = dict(zip(columns, project))
        uuid = project_dict["uuid"]

        result = {**project_dict, "prizes": prizes_map.get(uuid, [])}

        # Add similarity score from KNN search
        if uuid in scores_map:
            result["similarity_score"] = scores_map[uuid]

        response.append(result)

    # Sort by similarity score (descending) to maintain order
    response.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)

    return response
