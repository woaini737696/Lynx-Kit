-- ============================================================
-- 永久管理员账号种子数据
-- ============================================================
-- 账号: lynn@miaox.local  (登录用户名: Lynn)
-- 密码: ee9527ff
-- 角色: SUPER_ADMIN
-- 状态: ACTIVE
-- ------------------------------------------------------------
-- ⚠️ 永远不要改变此文件中的账号与密码。
--    此 SQL 幂等可重复执行：已存在则不修改。
--    密码使用 bcrypt(saltRounds=10) 哈希，不可逆。
-- ============================================================

INSERT INTO users (email, name, password_hash, role, status)
VALUES (
  'lynn@miaox.local',
  'Lynn',
  '$2a$10$CpGhCy2SbSGIjC5TzCt/6.ZAi8v4Wh2W8d9QdeacfWiI3mq490r0G',
  'SUPER_ADMIN',
  'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;
