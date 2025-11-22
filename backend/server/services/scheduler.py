import asyncio
import elasticsearch
import psycopg2

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ._download import download_projects
from ._fill_db import fill_db
from ._fill_search import fill_search

scheduler = AsyncIOScheduler()


async def update_projects(db: psycopg2.extensions.connection,
                          es: elasticsearch.Elasticsearch):
    projects = await download_projects()
    print(f"Downloaded {len(projects)} projects")
    count = fill_db(db, projects)
    print(f"Successfully loaded {count} projects into the database!")
    count = fill_search(db, es)
    print(f"Successfully loaded {count} projects into Elasticsearch!")

async def start_scheduler(db: psycopg2.extensions.connection, es: elasticsearch.Elasticsearch):
    asyncio.create_task(update_projects(db, es))
    scheduler.add_job(update_projects, "interval", minutes=60, args=[db, es])
    scheduler.start()
