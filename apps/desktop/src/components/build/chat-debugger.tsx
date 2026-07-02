"use client";

import * as React from "react";
import { Send, MessageSquare, Loader2, Bot, User } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
} from "@lynxkit/ui-web";
import { toast } from "@lynxkit/ui-web";
import { API_BASE_URL, ApiError } from "@/lib/api";
import { useAuthStore } from "@lynxkit/store";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface ChatDebuggerProps {
  sessionId: string;
  className?: string;
}

/**
 * 对话式调试
 *
 * 在构建产物上用自然语言迭代修改代码：发送消息 → 后端 streamText 流式返回
 * 修改建议 / diff，逐 token 渲染。保留历史记录。
 */
export function ChatDebugger({ sessionId, className }: ChatDebuggerProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const token = useAuthStore.getState().token;

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      streaming: true,
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setSending(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/build/${sessionId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: text }),
        },
      );

      if (!res.ok || !res.body) {
        throw new Error(`请求失败：HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const evt = JSON.parse(data) as {
                type?: string;
                delta?: string;
                content?: string;
              };
              acc += evt.delta ?? evt.content ?? "";
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantMsg.id ? { ...msg, content: acc } : msg,
                ),
              );
            } catch {
              acc += data;
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantMsg.id ? { ...msg, content: acc } : msg,
                ),
              );
            }
          }
        }
      }
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsg.id ? { ...msg, streaming: false } : msg,
        ),
      );
    } catch (e) {
      const msg =
        e instanceof ApiError || e instanceof Error
          ? e.message
          : String(e);
      setMessages((m) =>
        m.map((mm) =>
          mm.id === assistantMsg.id
            ? { ...mm, content: `出错：${msg}`, streaming: false }
            : mm,
        ),
      );
      toast({ title: "对话失败", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-lynx-500" />
          对话式调试
        </CardTitle>
        <CardDescription>
          用自然语言修改产物，例如"把首页主色调改成蓝色"
        </CardDescription>
      </CardHeader>

      <div className="h-[320px] overflow-y-auto px-4" ref={scrollRef}>
        <div className="space-y-4 py-2">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              开始与 Agent 对话，迭代优化你的产品
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-2",
                m.role === "user" && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  m.role === "user"
                    ? "bg-lynx-500/10 text-lynx-600"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {m.role === "user" ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[78%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-lynx-500 text-white"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
                {m.streaming && (
                  <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="输入修改需求..."
          disabled={sending}
        />
        <Button
          onClick={() => void send()}
          disabled={sending || !input.trim()}
          className="bg-lynx-500 text-white hover:bg-lynx-600"
          size="icon"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
}
