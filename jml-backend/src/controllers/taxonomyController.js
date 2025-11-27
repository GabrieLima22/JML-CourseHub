const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

const DEFAULT_TAXONOMIES = {
  companies: [
    { id: 'JML', label: 'JML', color: '#7c3aed', description: 'Linha principal da JML' },
    { id: 'Conecta', label: 'Conecta', color: '#6366f1', description: 'Vertente Conecta' },
  ],
  courseTypes: [
    { id: 'aberto', label: 'Aberto', description: 'Turmas abertas com matrícula individual' },
    { id: 'incompany', label: 'InCompany', description: 'Formatos exclusivos para uma organização' },
    { id: 'ead', label: 'EAD', description: '100% online e assíncrono' },
    { id: 'hibrido', label: 'Híbrido', description: 'Combina online e presencial' },
  ],
  segments: [
    { id: 'Estatais', label: 'Estatais' },
    { id: 'Judiciário', label: 'Judiciário' },
    { id: 'Sistema S', label: 'Sistema S' },
  ],
  audiences: [
    { id: 'gestores', label: 'Gestores e lideranças' },
    { id: 'compras', label: 'Compras e licitações' },
    { id: 'juridico', label: 'Jurídico e conformidade' },
  ],
  levels: [
    { id: 'basico', label: 'Básico' },
    { id: 'intermediario', label: 'Intermediário' },
    { id: 'avancado', label: 'Avançado' },
  ],
  tags: ['licitações', 'contratos', 'compliance', 'gestão', 'liderança'],
};

const normalizeId = (value = '') =>
  slugify(String(value).trim(), { lower: true, strict: true }) || '';

const sanitizeOption = (option = {}) => {
  const label = String(option.label || option.name || '').trim();
  const id = normalizeId(option.id || label);
  if (!label || !id) return null;

  const sanitized = {
    id,
    label,
  };

  if (option.description) sanitized.description = String(option.description).trim();
  if (option.color) sanitized.color = String(option.color).trim();
  if (option.accent) sanitized.accent = String(option.accent).trim();

  return sanitized;
};

const buildTaxonomiesPayload = (payload = {}) => {
  const safeArray = (value) => (Array.isArray(value) ? value : []);

  const companies = safeArray(payload.companies)
    .map(sanitizeOption)
    .filter(Boolean);

  const courseTypes = safeArray(payload.courseTypes)
    .map(sanitizeOption)
    .filter(Boolean);

  const segments = safeArray(payload.segments)
    .map(sanitizeOption)
    .filter(Boolean);

  const audiences = safeArray(payload.audiences)
    .map(sanitizeOption)
    .filter(Boolean);

  const levels = safeArray(payload.levels)
    .map(sanitizeOption)
    .filter(Boolean);

  const tags = safeArray(payload.tags)
    .map((tag) => String(tag).trim())
    .filter(Boolean);

  const normalized = {
    companies: companies.length ? companies : DEFAULT_TAXONOMIES.companies,
    courseTypes: courseTypes.length ? courseTypes : DEFAULT_TAXONOMIES.courseTypes,
    segments: segments.length ? segments : DEFAULT_TAXONOMIES.segments,
    audiences: audiences.length ? audiences : DEFAULT_TAXONOMIES.audiences,
    levels: levels.length ? levels : DEFAULT_TAXONOMIES.levels,
    tags,
  };

  return normalized;
};

const ensureConfigExists = async () => {
  const existing = await prisma.config.findUnique({
    where: { key: 'catalog_taxonomies' },
  });

  if (existing) return existing;

  return prisma.config.create({
    data: {
      key: 'catalog_taxonomies',
      value: DEFAULT_TAXONOMIES,
      description: 'Taxonomias do catálogo (empresas, tipos, segmentos, audiências, níveis, tags sugeridas)',
    },
  });
};

const getTaxonomies = async (req, res) => {
  try {
    const config = await ensureConfigExists();
    const stored = config.value || {};

    const merged = {
      ...DEFAULT_TAXONOMIES,
      ...stored,
      companies: stored.companies || DEFAULT_TAXONOMIES.companies,
      courseTypes: stored.courseTypes || DEFAULT_TAXONOMIES.courseTypes,
      segments: stored.segments || DEFAULT_TAXONOMIES.segments,
      audiences: stored.audiences || DEFAULT_TAXONOMIES.audiences,
      levels: stored.levels || DEFAULT_TAXONOMIES.levels,
      tags: stored.tags || DEFAULT_TAXONOMIES.tags,
    };

    return res.apiResponse(merged, 'Taxonomias carregadas');
  } catch (error) {
    console.error('Erro ao buscar taxonomias', error);
    return res.apiError('Erro ao buscar taxonomias', 500, 'TAXONOMIES_FETCH_FAILED');
  }
};

const updateTaxonomies = async (req, res) => {
  try {
    const normalized = buildTaxonomiesPayload(req.body || {});

    const updated = await prisma.config.upsert({
      where: { key: 'catalog_taxonomies' },
      create: {
        key: 'catalog_taxonomies',
        value: normalized,
        description: 'Taxonomias do catálogo (empresas, tipos, segmentos, audiências, níveis, tags sugeridas)',
      },
      update: {
        value: normalized,
      },
    });

    return res.apiResponse(updated.value, 'Taxonomias atualizadas com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar taxonomias', error);
    return res.apiError('Erro ao atualizar taxonomias', 500, 'TAXONOMIES_UPDATE_FAILED');
  }
};

module.exports = {
  getTaxonomies,
  updateTaxonomies,
  DEFAULT_TAXONOMIES,
};
