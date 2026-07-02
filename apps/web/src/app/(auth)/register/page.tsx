"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button, Input, Label, Separator } from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [agree, setAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) {
      toast({
        title: "请先同意用户协议",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        email,
        password,
        name: name || email.split("@")[0],
      });
      login(res.accessToken, res.user);
      toast({
        title: "注册成功",
        description: "欢迎加入 LynxKit，开始你的造物之旅",
      });
      router.push("/store");
    } catch (err) {
      toast({
        title: "注册失败",
        description: err instanceof Error ? err.message : "请检查输入",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="lg:hidden mb-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lynx-500 to-lynx-600">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <span className="text-lg font-bold tracking-tight">LynxKit</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">创建 LynxKit 账号</h1>
      <p className="mt-1 text-sm text-muted-foreground">加入超级个体的行列</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">昵称（可选）</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的昵称"
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">邮箱</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 8 位"
              className="pl-10"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-lynx-500"
          />
          <span>
            我已阅读并同意
            <Link href="/terms" className="text-lynx-600 hover:underline dark:text-lynx-400">
              《用户协议》
            </Link>
            与
            <Link href="/privacy" className="text-lynx-600 hover:underline dark:text-lynx-400">
              《隐私政策》
            </Link>
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-lynx-500 text-white hover:bg-lynx-600"
        >
          {loading ? "注册中…" : "注册"}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">或</span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" disabled>
          GitHub
        </Button>
        <Button variant="outline" disabled>
          微信
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link
          href="/login"
          className="font-medium text-lynx-600 hover:text-lynx-500 dark:text-lynx-400"
        >
          立即登录
        </Link>
      </p>
    </div>
  );
}
