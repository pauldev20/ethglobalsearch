from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
import psycopg2
import elasticsearch
import asyncio

from services.scheduler import update_projects

router = APIRouter(prefix="")

class SearchQuery(BaseModel):
    query: str
    index: str = "documents"

def get_db(request: Request) -> psycopg2.extensions.connection:
    """Dependency to get database connection from app state"""
    return request.app.state.db

def get_es(request: Request) -> elasticsearch.Elasticsearch:
    """Dependency to get Elasticsearch client from app state"""
    return request.app.state.es

@router.post("/search")
def search(q: SearchQuery, es: elasticsearch.Elasticsearch = Depends(get_es)):
    res = es.search(
        index=q.index,
        query={
            "multi_match": {
                "query": q.query,
                "fields": ["name^3", "tagline", "description", "how_its_made"]
            }
        },
        highlight={
            "fields": {
                "name": {},
                "tagline": {},
                "description": {},
                "how_its_made": {}
            }
        },
        size=10)
    response = []
    for hit in res["hits"]["hits"]:
        response.append({
            "id": hit["_id"],
            "score": hit["_score"],
            "highlights": hit["highlight"],
        })
    return response