from fastapi import FastAPI
from pydantic import BaseModel
from elasticsearch import Elasticsearch

app = FastAPI()
es = Elasticsearch("http://localhost:9200")

class SearchQuery(BaseModel):
    query: str
    index: str = "documents"

@app.post("/search")
def search(q: SearchQuery):
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
        size=10
    )
    response = []
    for hit in res["hits"]["hits"]:
        response.append({
            "id": hit["_id"],
            "score": hit["_score"],
            "highlights": hit["highlight"],
        })
    return response

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)