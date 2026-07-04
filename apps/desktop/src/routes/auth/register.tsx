import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, UserPlus, X } from "lucide-react";
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
  const { t } = useTranslation();
  const { register, isPending } = useAuth();
  const [form, setForm] = React.useState({
    email: "",
    password: "",
    name: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      toast({ title: t("auth.fillAllFields"), variant: "destructive" });
      return;
    }
    try {
      await register(form);
      navigate("/build", { replace: true });
    } catch (err) {
      toast({
        title: t("auth.registerFailed"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-xl">
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
            <UserPlus className="h-5 w-5 text-lynx-500" />
            {t("auth.registerTitle")}
          </CardTitle>
          <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">{t("auth.name")}</Label>
              <Input id="name" value={form.name} onChange={set("name")} placeholder={t("auth.namePlaceholder")} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">{t("auth.email")}</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder={t("auth.emailPlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder={t("auth.passwordMinHint")}
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
              {t("auth.registerAndLogin")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link to="/login" className="text-lynx-600 hover:underline">
                {t("nav.login")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
