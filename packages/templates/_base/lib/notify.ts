/**
 * 通知发送封装
 * 统一三种渠道：邮件 / 短信 / 站内信
 *
 * 业务方接入时需：
 *   - 邮件：配置 Resend / SendGrid / 阿里云邮件推送
 *   - 短信：配置阿里云短信 / 腾讯云短信
 *   - 站内：写入 notifications 表（见 prisma/base.schema.prisma）
 */

import { prisma } from "./prisma";

export type NotifyChannel = "email" | "sms" | "inApp";

export interface NotifyPayload {
  /** 接收者 user id */
  userId: string;
  /** 邮箱 / 手机号（站内信可缺省） */
  to?: string;
  title: string;
  content: string;
  /** 模板 ID（用于邮件/短信服务商模板） */
  templateId?: string;
  /** 模板变量 */
  variables?: Record<string, string>;
}

export interface NotifyResult {
  channel: NotifyChannel;
  success: boolean;
  message?: string;
  externalId?: string;
}

/**
 * 发送邮件占位
 */
async function sendEmail(payload: NotifyPayload): Promise<NotifyResult> {
  // 占位：业务方接入后调用实际邮件服务商
  void payload;
  return {
    channel: "email",
    success: true,
    message: "邮件已发送（占位）",
  };
}

/**
 * 发送短信占位
 */
async function sendSms(payload: NotifyPayload): Promise<NotifyResult> {
  // 占位：业务方接入后调用实际短信服务商
  void payload;
  return {
    channel: "sms",
    success: true,
    message: "短信已发送（占位）",
  };
}

/**
 * 站内信：写入 notifications 表
 */
async function sendInApp(payload: NotifyPayload): Promise<NotifyResult> {
  try {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.templateId ?? "system",
        title: payload.title,
        content: payload.content,
        read: false,
      },
    });
    return { channel: "inApp", success: true };
  } catch (err) {
    return {
      channel: "inApp",
      success: false,
      message: err instanceof Error ? err.message : "站内信发送失败",
    };
  }
}

/**
 * 统一发送入口
 * @param channels 选择要发送的渠道，缺省为全部
 */
export async function sendNotification(
  payload: NotifyPayload,
  channels: NotifyChannel[] = ["email", "sms", "inApp"],
): Promise<NotifyResult[]> {
  const tasks: Promise<NotifyResult>[] = [];
  if (channels.includes("email") && payload.to) {
    tasks.push(sendEmail(payload));
  }
  if (channels.includes("sms") && payload.to) {
    tasks.push(sendSms(payload));
  }
  if (channels.includes("inApp")) {
    tasks.push(sendInApp(payload));
  }
  return Promise.all(tasks);
}

export const notify = {
  send: sendNotification,
  sendEmail: (payload: NotifyPayload) => sendEmail(payload),
  sendSms: (payload: NotifyPayload) => sendSms(payload),
  sendInApp: (payload: NotifyPayload) => sendInApp(payload),
};
