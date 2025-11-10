const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mime = require('mime-types');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');
const { extractCourseDataFromPDF } = require('../controllers/pdfProcessingController');

const prisma = new PrismaClient();
const router = express.Router();

const uploadsRoot = path.join(__dirname, '../../uploads');
const pdfDir = path.join(uploadsRoot, 'pdfs');

fs.mkdirSync(pdfDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, pdfDir),
  filename: (_req, file, cb) => {
    const unique = crypto.randomUUID();
    const ext = mime.extension(file.mimetype) || 'bin';
    cb(null, `${unique}.${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Somente PDFs são permitidos'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const DEFAULT_MODALITY = ['Curso EAD JML'];

const buildCoursePayload = (extractedData = {}, relativePath) => {
  const normalize = value =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

  const modality =
    Array.isArray(extractedData.modalidade) && extractedData.modalidade.length > 0
      ? extractedData.modalidade
      : DEFAULT_MODALITY;

  return {
    titulo: normalize(extractedData.title) || 'Curso importado de PDF',
    slug: '',
    categoria: normalize(extractedData.categoria) || normalize(extractedData.area) || 'Estatais',
    empresa: normalize(extractedData.empresa) || 'JML',
    tipo: normalize(extractedData.tipo) || 'aberto',
    modalidade: modality,
    segmento: normalize(extractedData.segmento) || normalize(extractedData.area) || 'Estatais',
    data_inicio: null,
    data_fim: null,
    local: null,
    endereco_completo: null,
    carga_horaria: Number(extractedData.duration_hours) > 0 ? Number(extractedData.duration_hours) : 8,
    summary: normalize(extractedData.summary) || 'Resumo não identificado no PDF.',
    description: normalize(extractedData.description) || 'Descrição não identificada no PDF.',
    objetivos: Array.isArray(extractedData.objetivos) ? extractedData.objetivos : [],
    publico_alvo: Array.isArray(extractedData.target_audience) ? extractedData.target_audience : [],
    nivel: normalize(extractedData.level) || 'Intermediário',
    professores: [],
    coordenacao: null,
    investimento: { valor: 0 },
    forma_pagamento: ['PIX', 'Boleto', 'Cartão'],
    programacao: [],
    metodologia: null,
    pdf_original: relativePath,
    pdf_url: relativePath ? `/uploads/${relativePath.replace(/\\/g, '/')}` : null,
    landing_page: null,
    inscricao_url: null,
    tags: Array.isArray(extractedData.tags) ? extractedData.tags : [],
    deliverables: Array.isArray(extractedData.deliverables) ? extractedData.deliverables : ['Certificado'],
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
    created_by: 'upload',
    updated_by: 'upload'
  };
};

const generateUniqueSlug = async titulo => {
  const base =
    slugify(titulo || 'curso-importado', { lower: true, strict: true }) || crypto.randomUUID();
  let slug = base;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.course.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${base}-${suffix++}`;
  }

  return slug;
};

const persistCourseFromExtraction = async (extractedData, uploadRecord, courseId) => {
  const relativePath = uploadRecord.path;
  const payload = buildCoursePayload(extractedData, relativePath);

  if (courseId) {
    try {
      const updateData = { ...payload };
      delete updateData.slug;
      return await prisma.course.update({
        where: { id: courseId },
        data: updateData
      });
    } catch (error) {
      console.error('Erro ao atualizar curso existente a partir do PDF:', error);
      return null;
    }
  }

  try {
    payload.slug = await generateUniqueSlug(payload.titulo);
    return await prisma.course.create({ data: payload });
  } catch (error) {
    console.error('Erro ao criar curso a partir do PDF:', error);
    return null;
  }
};

router.get('/', async (_req, res, next) => {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    res.apiResponse({ uploads }, 'Uploads recentes carregados');
  } catch (error) {
    next(error);
  }
});

router.post('/pdf', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.apiError('Arquivo n�o encontrado no payload', 400, 'UPLOAD_MISSING_FILE');
    }

    const { courseId } = req.body;
    let savedUpload = null;
    let courseRecord = null;

    console.log('?? Processando PDF com IA...');
    const pdfPath = req.file.path;
    const extraction = await extractCourseDataFromPDF(pdfPath);

    savedUpload = await prisma.upload.create({
      data: {
        course_id: courseId || null,
        filename: req.file.filename,
        original_name: req.file.originalname,
        path: path.relative(path.join(__dirname, '..', '..'), req.file.path),
        size: req.file.size,
        mimetype: req.file.mimetype,
        status: extraction.success ? 'completed' : 'error',
        progress: 100,
        extracted_data: extraction.success ? extraction.data : null,
        ai_confidence: extraction.success ? extraction.data.confidence : 0,
        error_message: extraction.success ? null : extraction.error,
        processing_time: 0
      },
    });

    if (extraction.success) {
      courseRecord = await persistCourseFromExtraction(
        extraction.data,
        savedUpload,
        courseId
      );

      if (courseRecord) {
        await prisma.upload.update({
          where: { id: savedUpload.id },
          data: { course_id: courseRecord.id }
        });
      }
    }

    console.log(extraction.success ? '? PDF processado com sucesso!' : '?? Erro ao processar PDF');

    res.apiResponse(
      {
        file: {
          id: savedUpload.id,
          name: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          url: `/uploads/pdfs/${req.file.filename}`,
        },
        courseId: courseRecord?.id || courseId || null,
        storedInDatabase: true,
        extractedData: extraction.success ? extraction.data : null,
        processingSuccess: extraction.success,
        error: extraction.success ? null : extraction.error,
        createdCourseId: courseRecord?.id ?? null
      },
      extraction.success ? 'Upload e processamento conclu�dos' : 'Upload realizado mas falhou processamento'
    );
  } catch (error) {
    console.error('Erro no upload:', error);
    next(error);
  }
});

module.exports = router;

