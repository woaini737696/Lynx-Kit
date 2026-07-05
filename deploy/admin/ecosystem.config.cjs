/**
 * 妙想运营后台 PM2 配置
 *
 * - standalone 模式运行 Next.js server
 * - 端口 3001，与 lynxkit-api（8788）和 lynxkit-web（3000）隔离
 * - max_memory_restart 400M：保护 2C2G 服务器
 */
module.exports = {
  apps: [
    {
      name: "lynxkit-admin",
      cwd: "/opt/lynxkit/admin/apps/admin",
      script: "server.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        NEXT_PUBLIC_API_URL: "https://miaox.lynxdo.com/api",
        NEXT_PUBLIC_ADMIN_NAME: "妙想运营后台",
        HOSTNAME: "0.0.0.0",
      },
      error_file: "/opt/lynxkit/logs/admin-err.log",
      out_file: "/opt/lynxkit/logs/admin-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
