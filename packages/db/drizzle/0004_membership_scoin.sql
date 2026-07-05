-- 迭代 14C：会员体系 + S 币钱包
-- 创建日期：2026-07-05
-- 包含 4 张表 + 4 个枚举类型 + 4 档会员静态数据 + 所有用户默认 S 币余额初始化

-- ============ 枚举类型 ============

CREATE TYPE membership_tier AS ENUM ('FREE', 'LITE', 'PRO', 'MAX');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELED', 'SUSPENDED');
CREATE TYPE membership_source AS ENUM ('MANUAL', 'PAYMENT', 'GIFT', 'TRIAL');
CREATE TYPE scoin_tx_type AS ENUM ('RECHARGE', 'CONSUME', 'GRANT', 'REFUND', 'EXCHANGE', 'ADJUST');

-- ============ 会员档位表 ============

CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier membership_tier NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  monthly_scoin_grant INTEGER NOT NULL DEFAULT 0,
  token_to_scoin_rate INTEGER NOT NULL DEFAULT 15,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  features JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS membership_plans_tier_idx ON membership_plans(tier);

-- ============ 用户会员状态表 ============

CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier membership_tier NOT NULL,
  status membership_status NOT NULL DEFAULT 'ACTIVE',
  source membership_source NOT NULL DEFAULT 'MANUAL',
  duration_months INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  operator_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS user_memberships_user_id_idx ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS user_memberships_status_idx ON user_memberships(status);
CREATE INDEX IF NOT EXISTS user_memberships_expires_at_idx ON user_memberships(expires_at);

-- ============ S 币余额表 ============

CREATE TABLE IF NOT EXISTS scoin_balances (
  user_id UUID PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  frozen_balance INTEGER NOT NULL DEFAULT 0,
  total_granted INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============ S 币流水表 ============

CREATE TABLE IF NOT EXISTS scoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type scoin_tx_type NOT NULL,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  ref_type TEXT,
  ref_id TEXT,
  operator_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS scoin_tx_user_id_idx ON scoin_transactions(user_id);
CREATE INDEX IF NOT EXISTS scoin_tx_type_idx ON scoin_transactions(type);
CREATE INDEX IF NOT EXISTS scoin_tx_created_at_idx ON scoin_transactions(created_at);

-- ============ 初始化 4 档会员静态数据 ============

INSERT INTO membership_plans (tier, name, price_monthly, price_yearly, monthly_scoin_grant, token_to_scoin_rate, sort_order, features) VALUES
  ('FREE', '免费会员', 0.00, 0.00, 50, 15, 1, '{"dailyTokenLimit": 1000, "models": ["gpt-4o-mini"], "features": {"store": true, "build": "limited"}}'::jsonb),
  ('LITE', 'Lite 会员', 49.00, 470.00, 500, 15, 2, '{"dailyTokenLimit": 10000, "models": ["gpt-4o-mini", "gpt-4o"], "features": {"store": true, "build": true}}'::jsonb),
  ('PRO', 'Pro 会员', 129.00, 1238.00, 1500, 15, 3, '{"dailyTokenLimit": 50000, "models": ["gpt-4o", "claude-sonnet-4", "deepseek-chat"], "features": {"store": true, "build": true, "priority": true}}'::jsonb),
  ('MAX', 'Max 会员', 239.00, 2294.00, 3000, 15, 4, '{"dailyTokenLimit": 200000, "models": ["gpt-4o", "claude-opus-4", "deepseek-reasoner"], "features": {"store": true, "build": true, "priority": true, "exclusive": true}}'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- ============ 为所有现有用户初始化 S 币余额（默认 0）和 FREE 会员状态 ============

INSERT INTO scoin_balances (user_id, balance, frozen_balance, total_granted, total_consumed)
SELECT id, 0, 0, 0, 0 FROM users
WHERE id NOT IN (SELECT user_id FROM scoin_balances)
ON CONFLICT (user_id) DO NOTHING;

-- 给所有现有用户开通 FREE 会员（如果没有 ACTIVE 会员）
INSERT INTO user_memberships (user_id, tier, status, source, duration_months, started_at, note)
SELECT u.id, 'FREE', 'ACTIVE', 'MANUAL', 0, NOW(), '系统初始化默认免费会员'
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_memberships um
  WHERE um.user_id = u.id AND um.status = 'ACTIVE'
)
ON CONFLICT DO NOTHING;

-- ============ 验证查询 ============

SELECT tier, name, price_monthly, monthly_scoin_grant FROM membership_plans ORDER BY sort_order;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS balance_count FROM scoin_balances;
SELECT COUNT(*) AS active_membership_count FROM user_memberships WHERE status = 'ACTIVE';
