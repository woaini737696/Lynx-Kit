#!/usr/bin/env bash
# Test admin API endpoints
set -e

echo "=== 1. Admin login ==="
LOGIN_RESP=$(curl -s -X POST http://127.0.0.1:8788/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800000001","password":"ee9527ff"}')
echo "$LOGIN_RESP" | head -c 200
echo ""
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//;s/"//')
echo "Token acquired: ${TOKEN:0:30}..."
echo ""

echo "=== 2. Admin stats ==="
curl -s http://127.0.0.1:8788/api/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo ""
echo ""

echo "=== 3. Admin users list ==="
curl -s "http://127.0.0.1:8788/api/v1/admin/users?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo ""
echo ""

echo "=== 4. Admin roles ==="
curl -s http://127.0.0.1:8788/api/v1/admin/roles \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo ""
echo ""

echo "=== All tests done ==="
