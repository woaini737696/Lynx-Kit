import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, LogIn, X } from "lucide-react";
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
  const location = useLocation();
  const { t } = useTranslation();
  const { login, isPending } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // 从 location.state 拿到登录前试图访问的路径，登录成功后回到该路径
  const from = (location.state as { from?: string } | null)?.from ?? "/build";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: t("auth.fillEmailAndPassword"), variant: "destructive" });
      return;
    }
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: t("auth.loginFailed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-xl">
      {/* 关闭按钮：返回首页 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => navigate("/", { replace: true })}
        className="absolute right-4 top-4 h-9 w-9 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label={t("common.close")}
        title={t("common.close")}
      >
        <X className="h-4 w-4" />
      </Button>

      <Card className="w-full max-w-sm shadow-2xl border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-lynx-500" />
            {t("auth.loginTitle")}
          </CardTitle>
          <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
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
              {t("auth.loginButton")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-lynx-600 hover:underline">
                {t("auth.registerTitle")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
