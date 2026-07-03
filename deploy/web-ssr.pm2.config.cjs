/**
 * LynxKit Web SSR PM2 配置
 *
 * - fork 模式（非 cluster），兼容 ESM top-level await
 * - 端口 3000，与 lynxkit-api（8788）和 lynx-app（5176）完全隔离
 * - max_memory_restart 400M：超出立即重启，保护 2C2G 服务器
 * - env 注入生产环境变量
 */
module.exports = {
  apps: [
    {
      name: "lynxkit-web",
      cwd: "/opt/lynxkit/web-ssr",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NEXT_PUBLIC_API_URL: "https://miaox.lynxdo.com/api",
        NEXT_PUBLIC_APP_NAME: "妙想",
        NEXT_PUBLIC_WEB_URL: "https://miaox.lynxdo.com",
        NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL:
          "https://miaox.lynxdo.com/lynxkit/LynxKit-Setup-0.1.0-x64.exe",
      },
      error_file: "/opt/lynxkit/logs/web-err.log",
      out_file: "/opt/lynxkit/logs/web-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
