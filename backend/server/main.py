import uvicorn
import fastapi
import psycopg2
import elasticsearch
import os

from api import router
from services.scheduler import start_scheduler

app = fastapi.FastAPI()

app.include_router(router)

DB_URL = os.getenv("DB_URL", "postgresql://postgres:password@localhost:5432/search")
ES_URL = os.getenv("ES_URL", "http://localhost:9200")

@app.on_event("startup")
async def startup_event():
    db = psycopg2.connect(DB_URL)
    es = elasticsearch.Elasticsearch(ES_URL)
    app.state.db = db
    app.state.es = es
    await start_scheduler(db=db, es=es)

if __name__ == "__main__":
    port = os.environ.get("PORT", 8000)
    uvicorn.run(app, host="0.0.0.0", port=port)
