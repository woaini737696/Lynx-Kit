import Link from "next/link";

/**
 * 发现页 /discover
 * - 拉取推荐列表：GET {{API_BASE_URL}}/match/discover
 * - 每个卡片展示匹配分数 + 兴趣标签
 * - 点击 "聊聊看" → 创建 match + 跳转 /chat/[userId]
 */
const API_BASE_URL = "{{API_BASE_URL}}";

interface Recommend {
  userId: string;
  nickname: string;
  avatar: string;
  bio: string;
  score: number;
  interests: string[];
}

async function getRecommends(): Promise<Recommend[]> {
  // 9 层 Agent 接入真实 session 后启用真实 fetch：
  // const res = await fetch(`${API_BASE_URL}/match/discover`, { cache: "no-store" });
  // return res.json();
  return [];
}

export default async function DiscoverPage() {
  const recommends = await getRecommends();

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">发现</h1>
      {recommends.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-gray-500">
          暂时没有推荐用户。完善资料、添加兴趣可获得更精准的匹配。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recommends.map((r) => (
            <article key={r.userId} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                  {r.avatar && <img src={r.avatar} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.nickname}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs text-white"
                      style={{ background: "var(--theme)" }}
                    >
                      匹配 {r.score}
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-500">{r.bio}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.interests.map((i) => (
                  <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {i}
                  </span>
                ))}
              </div>
              <Link
                href={`/chat/${r.userId}`}
                className="mt-3 block rounded-lg py-2 text-center text-white"
                style={{ background: "var(--theme)" }}
              >
                聊聊看
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
