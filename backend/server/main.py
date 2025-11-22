import uvicorn
from fastapi import FastAPI
import psycopg2
from elasticsearch import Elasticsearch
import os
from api import router
from services.scheduler import start_scheduler

app = FastAPI()

app.include_router(router)

DB_URL = os.getenv("DB_URL", "postgresql://postgres:password@localhost:5432/search")
ES_URL = os.getenv("ES_URL", "http://localhost:9200")

@app.on_event("startup")
async def startup_event():
    db = psycopg2.connect(DB_URL)
    es = Elasticsearch(ES_URL)
    # Store in app state for dependency injection
    app.state.db = db
    app.state.es = es
    await start_scheduler(db=db, es=es)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
