#!/bin/bash
# certbot DNS-01 auth-hook: 阻塞等待用户手动添加 TXT 记录并传播
# certbot 通过 CERTBOT_VALIDATION 环境变量传入当前 token
TOKEN="$CERTBOT_VALIDATION"
DOMAIN="_acme-challenge.miaox.lynxdo.com"
echo "$TOKEN" > /tmp/certbot-current-token.txt
echo "$(date '+%H:%M:%S') [auth-hook] TOKEN=$TOKEN" >> /tmp/certbot-hook.log
echo "$(date '+%H:%M:%S') [auth-hook] 请在 DNS 添加 TXT 记录: $DOMAIN = $TOKEN" >> /tmp/certbot-hook.log
# 循环检测 DNS 传播（最多 30 分钟，每 10 秒一次）
for i in $(seq 1 180); do
  sleep 10
  RESULTS=$(dig +short TXT $DOMAIN @8.8.8.8 | tr -d '"')
  if echo "$RESULTS" | grep -qxF "$TOKEN"; then
    echo "$(date '+%H:%M:%S') [auth-hook] DNS 已传播 token ($i 次检测后)" >> /tmp/certbot-hook.log
    exit 0
  fi
  echo "$(date '+%H:%M:%S') [auth-hook] 等待 DNS 传播... ($i/180)" >> /tmp/certbot-hook.log
done
echo "$(date '+%H:%M:%S') [auth-hook] DNS 传播超时" >> /tmp/certbot-hook.log
exit 1
