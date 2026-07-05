// PM2 配置 - LynxKit API 服务
// 隔离：进程名 lynxkit-api / lynxkit-worker，与 lynx-app（lynx 项目）完全独立
//
// 集群模式说明（迭代 14E）：
//   - lynxkit-api：exec_mode='cluster'，instances='max'，充分利用多核 CPU
//     注意：SSE 长连接在 cluster 模式下需 PM2 平滑重启（reload），避免连接断开
//   - lynxkit-worker：exec_mode='fork'，单实例，避免 BullMQ 队列重复消费
//     Worker 仅消费 BullMQ 队列，无 HTTP 服务，无需多实例
module.exports = {
  apps: [
    {
      name: 'lynxkit-api',
      script: './dist/index.js',
      cwd: '/opt/lynxkit/api',
      // 注意：node_args --env-file=.env 在 cluster 模式下不生效
      // 已在 index.ts 顶部通过 process.loadEnvFile('.env') 加载
      // 集群模式：N 个 worker 进程 = CPU 核心数
      exec_mode: 'cluster',
      instances: 'max',
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '512M',
      watch: false,
      // 平滑重启：使用 reload 而非 restart，等待旧连接处理完
      kill_timeout: 8000,
      // 集群模式下监听同一端口，PM2 自动负载均衡
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/opt/lynxkit/logs/api-error.log',
      out_file: '/opt/lynxkit/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      // 构建任务 Worker：BullMQ 队列消费者，必须 fork 模式单实例
      // 避免集群模式下多实例重复消费同一任务
      name: 'lynxkit-worker',
      script: './dist/build-worker.js',
      cwd: '/opt/lynxkit/api',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '1G',
      watch: false,
      env: {
        NODE_ENV: 'production',
        WORKER_PROCESS: 'true',
      },
      error_file: '/opt/lynxkit/logs/worker-error.log',
      out_file: '/opt/lynxkit/logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 30000, // Worker 需更长优雅停机时间，等待当前任务完成
    },
  ],
};
