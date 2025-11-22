import asyncio
import elasticsearch
import psycopg2
import json

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ._download import download_projects, download_hackathons
from ._fill_db import fill_db
from ._fill_search import fill_search

scheduler = AsyncIOScheduler()


async def update_projects(db: psycopg2.extensions.connection,
                          es: elasticsearch.Elasticsearch):
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
    count = fill_search(db, es)
    print(f"Successfully loaded {count} projects into Elasticsearch!")


async def start_scheduler(db: psycopg2.extensions.connection, es: elasticsearch.Elasticsearch):
    asyncio.create_task(update_projects(db, es))
    scheduler.add_job(update_projects, "interval", minutes=50, args=[db, es])
    scheduler.start()
