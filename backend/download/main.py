import requests
import json

session = requests.Session()

query = """query GetPaginatedSubmittedProjects($filters: ProjectFilters!, $pagination: Pagination!) {
  getPaginatedSubmittedProjects(filters: $filters, pagination: $pagination) {
    skip
    items {
      uuid
      slug
      name
      tagline
      description
      howItsMade
      sourceCodeUrl
      event {
        id
        name
      }
      logo {
        file {
          path
          fullUrl
        }
      }
      banner {
        file {
          path
          fullUrl
        }
      }
      prizes {
        name
        prize {
            name
            emoji
            type
            sponsor {
                name
                organization {
                    name
                }
            }
        }
      }
      meta
    }
  }
}"""

all = []
skip = 0
while True:
    print(skip)
    data = {
        "operationName": "GetPaginatedSubmittedProjects",
        "variables": {
            "pagination": {
                "skip": skip,
                "take": skip + 1000
            },
            "filters": {
                # "events": []
            }
        },
        "query": query
    }
    res = session.post("https://api.ethglobal.com/graphql", json=data)
    try:
        if len(res.json()["data"]["getPaginatedSubmittedProjects"]["items"]) < 100:
            break
    except:
        break
    skip += 1000
    all.extend(res.json()["data"]["getPaginatedSubmittedProjects"]["items"])
    break
    print(all)

with open("projects.json", "w") as f:
    f.write(json.dumps(all))