import asyncio
from typing import List, Tuple

import psycopg2
from elasticsearch import AsyncElasticsearch


async def fetch_embedding(es: AsyncElasticsearch, index: str, uuid_1: str):
    try:
        doc = es.get(index=index, id=uuid_1)
    except Exception:
        return None
    return doc["_source"].get("raw_embedding")


async def knn_search(es: AsyncElasticsearch, index: str, embedding):
    return es.search(
        index=index,
        knn={
            "field": "embedding",
            "query_vector": embedding,
            "k": 30,
            "num_candidates": 100,
        },
        size=30,
    )


async def process_one(uuid_1: str, es: AsyncElasticsearch, index: str,
                      threshold: float):
    embedding = await fetch_embedding(es, index, uuid_1)
    if not embedding:
        return uuid_1, []

    res = await knn_search(es, index, embedding)

    matches = []
    for hit in res["hits"]["hits"]:
        uuid_2 = hit["_id"]
        score = hit["_score"]

        if uuid_1 >= uuid_2:
            continue
        if score < threshold:
            continue

        matches.append((uuid_1, uuid_2, score))

    return uuid_1, matches


async def fill_similarity(
        db_connection: psycopg2.extensions.connection,
        es: AsyncElasticsearch,
        threshold: float = 0.3,  # lowered threshold
        batch_size: int = 50  # concurrency level
):

    cur = db_connection.cursor()
    INDEX = "documents"

    # sync DB fetch wrapped in async
    projects = await asyncio.to_thread(lambda: (cur.execute(
        "SELECT uuid FROM project ORDER BY uuid"), cur.fetchall())[1])

    uuids = [row[0] for row in projects]
    total_inserted = 0

    # semaphore to limit ES pressure
    sem = asyncio.Semaphore(10)

    async def process_with_limit(uuid_1):
        async with sem:
            return await process_one(uuid_1, es, INDEX, threshold)

    for start in range(0, len(uuids), batch_size):
        batch = uuids[start:start + batch_size]

        # run ES work concurrently
        results = await asyncio.gather(*(process_with_limit(uuid_1)
                                         for uuid_1 in batch))

        # sync DB writes in a background thread
        def write_to_db():
            nonlocal total_inserted
            for _, matches in results:
                for uuid_1, uuid_2, score in matches:
                    cur.execute(
                        """
                        INSERT INTO similarity (uuid_1, uuid_2, similarity_score)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (uuid_1, uuid_2)
                        DO UPDATE SET similarity_score = EXCLUDED.similarity_score
                    """, (uuid_1, uuid_2, score))
                    total_inserted += 1
            db_connection.commit()

        await asyncio.to_thread(write_to_db)

        print(
            f"Processed {start + len(batch)}/{len(uuids)} projects - stored {total_inserted}"
        )

    cur.close()
    return total_inserted
