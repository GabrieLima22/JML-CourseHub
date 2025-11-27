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
    return cb(new Error('Somente PDFs sao permitidos'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const DEFAULT_MODALITY = ['Curso EAD JML'];
const DEFAULT_UPLOAD_STATUS = (process.env.UPLOAD_DEFAULT_STATUS || 'draft').trim();

const stripDiacritics = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const guessModalidade = extractedData => {
  if (Array.isArray(extractedData.modalidade) && extractedData.modalidade.length > 0) {
    return extractedData.modalidade.map(value => value.trim()).filter(Boolean);
  }

  const haystack = [extractedData.summary, extractedData.description, extractedData.area, extractedData.segmento]
    .filter(Boolean)
    .join(' ');
  const normalized = stripDiacritics(haystack);
  const candidates = [];

  if (normalized.includes('hibrid')) candidates.push('Curso Hibrido JML');
  if (normalized.includes('in company') || normalized.includes('incompany')) candidates.push('Curso InCompany JML');
  if (normalized.includes('conecta') && normalized.includes('abert')) candidates.push('Curso aberto Conecta');
  if (normalized.includes('abert') && !candidates.includes('Curso aberto JML')) candidates.push('Curso aberto JML');
  if (normalized.includes('ead') || normalized.includes('online') || normalized.includes('virtual')) {
    candidates.push('Curso EAD JML');
  }

  return candidates.length > 0 ? [...new Set(candidates)] : DEFAULT_MODALITY;
};

const canonicalizeModalidade = value => {
  if (!value) return null;
  const normalized = stripDiacritics(value);
  if (normalized.includes('hibrid')) return 'Curso Hibrido JML';
  if (normalized.includes('conecta') && normalized.includes('abert')) return 'Curso aberto Conecta';
  if (normalized.includes('abert') && normalized.includes('jml')) return 'Curso aberto JML';
  if (normalized.includes('in company') && normalized.includes('conecta')) return 'Curso InCompany Conecta';
  if (normalized.includes('in company') || normalized.includes('incompany')) return 'Curso InCompany JML';
  if (normalized.includes('ead') || normalized.includes('online')) return 'Curso EAD JML';
  return value.trim();
};

const inferTipoKeyword = value => {
  if (!value) return null;
  const normalized = stripDiacritics(value);
  if (normalized.includes('hibrid')) return 'hibrido';
  if (normalized.includes('in company') || normalized.includes('incompany')) return 'incompany';
  if (normalized.includes('ead') || normalized.includes('online')) return 'ead';
  if (normalized.includes('abert')) return 'aberto';
  return null;
};

const inferCourseType = (extractedData, modalidadeList) => {
  const typeFromField = inferTipoKeyword(extractedData.tipo);
  if (typeFromField) return typeFromField;

  for (const modalidade of modalidadeList) {
    const typeFromModalidade = inferTipoKeyword(modalidade);
    if (typeFromModalidade) return typeFromModalidade;
  }

  const haystack = [extractedData.summary, extractedData.description, extractedData.categoria, extractedData.area];
  for (const fragment of haystack) {
    const inferred = inferTipoKeyword(fragment);
    if (inferred) return inferred;
  }

  return 'aberto';
};

const inferCompany = (extractedData, modalidadeList) => {
  if (typeof extractedData.empresa === 'string' && extractedData.empresa.trim()) {
    return extractedData.empresa.trim();
  }

  const buffer = [extractedData.summary, extractedData.description, ...modalidadeList]
    .filter(Boolean)
    .join(' ');
  if (stripDiacritics(buffer).includes('conecta')) {
    return 'Conecta';
  }

  return 'JML';
};

const buildCoursePayload = (extractedData = {}, relativePath) => {
  const normalize = value =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

  const inferredModalidade = guessModalidade(extractedData)
    .map(canonicalizeModalidade)
    .filter(Boolean);
  const modality = inferredModalidade.length > 0 ? inferredModalidade : DEFAULT_MODALITY;
  const resolvedTipo = inferCourseType(extractedData, modality);
  const resolvedEmpresa = inferCompany(extractedData, modality);
  const resolvedSegmento = normalize(extractedData.segmento) || normalize(extractedData.area) || 'Estatais';
  const segmentosAdicionais =
    Array.isArray(extractedData.segmentos_adicionais) && extractedData.segmentos_adicionais.length
      ? extractedData.segmentos_adicionais
      : Array.isArray(extractedData.segments)
      ? extractedData.segments.slice(1)
      : [];

  const professores =
    Array.isArray(extractedData.speakers) && extractedData.speakers.length > 0
      ? extractedData.speakers.map(speaker => ({
          nome: normalize(speaker.name) || null,
          cargo: normalize(speaker.role) || null,
          empresa: normalize(speaker.company) || null,
          bio: normalize(speaker.bio) || null,
          avatar: normalize(speaker.avatar) || null
        }))
      : [];

  const investmentDetails = extractedData.investment_details || {};
  const investimento = {
    valor: normalize(extractedData.price_summary),
    summary: normalize(investmentDetails.summary) || normalize(extractedData.price_summary),
    options: Array.isArray(investmentDetails.options) ? investmentDetails.options : [],
    notes: normalize(investmentDetails.notes),
  };

  const contactos =
    extractedData.contacts && Object.keys(extractedData.contacts).length > 0
      ? {
          email: normalize(extractedData.contacts.email),
          phone: normalize(extractedData.contacts.phone),
          whatsapp: normalize(extractedData.contacts.whatsapp),
          website: normalize(extractedData.contacts.website),
          hours: normalize(extractedData.contacts.hours),
        }
      : null;

  const programacao =
    Array.isArray(extractedData.programacao) && extractedData.programacao.length > 0
      ? extractedData.programacao.map(item => ({
          titulo: normalize(item.title || item.titulo) || null,
          descricao: normalize(item.description || item.descricao) || null,
          topicos: Array.isArray(item.topics) ? item.topics : undefined,
        }))
      : [];

  const learningPoints =
    Array.isArray(extractedData.learning_points) && extractedData.learning_points.length > 0
      ? extractedData.learning_points
      : Array.isArray(extractedData.aprendizados)
      ? extractedData.aprendizados
      : [];

  return {
    titulo: normalize(extractedData.title) || 'Curso importado de PDF',
    titulo_complemento: normalize(extractedData.subtitle),
    slug: '',
    categoria: normalize(extractedData.categoria) || normalize(extractedData.area) || 'Estatais',
    empresa: resolvedEmpresa,
    tipo: resolvedTipo,
    modalidade: modality,
    segmento: resolvedSegmento,
    segmentos_adicionais: segmentosAdicionais,
    data_inicio: null,
    data_fim: null,
    local: null,
    endereco_completo: null,
    carga_horaria: Number(extractedData.duration_hours) > 0 ? Number(extractedData.duration_hours) : 8,
    summary: normalize(extractedData.summary) || 'Resumo nao identificado no PDF.',
    description: normalize(extractedData.description) || 'Descricao nao identificada no PDF.',
    objetivos: Array.isArray(extractedData.objetivos) ? extractedData.objetivos : [],
    publico_alvo: Array.isArray(extractedData.target_audience)
      ? extractedData.target_audience
      : Array.isArray(extractedData.publico_alvo)
      ? extractedData.publico_alvo
      : [],
    aprendizados: learningPoints,
    nivel: normalize(extractedData.level) || 'Intermediario',
    professores,
    coordenacao: null,
    investimento,
    forma_pagamento: Array.isArray(extractedData.payment_methods) && extractedData.payment_methods.length
      ? extractedData.payment_methods
      : ['PIX', 'Boleto', 'Cartao'],
    programacao,
    metodologia: normalize(extractedData.metodologia),
    logistica_detalhes: normalize(extractedData.logistics_details || extractedData.schedule_details),
    preco_resumido: normalize(extractedData.price_summary),
    pdf_original: relativePath,
    pdf_url: relativePath ? `/uploads/${relativePath.replace(/\\/g, '/')}` : null,
    landing_page: null,
    inscricao_url: null,
    tags: Array.isArray(extractedData.tags) ? extractedData.tags : [],
    badges: Array.isArray(extractedData.badges) ? extractedData.badges : [],
    deliverables: Array.isArray(extractedData.deliverables)
      ? extractedData.deliverables
      : ['Certificado'],
    related_ids: [],
    motivos_participar: Array.isArray(extractedData.motivos_participar)
      ? extractedData.motivos_participar
      : Array.isArray(extractedData.reasons_to_attend)
      ? extractedData.reasons_to_attend
      : [],
    orientacoes_inscricao: Array.isArray(extractedData.orientacoes_inscricao)
      ? extractedData.orientacoes_inscricao
      : Array.isArray(extractedData.registration_guidelines)
      ? extractedData.registration_guidelines
      : [],
    contatos: contactos,
    views_count: 0,
    clicks_count: 0,
    conversions_count: 0,
    cor_categoria: null,
    icone: null,
    imagem_capa: null,
    status: DEFAULT_UPLOAD_STATUS,
    published_at: (DEFAULT_UPLOAD_STATUS === 'published') ? new Date() : null,
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
      return res.apiError('Arquivo nao encontrado no payload', 400, 'UPLOAD_MISSING_FILE');
    }

    const { courseId } = req.body;
    let savedUpload = null;
    let courseRecord = null;

    console.log('[upload] Processando PDF com IA...');
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

    console.log(extraction.success ? '[upload] PDF processado com sucesso!' : '[upload] Erro ao processar PDF');

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
      extraction.success ? 'Upload e processamento concluidos' : 'Upload realizado mas falhou processamento'
    );
  } catch (error) {
    console.error('Erro no upload:', error);
    next(error);
  }
});

module.exports = router;




