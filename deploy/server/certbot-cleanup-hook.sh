#!/bin/bash
# certbot DNS-01 cleanup-hook: 验证完成后清理
echo "$(date '+%H:%M:%S') [cleanup-hook] 验证完成，token=$CERTBOT_VALIDATION 可从 DNS 删除" >> /tmp/certbot-hook.log
rm -f /tmp/certbot-current-token.txt
exit 0
