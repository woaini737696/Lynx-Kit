import * as React from "react";
import { useTranslation } from "react-i18next";
import { User, Mail, Phone, Save, Loader2 } from "lucide-react";
import {
  Input,
  Label,
  Avatar,
  AvatarFallback,
  toast,
} from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateProfile: updateLocalProfile } = useAuthStore();
  const { fetchMe } = useAuth();
  const [name, setName] = React.useState(user?.name ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void fetchMe().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  const save = async () => {
    // 只提交变更字段，避免空值覆盖
    const patch: { name?: string; phone?: string } = {};
    if (name.trim() && name !== user?.name) patch.name = name.trim();
    if (phone !== user?.phone) patch.phone = phone || undefined;

    if (Object.keys(patch).length === 0) {
      toast({ title: t("profile.noUpdates"), variant: "default" });
      return;
    }

    setSaving(true);
    try {
      const updated = await authApi.updateProfile(patch);
      // 同步更新本地 store（保持 token 不变）
      updateLocalProfile({
        name: updated.name,
        phone: updated.phone,
        avatar: updated.avatar,
      });
      toast({ title: t("profile.updated"), variant: "success" });
    } catch (e) {
      toast({
        title: t("profile.saveFailed"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-950 dark:text-ink-0">{t("settings.profile")}</h1>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-ink-200/60 px-6 py-4 dark:border-ink-800/60">
          <h2 className="text-base font-semibold text-ink-950 dark:text-ink-0">{t("profile.basicInfo")}</h2>
          <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{t("profile.updateAccount")}</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-ink-950 text-lg text-ink-0 dark:bg-ink-100 dark:text-ink-950">
                {((name || user?.email) ?? "U")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-ink-950 dark:text-ink-0">{name || t("profile.notSet")}</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-ink-300">
              <User className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
              {t("profile.username")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profile.usernamePlaceholder")}
              className="input-glass border-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-ink-300">
              <Mail className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
              {t("auth.email")}
            </Label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="input-glass border-0 bg-ink-100/60 shadow-none focus-visible:ring-0 dark:bg-ink-900/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-ink-700 dark:text-ink-300">
              <Phone className="h-3.5 w-3.5 text-ink-500 dark:text-ink-400" />
              {t("auth.phone")}
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("profile.phonePlaceholder")}
              className="input-glass border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="flex justify-end border-t border-ink-200/60 bg-ink-50/50 px-6 py-3 dark:border-ink-800/60 dark:bg-ink-900/40">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="btn-ink inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? t("profile.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
