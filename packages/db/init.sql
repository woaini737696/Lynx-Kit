-- LynxKit 数据库初始化脚本（MVP）
-- 由 schema/*.ts 手动转写，依赖 pgvector 扩展用于商店语义检索
-- 用法：psql -U postgres -d lynxkit -f init.sql

-- ===== 扩展：pgvector（向量相似度检索，store_products.embeddings 字段） =====
CREATE EXTENSION IF NOT EXISTS vector;

-- ===== 枚举类型 =====
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER','CREATOR','ADMIN','SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE','SUSPENDED','DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE server_status AS ENUM ('PENDING','CONNECTED','DOCKER_READY','ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('SOCIAL','SYSTEM','WORKSTATION','DATA','ADMIN','APP','MARKETING','HARDWARE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE build_status AS ENUM ('DRAFT','CLARIFYING','ARCHITECTING','DEVELOPING','TESTING','DEPLOYING','DEPLOYED','ERROR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE log_level AS ENUM ('INFO','WARN','ERROR','DEBUG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE store_category AS ENUM ('SOCIAL','SYSTEM','WORKSTATION','DATA','ADMIN','APP','MARKETING','HARDWARE','AGENT','WORKFLOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE pricing_type AS ENUM ('FREE','PAY_PER_USE','SUBSCRIPTION','EXCHANGE','ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE store_status AS ENUM ('DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('PURCHASE','SUBSCRIPTION','API_CALL','EXCHANGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('PENDING','COMPLETED','REFUNDED','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== 表 =====

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  phone TEXT,
  lynx_ai_id TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_idx ON users(phone);
CREATE UNIQUE INDEX IF NOT EXISTS users_lynx_ai_id_idx ON users(lynx_ai_id);
CREATE INDEX IF NOT EXISTS users_id_idx ON users(id);

CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ip TEXT NOT NULL,
  port INTEGER NOT NULL DEFAULT 22,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  ssh_key TEXT,
  status server_status NOT NULL DEFAULT 'PENDING',
  docker_ready BOOLEAN NOT NULL DEFAULT FALSE,
  caddy_ready BOOLEAN NOT NULL DEFAULT FALSE,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS servers_user_id_idx ON servers(user_id);

CREATE TABLE IF NOT EXISTS build_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id),
  name TEXT NOT NULL,
  description TEXT,
  product_type product_type NOT NULL,
  status build_status NOT NULL DEFAULT 'DRAFT',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  architecture JSONB,
  generated_code JSONB,
  deploy_url TEXT,
  custom_domain TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS build_sessions_user_id_idx ON build_sessions(user_id);
CREATE INDEX IF NOT EXISTS build_sessions_status_idx ON build_sessions(status);
CREATE INDEX IF NOT EXISTS build_sessions_user_status_created_idx ON build_sessions(user_id, status, created_at);

CREATE TABLE IF NOT EXISTS build_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_sessions(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  level log_level NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS build_logs_session_id_idx ON build_logs(session_id);

CREATE TABLE IF NOT EXISTS build_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES build_sessions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL,
  code_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS build_versions_session_id_idx ON build_versions(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS build_versions_session_version_idx ON build_versions(session_id, version);

CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES build_sessions(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  category store_category NOT NULL,
  pricing_type pricing_type NOT NULL,
  price NUMERIC(10,2),
  monthly_price NUMERIC(10,2),
  status store_status NOT NULL DEFAULT 'DRAFT',
  version TEXT NOT NULL DEFAULT '1.0.0',
  download_url TEXT,
  demo_url TEXT,
  api_endpoint TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  embeddings vector(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS store_products_creator_id_idx ON store_products(creator_id);
CREATE INDEX IF NOT EXISTS store_products_category_idx ON store_products(category);
CREATE INDEX IF NOT EXISTS store_products_status_idx ON store_products(status);
CREATE INDEX IF NOT EXISTS store_products_status_created_idx ON store_products(status, created_at);
-- pgvector ivfflat 索引：加速 cosine 相似度检索（<=> 操作符）
-- lists=100 适合 < 1M 条记录；查询时 ivfflat probes 默认 1
CREATE INDEX IF NOT EXISTS store_products_embeddings_idx
  ON store_products USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES store_products(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  type transaction_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  seller_revenue NUMERIC(10,2) NOT NULL,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS transactions_product_id_idx ON transactions(product_id);
CREATE INDEX IF NOT EXISTS transactions_buyer_id_idx ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS transactions_buyer_status_created_idx ON transactions(buyer_id, status, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES store_products(id),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_product_user_idx ON reviews(product_id, user_id);

CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  website TEXT,
  github TEXT,
  twitter TEXT,
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT '0',
  total_products INTEGER NOT NULL DEFAULT 0,
  total_users INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS creator_profiles_user_id_idx ON creator_profiles(user_id);

CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS system_configs_key_idx ON system_configs(key);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type product_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  questions JSONB NOT NULL,
  config_map JSONB NOT NULL,
  base_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS templates_type_idx ON templates(type);

-- ===== 初始数据：插入管理员账号（密码: admin123，bcrypt hash） =====
INSERT INTO users (email, name, role, status) VALUES
  ('admin@lynxkit.com', '平台管理员', 'SUPER_ADMIN', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;
