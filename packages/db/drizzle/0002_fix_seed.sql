-- Fix Lynn admin phone and insert 妙想用户
UPDATE users SET phone = '10000000001', name = 'Lynn', role = 'SUPER_ADMIN', status = 'ACTIVE'
WHERE email = 'lynn@miaox.local';

-- Insert 妙想用户 if not exists
INSERT INTO users (phone, name, email, password_hash, role, status)
SELECT '18942271267', '妙想用户', NULL, '$2a$10$CpGhCy2SbSGIjC5TzCt/6.ZAi8v4Wh2W8d9QdeacfWiI3mq490r0G', 'USER', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '18942271267');

-- Verify
SELECT phone, name, role, email FROM users ORDER BY created_at;
