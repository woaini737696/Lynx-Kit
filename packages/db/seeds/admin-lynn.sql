-- ============================================================
-- 永久账号种子数据
-- ============================================================
-- 账号 1（管理员）:
--   手机号: 13800000001  (登录主标识)
--   用户名: Lynn
--   密码: ee9527ff
--   角色: SUPER_ADMIN
--   状态: ACTIVE
--
-- 账号 2（妙想用户）:
--   手机号: 18942271267  (登录主标识)
--   用户名: 妙想用户
--   密码: ee9527ff
--   角色: USER
--   状态: ACTIVE
-- ------------------------------------------------------------
-- ⚠️ 永远不要改变此文件中的账号与密码。
--    此 SQL 幂等可重复执行：已存在则不修改。
--    密码使用 bcrypt(saltRounds=10) 哈希，不可逆。
--    email 字段已可选（不再用于登录），phone 为登录主标识。
-- ============================================================

INSERT INTO users (phone, name, email, password_hash, role, status)
VALUES
  (
    '13800000001',
    'Lynn',
    'lynn@miaox.local',
    '$2a$10$CpGhCy2SbSGIjC5TzCt/6.ZAi8v4Wh2W8d9QdeacfWiI3mq490r0G',
    'SUPER_ADMIN',
    'ACTIVE'
  ),
  (
    '18942271267',
    '妙想用户',
    NULL,
    '$2a$10$CpGhCy2SbSGIjC5TzCt/6.ZAi8v4Wh2W8d9QdeacfWiI3mq490r0G',
    'USER',
    'ACTIVE'
  )
ON CONFLICT (phone) DO NOTHING;
