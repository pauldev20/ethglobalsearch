import httpx

GRAPHQL_URL = open("services/download.gql", "r").read()
GRAPHQL_URL_EVENTS = open("services/download_hackathons.gql", "r").read()

AMOUNT = 500

async def download_hackathons() -> list[dict]:
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post("https://api.ethglobal.com/graphql",
                                json={
                                    "operationName": "getPublishedHackathons",
                                    "query": GRAPHQL_URL_EVENTS
                                })
        try:
            return res.json()["data"]["getPublishedHackathons"]
        except:
            print("Status code:", res.status_code)
            print("Response body:", res.text)
            raise Exception("Error downloading hackathons")

async def download_projects(event) -> list[dict]:
    all = []
    skip = 0
    while True:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                data = {
                    "operationName": "GetPaginatedSubmittedProjects",
                    "variables": {
                        "pagination": {
                            "skip": skip,
                            "take": AMOUNT
                        },
                        "filters": {
                            "events": [event]
                        }
                    },
                    "query": GRAPHQL_URL
                }
                res = await client.post("https://api.ethglobal.com/graphql",
                                        json=data)
                try:
                    if len(res.json()["data"]["getPaginatedSubmittedProjects"]
                           ["items"]) < AMOUNT:
                        pass
                except:
                    print("Status code:", res.status_code)
                    print("Response body:", res.text)
                    raise Exception("Error downloading projects")

        except:
            continue

        skip += AMOUNT
        all.extend(
            res.json()["data"]["getPaginatedSubmittedProjects"]["items"])
        if len(res.json()["data"]["getPaginatedSubmittedProjects"]
                           ["items"]) < AMOUNT:
            break

    return all
