// PM2 配置 - LynxKit API 服务
// 隔离：进程名 lynxkit-api，与 lynx-app（lynx 项目）完全独立
module.exports = {
  apps: [
    {
      name: 'lynxkit-api',
      script: './dist/index.js',
      cwd: '/opt/lynxkit/api',
      node_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '512M',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/opt/lynxkit/logs/api-error.log',
      out_file: '/opt/lynxkit/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
    },
  ],
};
