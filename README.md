# ETHSearch

short stuff

## Description

## Technical
The system downloads project and price data from EthGlobal into Postgres, then indexes it in Elasticsearch. The LLM generates embeddings for the indexed data, which Elasticsearch stores.

For user searches, the LLM embeds the query, Elasticsearch finds similar items, and 0G compute processes and ranks the results. Regular searches and graph data use standard Elasticsearch, while Postgres provides structured details such as links and related project information.

```mermaid
sequenceDiagram
    participant EthGlobal
    participant Postgres
    participant Elasticsearch
    participant LLM
    participant User

    Note over EthGlobal,LLM: Data Ingestion Phase
    EthGlobal->>Postgres: Download project and price data
    Postgres->>Elasticsearch: Create index from data
    Elasticsearch->>LLM: Request embeddings for indexed data
    LLM-->>Elasticsearch: Return embeddings
    Elasticsearch->>Elasticsearch: Store embeddings in index

    Note over Elasticsearch,User: User Request Phase
    User->>LLM: Make search request
    LLM->>LLM: Create embeddings from user query
    LLM->>Elasticsearch: Search with query embeddings
    Elasticsearch-->>LLM: Return matching results
    LLM->>LLM: Process and rank results
    LLM-->>User: Return final results
```