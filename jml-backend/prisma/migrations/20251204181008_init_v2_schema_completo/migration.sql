-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "titulo_complemento" TEXT,
    "slug" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "modalidade" TEXT[],
    "segmento" TEXT NOT NULL,
    "segmentos_adicionais" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "local" TEXT,
    "endereco_completo" TEXT,
    "carga_horaria" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "apresentacao" TEXT,
    "publico_alvo" TEXT[],
    "objetivos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vantagens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vantagens_ead" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audience" TEXT,
    "aprendizados" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "professores" JSONB[],
    "palestrantes" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "coordenacao" JSONB,
    "investimento" JSONB NOT NULL,
    "preco_online" DOUBLE PRECISION,
    "preco_presencial" DOUBLE PRECISION,
    "preco_incompany" DOUBLE PRECISION,
    "forma_pagamento" TEXT[],
    "programacao" JSONB[],
    "metodologia" TEXT,
    "logistica_detalhes" TEXT,
    "preco_resumido" TEXT,
    "pdf_original" TEXT,
    "pdf_url" TEXT,
    "landing_page" TEXT,
    "inscricao_url" TEXT,
    "tags" TEXT[],
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliverables" TEXT[],
    "related_ids" TEXT[],
    "motivos_participar" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orientacoes_inscricao" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contatos" JSONB,
    "custom_fields" JSONB,
    "custom_schema" JSONB DEFAULT '[]',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "clicks_count" INTEGER NOT NULL DEFAULT 0,
    "conversions_count" INTEGER NOT NULL DEFAULT 0,
    "cor_categoria" TEXT,
    "icone" TEXT,
    "imagem_capa" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "novo" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "permissions" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "avatar" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'auto',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "last_login" TIMESTAMP(3),
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "two_factor" BOOLEAN NOT NULL DEFAULT false,
    "reset_token" TEXT,
    "reset_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "extracted_data" JSONB,
    "error_message" TEXT,
    "processing_time" INTEGER,
    "ai_confidence" DOUBLE PRECISION,
    "manual_review" BOOLEAN NOT NULL DEFAULT false,
    "course_id" TEXT,
    "processed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "course_id" TEXT,
    "search_query" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "referrer" TEXT,
    "filters_used" JSONB,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_empresa_tipo_idx" ON "courses"("empresa", "tipo");

-- CreateIndex
CREATE INDEX "courses_categoria_segmento_idx" ON "courses"("categoria", "segmento");

-- CreateIndex
CREATE INDEX "courses_status_published_at_idx" ON "courses"("status", "published_at");

-- CreateIndex
CREATE INDEX "courses_destaque_novo_idx" ON "courses"("destaque", "novo");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "uploads_status_created_at_idx" ON "uploads"("status", "created_at");

-- CreateIndex
CREATE INDEX "uploads_course_id_idx" ON "uploads"("course_id");

-- CreateIndex
CREATE INDEX "analytics_event_type_created_at_idx" ON "analytics"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "analytics_course_id_created_at_idx" ON "analytics"("course_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "config_key_key" ON "config"("key");

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
