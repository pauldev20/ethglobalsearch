import contextlib
import uvicorn
import fastapi
import psycopg2
import elasticsearch
import os
from fastapi.middleware.cors import CORSMiddleware

from api import router
from services.scheduler import start_scheduler
from openai import AsyncOpenAI

DB_URL = os.getenv("DB_URL", "postgresql://postgres:password@localhost:5432/search")
ES_URL = os.getenv("ES_URL", "https://elastic:changeme@localhost:9200")

@contextlib.asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    db = psycopg2.connect(DB_URL)
    es = elasticsearch.Elasticsearch(
        ES_URL,
        verify_certs=False,
        ssl_show_warn=False,
    )
    openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    app.state.db = db
    app.state.es = es
    app.state.openai_client = openai_client
    await start_scheduler(db=db, es=es, openai_client=openai_client)
    yield
    db.close()
    es.close()


app = fastapi.FastAPI(lifespan=lifespan)

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
