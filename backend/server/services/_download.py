import httpx

GRAPHQL_URL = open("services/download_query.gql", "r").read()


async def download_projects() -> list[dict]:
    async with httpx.AsyncClient() as client:
        all = []
        skip = 0
        while True:
            data = {
                "operationName": "GetPaginatedSubmittedProjects",
                "variables": {
                    "pagination": {
                        "skip": skip,
                        "take": skip + 100
                    },
                    "filters": {
                        # "events": []
                    }
                },
                "query": GRAPHQL_URL
            }
            res = await client.post("https://api.ethglobal.com/graphql",
                                    json=data)
            try:
                if len(res.json()["data"]["getPaginatedSubmittedProjects"]
                       ["items"]) < 100:
                    break
            except:
                print(res.json())
                break
            skip += 1000
            all.extend(
                res.json()["data"]["getPaginatedSubmittedProjects"]["items"])
            break
        return all
