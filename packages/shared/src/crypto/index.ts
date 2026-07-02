/**
 * LynxKit 加密抽象层 - v1.0
 *
 * 提供本地 AES-256-GCM 实现（local-kms），可替换为云 KMS（aliyun / aws / tencent）。
 */

export * from "./kms.js";
export * from "./local-kms.js";
