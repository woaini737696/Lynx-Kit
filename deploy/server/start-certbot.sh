#!/bin/bash
# 启动 certbot DNS-01 申请 miaox.lynxdo.com 证书（后台运行，hook 阻塞等待 DNS）
# 先清理旧状态
rm -f /tmp/certbot-hook.log /tmp/certbot-current-token.txt /tmp/certbot-run.log

# 后台运行 certbot
nohup certbot certonly \
  --manual \
  --non-interactive \
  --preferred-challenges dns \
  --manual-auth-hook /opt/certbot-auth-hook.sh \
  --manual-cleanup-hook /opt/certbot-cleanup-hook.sh \
  -d miaox.lynxdo.com \
  --agree-tos \
  -m admin@lynxdo.com \
  --no-eff-email \
  > /tmp/certbot-run.log 2>&1 &

CERTBOT_PID=$!
echo "certbot PID=$CERTBOT_PID"
echo $CERTBOT_PID > /tmp/certbot.pid

# 等待 hook 写入 token
sleep 10
echo "---token file---"
cat /tmp/certbot-current-token.txt 2>/dev/null || echo "no token yet"
echo "---hook log---"
cat /tmp/certbot-hook.log 2>/dev/null || echo "no hook log yet"
echo "---certbot log---"
cat /tmp/certbot-run.log 2>/dev/null || echo "no certbot log yet"
