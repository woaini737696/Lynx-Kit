#!/bin/bash
# certbot DNS-01 cleanup-hook for miao.lynxdo.com
echo "$(date '+%H:%M:%S') [cleanup-hook] 验证完成，token=$CERTBOT_VALIDATION 可从 DNS 删除" >> /tmp/certbot-miao-hook.log
rm -f /tmp/certbot-miao-token.txt
exit 0
