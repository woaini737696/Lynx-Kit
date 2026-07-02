import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
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

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isPending } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "请填写邮箱和密码", variant: "destructive" });
      return;
    }
    try {
      await login({ email, password });
      navigate("/build");
    } catch (err) {
      toast({
        title: "登录失败",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-lynx-500" />
          登录
        </CardTitle>
        <CardDescription>登录后开始构建你的 AI 产品</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
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
              <LogIn className="mr-2 h-4 w-4" />
            )}
            登录
          </Button>
          <p className="text-sm text-muted-foreground">
            还没有账号？{" "}
            <Link to="/register" className="text-lynx-600 hover:underline">
              注册
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
