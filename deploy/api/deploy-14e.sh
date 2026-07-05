#!/bin/bash
# 迭代 14E 部署脚本：DB 索引迁移完成 + admin.ts 拆分 + Redis 缓存 + 集群 + Prometheus + 仪表盘
set -e

# 1. 切换新 API bundle
echo "===== 切换 API bundle ====="
cd /opt/lynxkit/api
mv dist/index.js dist/index.js.prev 2>/dev/null || true
mv dist/build-worker.js dist/build-worker.js.prev 2>/dev/null || true
mv dist_temp/index.js dist/index.js
mv dist_temp/build-worker.js dist/build-worker.js
rm -rf dist_temp
echo "✓ 新 bundle 已就位"

# 2. 添加 PROMETHEUS_ENABLED 到 .env（若不存在）
echo "===== 检查环境变量 ====="
if ! grep -q "^PROMETHEUS_ENABLED=" /opt/lynxkit/api/.env; then
  echo "PROMETHEUS_ENABLED=true" >> /opt/lynxkit/api/.env
  echo "✓ 已添加 PROMETHEUS_ENABLED=true 到 .env"
else
  echo "✓ PROMETHEUS_ENABLED 已配置"
fi

# 3. 解压 admin 静态文件
echo "===== 更新 admin 静态文件 ====="
cd /opt/lynxkit/admin
rm -rf _next.new out.new 2>/dev/null || true
unzip -q /tmp/admin-static.zip -d /opt/lynxkit/admin/out.new
# 备份旧目录、切换新目录
mv _next _next.prev 2>/dev/null || true
mv out out.prev 2>/dev/null || true
mv out.new/_next _next 2>/dev/null || true
mv out.new/index.html out 2>/dev/null || true
# 复制其他静态文件
cp -r out.new/* . 2>/dev/null || true
rm -rf out.new out.prev _next.prev
echo "✓ admin 静态文件已更新"

# 4. 重启 API（先停再启动以应用新的 ecosystem.config.cjs）
echo "===== 重启 API 服务 ====="
cd /opt/lynxkit/api
pm2 delete lynxkit-api 2>/dev/null || true
pm2 delete lynxkit-worker 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
echo "✓ API 服务已重启（集群模式）"

# 5. 等待启动完成
sleep 3
echo "===== PM2 进程状态 ====="
pm2 list

# 6. 验证
echo "===== 验证端点 ====="
sleep 2
echo "[1] /health"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8788/health

echo "[2] /metrics"
curl -s http://localhost:8788/metrics | head -20

echo "[3] /api/v1/store（公开接口）"
curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://localhost:8788/api/v1/store"

echo "===== 部署完成 ====="
