import Link from "next/link";

/**
 * 聊天列表页 /chat
 * - 调用 GET {{API_BASE_URL}}/chat/conversations
 * - 9 层 Agent 会接入真实会话数据与未读数
 */
const API_BASE_URL = "{{API_BASE_URL}}";

interface Conversation {
  id: string;
  peerId: string;
  peerNickname: string;
  peerAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

async function getConversations(): Promise<Conversation[]> {
  // 模板默认返回空列表；9 层 Agent 接入真实 session 后替换为真实 fetch
  // const res = await fetch(`${API_BASE_URL}/chat/conversations`, { cache: "no-store" });
  // return res.json();
  return [];
}

export default async function ChatListPage() {
  const conversations = await getConversations();

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">消息</h1>
      {conversations.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
          还没有消息，去 <Link href="/discover" className="underline" style={{ color: "var(--theme)" }}>发现</Link> 找人聊聊天吧
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.peerId}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                  {c.peerAvatar && <img src={c.peerAvatar} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{c.peerNickname}</span>
                    <span className="text-xs text-gray-400">{c.lastMessageAt}</span>
                  </div>
                  <p className="truncate text-sm text-gray-500">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ background: "var(--theme)" }}
                  >
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
