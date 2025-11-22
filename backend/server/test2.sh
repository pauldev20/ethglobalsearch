#!/bin/bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"prize_type": ["finalist"], "query": "synth"}' | jq