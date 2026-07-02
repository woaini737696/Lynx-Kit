"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

/**
 * 聊天详情页 /chat/[userId]
 * - 拉取历史消息：GET {{API_BASE_URL}}/chat/messages?peerId=...
 * - WebSocket：ws://{{API_BASE_URL_WS}}/ws?conversationId=...
 * - 顶部展示 AI 破冰建议：GET {{API_BASE_URL}}/ai/icebreaker?peerId=...
 */
const API_BASE_URL = "{{API_BASE_URL}}";
const API_BASE_URL_WS = API_BASE_URL.replace(/^http/, "ws");

interface Message {
  id: string;
  senderId: string;
  content: string;
  sentiment?: string;
  aiGenerated?: boolean;
}

export default function ChatDetailPage() {
  const params = useParams<{ userId: string }>();
  const peerId = params.userId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // 拉取历史消息 + AI 破冰建议
  useEffect(() => {
    fetch(`${API_BASE_URL}/chat/messages?peerId=${peerId}`)
      .then((r) => r.json())
      .then((data: Message[]) => setMessages(data))
      .catch(() => setMessages([]));

    fetch(`${API_BASE_URL}/ai/icebreaker?peerId=${peerId}`)
      .then((r) => r.json())
      .then((data) => setIcebreakers(data.suggestions ?? []))
      .catch(() => setIcebreakers([]));
  }, [peerId]);

  // 建立 WebSocket
  useEffect(() => {
    const conversationId = `${peerId}`; // 简化：9 层 Agent 会用真实 conversationId
    const ws = new WebSocket(`${API_BASE_URL_WS}/ws?conversationId=${conversationId}`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      const msg: Message = JSON.parse(ev.data);
      setMessages((prev) => [...prev, msg]);
    };
    return () => ws.close();
  }, [peerId]);

  function send() {
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({ type: "text", content: input, peerId })
    );
    setInput("");
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <header className="mb-3 border-b pb-3">
        <h1 className="font-semibold">与 {peerId} 的对话</h1>
      </header>

      {icebreakers.length > 0 && (
        <div className="mb-3 rounded-xl bg-amber-50 p-3 text-sm">
          <p className="mb-2 font-medium text-amber-700">AI 破冰建议</p>
          <div className="flex flex-wrap gap-2">
            {icebreakers.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="rounded-full bg-white px-3 py-1 text-xs text-amber-700 shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {messages.map((m) => {
          const mine = m.senderId !== peerId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 ${mine ? "text-white" : "bg-white"}`}
                style={mine ? { background: "var(--theme)" } : undefined}
              >
                <p>{m.content}</p>
                {m.aiGenerated && <p className="text-xs opacity-70">AI 生成</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2 border-t pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-full border px-4 py-2"
          placeholder="说点什么..."
        />
        <button
          onClick={send}
          className="rounded-full px-4 py-2 text-white"
          style={{ background: "var(--theme)" }}
        >
          发送
        </button>
      </div>
    </main>
  );
}
