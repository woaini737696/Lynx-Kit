import * as React from "react";
import { User, Mail, Phone, Save, Loader2 } from "lucide-react";
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
  Avatar,
  AvatarFallback,
  toast,
} from "@lynxkit/ui-web";
import { useAuthStore } from "@lynxkit/store";
import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";

export default function ProfilePage() {
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
      toast({ title: "没有需要更新的字段", variant: "default" });
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
      toast({ title: "资料已更新", variant: "success" });
    } catch (e) {
      toast({
        title: "保存失败",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">个人资料</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
          <CardDescription>更新你的账号信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-lynx-500/10 text-lg text-lynx-600">
                {((name || user?.email) ?? "U")[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{name || "未设置"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              用户名
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="用户名" />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              邮箱
            </Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted/30" />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              手机号
            </Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11 位手机号" />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t bg-muted/30 py-3">
          <Button onClick={() => void save()} disabled={saving} className="bg-lynx-500 text-white hover:bg-lynx-600">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "保存中..." : "保存"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
