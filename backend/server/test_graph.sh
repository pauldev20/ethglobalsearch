#!/bin/bash
curl -X POST http://localhost:8000/graph \
  -H "Content-Type: application/json" \
  -d '{"query": "Im looking for a project that built something like a facebook clone"}' | jq