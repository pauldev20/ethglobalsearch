import contextlib
import uvicorn
import fastapi
import psycopg2
import elasticsearch
import os

from api import router
from services.scheduler import start_scheduler


DB_URL = os.getenv("DB_URL", "postgresql://postgres:password@localhost:5432/search")
ES_URL = os.getenv("ES_URL", "https://localhost:9200")
ES_USERNAME = os.getenv("ES_USERNAME", "elastic")
ES_PASSWORD = os.getenv("ES_PASSWORD", "changeme")


@contextlib.asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    db = psycopg2.connect(DB_URL)
    es = elasticsearch.Elasticsearch(
        ES_URL,
        basic_auth=(ES_USERNAME, ES_PASSWORD),
        verify_certs=False,
        ssl_show_warn=False,
    )
    app.state.db = db
    app.state.es = es
    await start_scheduler(db=db, es=es)
    yield
    db.close()
    es.close()


app = fastapi.FastAPI(lifespan=lifespan)

app.include_router(router)

if __name__ == "__main__":
    port = os.environ.get("PORT", 8000)
    uvicorn.run(app, host="0.0.0.0", port=port)
