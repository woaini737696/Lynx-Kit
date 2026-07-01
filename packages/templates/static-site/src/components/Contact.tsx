import * as React from "react";

import { config } from "@/config";

import { Button } from "@/_base/components/ui/Button";
import { Input } from "@/_base/components/ui/Input";
import { useToast } from "@/_base/components/ui/Toast";

/**
 * 联系区块
 * 展示联系方式 + 联系表单
 */
export function Contact() {
  const { show } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!name || !email || !message) {
      setError("请填写姓名、邮箱和留言");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("邮箱格式不正确");
      return;
    }
    setLoading(true);
    try {
      // 占位：业务方接入后调用实际接口
      await new Promise((resolve) => setTimeout(resolve, 800));
      show({
        variant: "success",
        title: "已收到",
        description: "我们会尽快回复你的留言。",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className="bg-gray-50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            联系我们
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            有项目想聊？留下你的信息，我们会尽快联系你。
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            {config.contact.phone && (
              <a
                href={`tel:${config.contact.phone}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300"
              >
                <span className="text-2xl">📞</span>
                <div>
                  <div className="text-xs text-gray-500">电话</div>
                  <div className="font-medium text-gray-900">
                    {config.contact.phone}
                  </div>
                </div>
              </a>
            )}
            {config.contact.email && (
              <a
                href={`mailto:${config.contact.email}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300"
              >
                <span className="text-2xl">✉️</span>
                <div>
                  <div className="text-xs text-gray-500">邮箱</div>
                  <div className="font-medium text-gray-900">
                    {config.contact.email}
                  </div>
                </div>
              </a>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6"
          >
            <Input
              label="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              label="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                留言
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="简单描述你的需求..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading}>
              发送留言
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
