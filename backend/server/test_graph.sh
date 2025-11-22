#!/bin/bash
curl -X POST http://localhost:8000/graph?threshold=0.78 \
  -H "Content-Type: application/json" \
  -d '{"query": ""}' | jq