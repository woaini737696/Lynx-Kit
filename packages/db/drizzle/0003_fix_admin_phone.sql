-- Fix admin phone number to match phoneSchema regex /^1[3-9]\d{9}$/
-- 10000000001 (second digit 0) → 13800000001 (second digit 3, valid)
UPDATE users SET phone = '13800000001'
WHERE phone = '10000000001' AND email = 'lynn@miaox.local';

-- Verify
SELECT phone, name, role, email FROM users ORDER BY created_at;
