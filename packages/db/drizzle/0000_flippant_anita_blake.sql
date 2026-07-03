CREATE TYPE "public"."build_status" AS ENUM('DRAFT', 'CLARIFYING', 'ARCHITECTING', 'DEVELOPING', 'TESTING', 'DEPLOYING', 'DEPLOYED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."log_level" AS ENUM('INFO', 'WARN', 'ERROR', 'DEBUG');--> statement-breakpoint
CREATE TYPE "public"."pricing_type" AS ENUM('FREE', 'PAY_PER_USE', 'SUBSCRIPTION', 'EXCHANGE', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('SOCIAL', 'SYSTEM', 'WORKSTATION', 'DATA', 'ADMIN', 'APP', 'MARKETING', 'HARDWARE');--> statement-breakpoint
CREATE TYPE "public"."server_status" AS ENUM('PENDING', 'CONNECTED', 'DOCKER_READY', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."store_category" AS ENUM('SOCIAL', 'SYSTEM', 'WORKSTATION', 'DATA', 'ADMIN', 'APP', 'MARKETING', 'HARDWARE', 'AGENT', 'WORKFLOW');--> statement-breakpoint
CREATE TYPE "public"."store_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('PURCHASE', 'SUBSCRIPTION', 'API_CALL', 'EXCHANGE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TABLE "build_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"agent" text NOT NULL,
	"level" "log_level" NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "build_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"server_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"product_type" "product_type" NOT NULL,
	"status" "build_status" DEFAULT 'DRAFT' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"architecture" jsonb,
	"generated_code" jsonb,
	"deploy_url" text,
	"custom_domain" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "build_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"config" jsonb NOT NULL,
	"code_hash" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"website" text,
	"github" text,
	"twitter" text,
	"total_revenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_products" integer DEFAULT 0 NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"ip" text NOT NULL,
	"port" integer DEFAULT 22 NOT NULL,
	"username" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"ssh_key" text,
	"status" "server_status" DEFAULT 'PENDING' NOT NULL,
	"docker_ready" boolean DEFAULT false NOT NULL,
	"caddy_ready" boolean DEFAULT false NOT NULL,
	"last_connected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text,
	"screenshots" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"category" "store_category" NOT NULL,
	"pricing_type" "pricing_type" NOT NULL,
	"price" numeric(10, 2),
	"monthly_price" numeric(10, 2),
	"status" "store_status" DEFAULT 'DRAFT' NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"download_url" text,
	"demo_url" text,
	"api_endpoint" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"embeddings" vector(1024),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_products_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "product_type" NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"questions" jsonb NOT NULL,
	"config_map" jsonb NOT NULL,
	"base_path" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"platform_fee" numeric(10, 2) NOT NULL,
	"seller_revenue" numeric(10, 2) NOT NULL,
	"status" "transaction_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar" text,
	"phone" text,
	"lynx_ai_id" text,
	"password_hash" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "build_logs" ADD CONSTRAINT "build_logs_session_id_build_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."build_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_sessions" ADD CONSTRAINT "build_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_sessions" ADD CONSTRAINT "build_sessions_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_versions" ADD CONSTRAINT "build_versions_session_id_build_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."build_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_session_id_build_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."build_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_store_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."store_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "build_logs_session_id_idx" ON "build_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "build_sessions_user_id_idx" ON "build_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "build_sessions_status_idx" ON "build_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "build_sessions_user_status_created_idx" ON "build_sessions" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "build_versions_session_id_idx" ON "build_versions" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "build_versions_session_version_idx" ON "build_versions" USING btree ("session_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "creator_profiles_user_id_idx" ON "creator_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_product_id_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_product_user_idx" ON "reviews" USING btree ("product_id","user_id");--> statement-breakpoint
CREATE INDEX "servers_user_id_idx" ON "servers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_products_creator_id_idx" ON "store_products" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "store_products_category_idx" ON "store_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "store_products_status_idx" ON "store_products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "store_products_status_created_idx" ON "store_products" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "system_configs_key_idx" ON "system_configs" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "templates_type_idx" ON "templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_product_id_idx" ON "transactions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "transactions_buyer_id_idx" ON "transactions" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "transactions_buyer_status_created_idx" ON "transactions" USING btree ("buyer_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "users_lynx_ai_id_idx" ON "users" USING btree ("lynx_ai_id");--> statement-breakpoint
CREATE INDEX "users_id_idx" ON "users" USING btree ("id");