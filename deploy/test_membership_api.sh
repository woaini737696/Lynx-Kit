#!/bin/bash
# 测试会员体系 API 端点
set -e

API_BASE="http://127.0.0.1:8788/api/v1"
ADMIN_PHONE="13800000001"
ADMIN_PASSWORD="ee9527ff"

echo "===== 1. 公开：获取会员档位 ====="
curl -s "$API_BASE/membership/plans" | head -c 500
echo

echo
echo "===== 2. 管理员登录获取 token ====="
LOGIN_RESP=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$ADMIN_PHONE\",\"password\":\"$ADMIN_PASSWORD\"}")
echo "$LOGIN_RESP" | head -c 400
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
echo
echo "TOKEN: ${TOKEN:0:30}..."

echo
echo "===== 3. 管理后台：会员管理列表 ====="
curl -s "$API_BASE/admin/memberships?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" | head -c 800
echo

echo
echo "===== 4. 用户中心：当前用户会员状态 ====="
curl -s "$API_BASE/membership/me" \
  -H "Authorization: Bearer $TOKEN" | head -c 600
echo

echo
echo "===== 5. 用户中心：S 币流水 ====="
curl -s "$API_BASE/membership/scoin/transactions?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" | head -c 400
echo

# 找一个测试用户 ID（妙想用户 18942271267）
TARGET_USER_ID=$(PGPASSWORD=LynxKit2026Prod psql -h 127.0.0.1 -U lynxkit -d lynxkit -t -c "SELECT id FROM users WHERE phone='18942271267' LIMIT 1" | tr -d ' \n')
echo
echo "目标用户 ID: $TARGET_USER_ID"

echo
echo "===== 6. 管理后台：开通 Lite 会员 1 个月 ====="
curl -s -X POST "$API_BASE/admin/memberships/grant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TARGET_USER_ID\",\"tier\":\"LITE\",\"durationMonths\":1,\"source\":\"MANUAL\",\"note\":\"测试开通\"}" | head -c 500
echo

echo
echo "===== 7. 管理后台：赠送 100 S 币 ====="
curl -s -X POST "$API_BASE/admin/memberships/scoin/adjust" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TARGET_USER_ID\",\"delta\":100,\"note\":\"测试赠送\"}" | head -c 400
echo

echo
echo "===== 8. 管理后台：S 币流水列表 ====="
curl -s "$API_BASE/admin/memberships/scoin/transactions?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" | head -c 600
echo

echo
echo "===== 测试完成 ====="
