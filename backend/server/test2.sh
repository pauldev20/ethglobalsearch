#!/bin/bash
curl -X POST https://backend-production-1d3e.up.railway.app/search \
  -H "Content-Type: application/json" \
  -d '{"query": "SuiPatent"}'