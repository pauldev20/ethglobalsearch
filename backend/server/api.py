from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
import elasticsearch
import asyncio

from services.scheduler import update_projects

router = APIRouter(prefix="")


def get_db(request: Request) -> psycopg2.extensions.connection:
    """Dependency to get database connection from app state"""
    return request.app.state.db

def get_es(request: Request) -> elasticsearch.Elasticsearch:
    """Dependency to get Elasticsearch client from app state"""
    return request.app.state.es

@router.get("/types")
def get_types(db: psycopg2.extensions.connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT DISTINCT type FROM prize")
    types = cur.fetchall()
    event_names = cur.execute("SELECT DISTINCT event_name FROM project")
    event_names = cur.fetchall()
    sponsor_organizations = cur.execute("SELECT DISTINCT sponsor_organization FROM prize")
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

@router.get("/search")
def search(q: SearchQuery,
           db: psycopg2.extensions.connection = Depends(get_db),
           es: elasticsearch.Elasticsearch = Depends(get_es)):
    INDEX = "documents"

    # Build Elasticsearch bool query with all filters
    must_clauses = []
    filter_clauses = []

    # Text search query
    if q.query:
        must_clauses.append({
            "multi_match": {
                "query": q.query,
                "fields": ["name^5", "tagline^2", "description", "how_its_made"],
                "type": "best_fields",
                "operator": "or",
                "fuzziness": "AUTO",
                "minimum_should_match": "75%"
            }
        })

    # Filter by event_name
    if q.event_name:
        filter_clauses.append({
            "terms": {
                "event_name": q.event_name
            }
        })

    # Filter by prize type
    if q.prize_type:
        filter_clauses.append({
            "terms": {
                "type": q.prize_type
            }
        })

    # Filter by sponsor_organization
    if q.sponsor_organization:
        filter_clauses.append({
            "terms": {
                "sponsor_organization": q.sponsor_organization
            }
        })

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

    # Execute Elasticsearch query
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
        size=1000  # Increase size to get all matching results
    )

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
        """,
        es_result_ids
    )
    columns = [desc[0] for desc in cur.description]
    projects = cur.fetchall()

    # Fetch prizes for all matching projects
    project_uuids = [project[0] for project in projects]  # uuid is first column
    prizes_map = {}

    if project_uuids:
        prize_placeholders = ','.join(['%s'] * len(project_uuids))
        cur.execute(
            f"""
            SELECT project_uuid, name, detail, emoji, type, sponsor, sponsor_organization
            FROM prize
            WHERE project_uuid IN ({prize_placeholders})
        """, project_uuids)

        for row in cur.fetchall():
            project_uuid = row[0]
            if project_uuid not in prizes_map:
                prizes_map[project_uuid] = []
            prizes_map[project_uuid].append({
                "name": row[1],
                "detail": row[2],
                "emoji": row[3],
                "type": row[4],
                "sponsor": row[5],
                "sponsor_organization": row[6]
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

    return response

class ChatQuery(BaseModel):
    query: str

@router.get("/chat")
def chat(q: ChatQuery,
         db: psycopg2.extensions.connection = Depends(get_db),
         es: elasticsearch.Elasticsearch = Depends(get_es)):
    return {"message": "Hello, World!"}