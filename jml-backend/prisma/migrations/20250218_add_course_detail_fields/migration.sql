-- Add new metadata fields for course detail/brief views
ALTER TABLE "courses"
ADD COLUMN "titulo_complemento" TEXT,
ADD COLUMN "segmentos_adicionais" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aprendizados" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "logistica_detalhes" TEXT,
ADD COLUMN "preco_resumido" TEXT,
ADD COLUMN "badges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "motivos_participar" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "orientacoes_inscricao" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "contatos" JSONB;
