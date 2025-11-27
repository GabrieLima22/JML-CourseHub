/* eslint-disable no-console */
const path = require('path');
const fs = require('fs/promises');
const { existsSync } = require('fs');
const crypto = require('crypto');
const slugify = require('slugify');
const { PrismaClient } = require('@prisma/client');
const { extractCourseDataFromPDF } = require('../src/controllers/pdfProcessingController');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const DEFAULT_IMPORT_DIR = process.env.PDF_IMPORT_DIR || 'C:/Users/gabriel.lima/Downloads/CURSOS/TODOS';
const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_IMPORT_DIR;
const uploadsDir = path.join(__dirname, '..', 'uploads', 'pdfs');

function normalizeText(value) {
  return value?.trim() || '';
}

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

async function createUniqueSlug(baseTitle) {
  const base = slugify(baseTitle || 'curso-importado', { lower: true, strict: true }) || crypto.randomUUID();
  let slug = base;
  let suffix = 1;

  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }

  return slug;
}

function buildCoursePayload(extracted, relativePdfPath) {
  const modality = extracted?.modalidade?.length ? extracted.modalidade : ['Curso EAD JML'];
  const tags = extracted?.tags?.length ? extracted.tags : ['capacitacao'];
  const deliverables = extracted?.deliverables?.length ? extracted.deliverables : ['Certificado'];
  const publico = extracted?.target_audience?.length ? extracted.target_audience : ['Profissionais do setor publico'];
  const objetivos = extracted?.objetivos?.length ? extracted.objetivos : ['Capacitar profissionais'];

  return {
    titulo: normalizeText(extracted?.title) || 'Curso importado do PDF',
    slug: '', // preenchido depois
    categoria: extracted?.categoria || extracted?.area || 'Estatais',
    empresa: ['JML', 'CONECTA', 'Conecta'].includes(extracted?.empresa) ? extracted?.empresa : 'JML',
    tipo: extracted?.tipo || 'aberto',
    modalidade: modality,
    segmento: extracted?.segmento || extracted?.area || 'Estatais',
    data_inicio: null,
    data_fim: null,
    local: null,
    endereco_completo: null,
    carga_horaria: Math.max(4, extracted?.duration_hours || 8),
    summary: normalizeText(extracted?.summary) || 'Resumo nao identificado no PDF.',
    description: normalizeText(extracted?.description) || 'Descricao nao identificada no PDF.',
    objetivos,
    publico_alvo: publico,
    professores: [],
    coordenacao: null,
    investimento: { valor: 0, moeda: 'BRL' },
    forma_pagamento: ['PIX', 'Boleto', 'Cartao'],
    programacao: [],
    metodologia: null,
    pdf_original: relativePdfPath,
    pdf_url: relativePdfPath ? `/uploads/${relativePdfPath.replace(/\\/g, '/')}` : null,
    landing_page: null,
    inscricao_url: null,
    tags,
    deliverables,
    related_ids: [],
    views_count: 0,
    clicks_count: 0,
    conversions_count: 0,
    cor_categoria: null,
    icone: null,
    imagem_capa: null,
    status: 'draft',
    destaque: false,
    novo: false,
    created_by: 'pdf-script',
    updated_by: 'pdf-script'
  };
}

async function processPdf(filePath) {
  const stats = await fs.stat(filePath);
  if (!stats.isFile() || !filePath.toLowerCase().endsWith('.pdf')) {
    return { skipped: true, reason: 'not a pdf' };
  }

  console.log(`\n[script] Processando: ${filePath}`);
  const bufferName = `${crypto.randomUUID()}.pdf`;
  await ensureUploadsDir();
  const destinationPath = path.join(uploadsDir, bufferName);
  await fs.copyFile(filePath, destinationPath);

  const extraction = await extractCourseDataFromPDF(destinationPath);
  const relativePath = path.relative(path.join(__dirname, '..'), destinationPath);

  const uploadRecord = await prisma.upload.create({
    data: {
      filename: bufferName,
      original_name: path.basename(filePath),
      size: stats.size,
      mimetype: 'application/pdf',
      path: relativePath,
      status: extraction.success ? 'completed' : 'error',
      progress: extraction.success ? 100 : 0,
      extracted_data: extraction.success ? extraction.data : null,
      ai_confidence: extraction.success ? extraction.data?.confidence || 0 : 0,
      error_message: extraction.success ? null : extraction.error,
      processing_time: 0
    }
  });

  if (!extraction.success || !extraction.data) {
    console.warn('[script] Falha ao extrair dados do PDF. Upload registrado apenas para auditoria.');
    return { skipped: true, reason: 'extraction failed' };
  }

  const coursePayload = buildCoursePayload(extraction.data, relativePath);
  coursePayload.slug = await createUniqueSlug(coursePayload.titulo);

  const course = await prisma.course.create({ data: coursePayload });

  await prisma.upload.update({
    where: { id: uploadRecord.id },
    data: { course_id: course.id }
  });

  console.log(`Curso criado: ${course.titulo} (${course.slug})`);
  return { skipped: false };
}

async function main() {
  if (!existsSync(sourceDir)) {
    console.error(`? Diretorio nao encontrado: ${sourceDir}`);
    process.exit(1);
  }

  const entries = await fs.readdir(sourceDir);
  const pdfs = entries.filter(file => file.toLowerCase().endsWith('.pdf'));

  console.log(`[script] Importando PDFs de ${sourceDir}`);
  console.log(`Encontrados ${pdfs.length} arquivos.`);

  let processed = 0;
  let skipped = 0;

  for (const file of pdfs) {
    const absolutePath = path.join(sourceDir, file);
    try {
      const result = await processPdf(absolutePath);
      if (result.skipped) {
        skipped += 1;
      } else {
        processed += 1;
      }
    } catch (error) {
      skipped += 1;
      console.error(`Erro ao processar ${file}:`, error.message);
    }
  }

  console.log('\nResumo:');
  console.log(`  Processados: ${processed}`);
  console.log(`  Ignorados: ${skipped}`);
}

main()
  .catch(error => {
    console.error('Erro inesperado ao importar PDFs:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



