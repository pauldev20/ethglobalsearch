#!/bin/bash
curl -X GET http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the prize types?"}' | jq