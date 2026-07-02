import { redirect } from "next/navigation";

/**
 * 首页（根 /）
 * - 未登录 → /login
 * - 已登录 → /discover
 *
 * 9 层 Agent 会接入真实 session；此处用 cookie 占位。
 */
export default function HomePage() {
  const session = typeof window !== "undefined" ? document.cookie : "";
  if (!session.includes("lynx_session=")) {
    redirect("/login");
  }
  redirect("/discover");
}
