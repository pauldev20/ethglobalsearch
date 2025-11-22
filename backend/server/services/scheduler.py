import asyncio
import elasticsearch
import psycopg2
import json
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from openai import AsyncOpenAI
from ._download import download_projects, download_hackathons
from ._fill_db import fill_db
from ._fill_search import fill_search
from ._fill_similarity import fill_similarity

scheduler = AsyncIOScheduler()


async def update_projects(db: psycopg2.extensions.connection,
                          es: elasticsearch.Elasticsearch,
                          openai_client: AsyncOpenAI):
    hackathons = await download_hackathons()
    additional = ["trifecta-tee", "trifecta-zk", "trifecta-agents"]
    hackathons.extend([{"slug": h} for h in additional])
    for h in hackathons:
        print(h)
        projects = await download_projects(h["slug"])
        print(f"Downloaded {len(projects)} projects for hackathon {h['slug']}")
        if len(projects) > 0:
            count = fill_db(db, projects)
            print(f"Successfully loaded {count} projects into the database!")
    print("Filling search")
    count = await fill_search(db, es, openai_client)
    print(f"Successfully loaded {count} projects into Elasticsearch!")
    print("Filling similarity")
    similarity_count = await fill_similarity(db, es)
    print(f"Successfully loaded {similarity_count} similarities into the database!")


async def start_scheduler(db: psycopg2.extensions.connection,
                          es: elasticsearch.Elasticsearch,
                          openai_client: AsyncOpenAI):
    if os.getenv("NO_UPDATE", "false") == "true":
        return
    asyncio.create_task(update_projects(db, es, openai_client))
    scheduler.add_job(update_projects,
                      "interval",
                      minutes=50,
                      args=[db, es, openai_client])
    scheduler.start()
