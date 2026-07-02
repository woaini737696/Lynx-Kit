import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Button,
} from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isPending } = useAuth();
  const [form, setForm] = React.useState({
    email: "",
    password: "",
    name: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      toast({ title: "请完整填写注册信息", variant: "destructive" });
      return;
    }
    try {
      await register(form);
      navigate("/build");
    } catch (err) {
      toast({
        title: "注册失败",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-lynx-500" />
          注册
        </CardTitle>
        <CardDescription>创建账号，开始构建你的 AI 产品</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">用户名</Label>
            <Input id="name" value={form.name} onChange={set("name")} placeholder="你的昵称" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">邮箱</Label>
            <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">密码</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="至少 6 位"
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3 border-t bg-muted/30 py-3">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-lynx-500 text-white hover:bg-lynx-600"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            注册并登录
          </Button>
          <p className="text-sm text-muted-foreground">
            已有账号？{" "}
            <Link to="/login" className="text-lynx-600 hover:underline">
              登录
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
