#!/bin/bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Im looking for a project that built something like a facebook clone"}' | jq