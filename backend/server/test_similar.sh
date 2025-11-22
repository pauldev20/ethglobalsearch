#!/bin/bash
curl -X GET http://localhost:8000/similar?uuid=0rfjp \
  -H "Content-Type: application/json" | jq