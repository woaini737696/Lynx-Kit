/**
 * LynxKit 加密抽象层
 *
 * Week 1 提供本地 AES-256-GCM 实现。
 * 生产环境可替换为云 KMS（阿里云 KMS / AWS KMS）实现。
 */

export * from "./kms.js";
export * from "./local-kms.js";
