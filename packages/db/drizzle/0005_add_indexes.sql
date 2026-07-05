-- 迭代 14E：DB 索引优化迁移
-- 创建日期：2026-07-05
-- 来源：docs/ARCHITECTURE_REVIEW.md P1 优化建议
-- 目标：补充缺失索引以加速 admin 后台筛选、创作者销售查询、会员当前状态查询、S 币流水分页、语义检索
-- 注意：使用 IF NOT EXISTS 以保证可重复执行（幂等）

-- ============ users 表 ============
-- 用途：admin 后台按角色筛选用户、按状态筛选、按注册时间分页排序
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at DESC);

-- ============ store_products 表 ============
-- 用途：pgvector 语义检索（商店搜索）
-- IVFFlat 索引：lists=100 适合 ~10000 行数据，需在数据填充后执行 ANALYZE 重建统计
-- 注意：Drizzle ORM 不直接支持 pgvector 索引，需手动 SQL
CREATE INDEX IF NOT EXISTS store_products_embeddings_idx
  ON store_products
  USING ivfflat (embeddings vector_cosine_ops)
  WITH (lists = 100);

-- ============ transactions 表 ============
-- 用途：创作者查询自己的销售记录（seller 视角）
CREATE INDEX IF NOT EXISTS transactions_seller_id_idx ON transactions(seller_id);
-- 复合索引：卖家 + 状态 + 创建时间（创作者销售订单分页）
CREATE INDEX IF NOT EXISTS transactions_seller_status_created_idx
  ON transactions(seller_id, status, created_at DESC);

-- ============ user_memberships 表 ============
-- 用途：查询用户当前 ACTIVE 会员（高频调用，单 userId + status 索引分离查询效率较低）
CREATE INDEX IF NOT EXISTS user_memberships_user_status_idx
  ON user_memberships(user_id, status);

-- ============ scoin_transactions 表 ============
-- 用途：用户 S 币流水分页查询（按时间倒序）
CREATE INDEX IF NOT EXISTS scoin_tx_user_created_idx
  ON scoin_transactions(user_id, created_at DESC);

-- ============ 完成后建议 ============
-- 对大表执行 ANALYZE 以更新统计信息：
--   ANALYZE users;
--   ANALYZE store_products;
--   ANALYZE transactions;
--   ANALYZE user_memberships;
--   ANALYZE scoin_transactions;
