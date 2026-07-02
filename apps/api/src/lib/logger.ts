/**
 * Pino 日志单例 - LynxKit API
 *
 * 开发模式启用 pino-pretty 彩色输出；
 * 生产模式输出 JSON 便于 ELK / Loki / Axiom 采集。
 *
 * 全局统一使用此 logger，避免每个模块各自创建 pino 实例。
 */
import pino from "pino";

import { env } from "../env.js";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : isDev ? "debug" : "info",
  base: {
    service: "lynxkit-api",
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export type Logger = typeof logger;
