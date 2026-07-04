-- ============================================================
-- 0001: 切换登录主标识从 email 到 phone
-- ============================================================
-- 变更：
--   1. users.email: NOT NULL → NULLABLE（仅作可选联系方式）
--   2. users.phone: NULLABLE → NOT NULL（成为登录主标识）
--   3. 为现有无 phone 的用户回填占位手机号
--
-- 安全：幂等可重复执行（IF NOT EXISTS / DO NOTHING）
-- ============================================================

-- 1. 回填现有用户的 phone（如果为 NULL）
-- 为没有手机号的用户生成占位号 10000000000 + id 的 hash 后 8 位
UPDATE users
SET phone = '10000000' || lpad(abs(('x' || md5(id::text))::bit(64)::bigint % 100000000)::text, 8, '0')
WHERE phone IS NULL;

-- 2. email 改为可空
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 3. phone 改为非空
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- 4. 重建 email 唯一索引（允许 NULL，PostgreSQL 默认支持多 NULL）
-- 现有索引已支持，无需重建
