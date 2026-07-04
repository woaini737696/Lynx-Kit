/**
 * 认证 API
 *
 * 封装登录 / 注册 / 当前用户 / 验证码 / 登出等接口。
 * 输入校验 schema（loginSchema / loginByCodeSchema / registerSchema）来自 @lynxkit/shared。
 *
 * 登录方式：
 *   - 手机号 + 密码   login(phone, password)
 *   - 手机号 + 验证码  loginByCode(phone, code)
 */
import type { ApiClient } from "./client";
import type { User } from "@lynxkit/shared";
import { loginSchema, loginByCodeSchema, registerSchema } from "@lynxkit/shared";
import type { LoginResponse, SendCodeResult, LogoutResult } from "./types";

/** 发送验证码场景 */
export type SendCodeScene = "register" | "login" | "reset";

export class AuthApi {
  constructor(private readonly client: ApiClient) {}

  /** 手机号 + 密码 登录 */
  async login(phone: string, password: string): Promise<LoginResponse> {
    const input = loginSchema.parse({ phone, password });
    return this.client.post<LoginResponse>("/v1/auth/login", input);
  }

  /** 手机号 + 验证码 登录 */
  async loginByCode(phone: string, code: string): Promise<LoginResponse> {
    const input = loginByCodeSchema.parse({ phone, code });
    return this.client.post<LoginResponse>("/v1/auth/login-by-code", input);
  }

  /** 手机号 + 验证码 注册 */
  async register(input: {
    phone: string;
    code: string;
    password: string;
    name: string;
  }): Promise<LoginResponse> {
    const parsed = registerSchema.parse(input);
    return this.client.post<LoginResponse>("/v1/auth/register", parsed);
  }

  /** 获取当前登录用户 */
  async me(): Promise<User> {
    return this.client.get<User>("/v1/auth/me");
  }

  /** 更新当前用户资料（name / phone / avatar / email） */
  async updateProfile(input: {
    name?: string;
    phone?: string;
    avatar?: string;
    email?: string;
  }): Promise<User> {
    const data = await this.client.put<{ user: User }>("/v1/auth/me", input);
    return data.user;
  }

  /** 发送手机验证码 */
  async sendCode(phone: string, scene: SendCodeScene): Promise<SendCodeResult> {
    return this.client.post<SendCodeResult>("/v1/auth/send-code", {
      phone,
      scene,
    });
  }

  /** 登出 */
  async logout(): Promise<LogoutResult> {
    return this.client.post<LogoutResult>("/v1/auth/logout");
  }
}
