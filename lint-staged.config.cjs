/**
 * lint-staged 配置
 *
 * 对暂存文件执行：
 * 1. biome check（格式化 + lint 修复）
 * 2. git add（将 biome 修复后的文件重新暂存）
 *
 * 注意：typecheck 和 test 不在 pre-commit 跑（太慢），由 CI 负责。
 */
module.exports = {
  "*.{ts,tsx,js,jsx,json,jsonc}": ["biome check --write --no-errors-on-unmatched"],
  "*.css": ["biome format --write --no-errors-on-unmatched"],
};
