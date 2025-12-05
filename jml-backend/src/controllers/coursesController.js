// src/controllers/coursesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ðŸŽ¨ Design Pattern: Consistent response structure

// ðŸ“‹ GET /api/courses - Lista todos os cursos (para o frontend público)
const getAllCourses = async (req, res) => {
  try {
    const { 
      empresa,
      tipo,
      categoria,
      segmento,
      search,
      page = 1, 
      limit = 20,
      status = 'published'
    } = req.query;

    // Filtros dinâmicos (design: interface de filtros)
    const filters = {
      ...(status && status !== 'all' && { status }),
      ...(empresa && { empresa }),
      ...(tipo && { tipo }),
      ...(categoria && { categoria }),
      ...(segmento && { segmento })
    };

    // ðŸ”Ž Busca por texto (design: search bar)
    if (search) {
      filters.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } }
      ];
    }

    // ðŸ“Š Paginação (design: pagination component)
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // ðŸŽ¯ Query otimizada
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: filters,
        select: {
          id: true,
          titulo: true,
          titulo_complemento: true,
          slug: true,
          empresa: true,
          tipo: true,
          categoria: true,
          segmento: true,
          segmentos_adicionais: true,
          modalidade: true,
          data_inicio: true,
          data_fim: true,
          local: true,
          endereco_completo: true,
          summary: true,
          description: true,
          apresentacao: true,
          objetivos: true,
          publico_alvo: true,
          aprendizados: true,
          vantagens: true,
          vantagens_ead: true,
          programacao: true,
          metodologia: true,
          logistica_detalhes: true,
          carga_horaria: true,
          investimento: true,
          preco_resumido: true,
          preco_online: true,
          preco_presencial: true,
          preco_incompany: true,
          forma_pagamento: true,
          tags: true,
          badges: true,
          deliverables: true,
          related_ids: true,
          motivos_participar: true,
          orientacoes_inscricao: true,
          contatos: true,
          custom_schema: true,
          custom_fields: true,
          palestrantes: true,
          coordenacao: true,
          landing_page: true,
          inscricao_url: true,
          pdf_url: true,
          status: true,
          views_count: true,
          destaque: true,
          novo: true,
          cor_categoria: true,
          icone: true,
          imagem_capa: true,
          created_at: true,
          published_at: true
        },
        orderBy: [
          { destaque: 'desc' },
          { published_at: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take
      }),
      prisma.course.count({ where: filters })
    ]);

    // ðŸ“ˆ Incrementar views (analytics)
    await prisma.analytics.create({
      data: {
        event_type: 'courses_list_view',
        filters_used: filters,
        user_agent: req.get('User-Agent'),
        ip_address: req.ip
      }
    }).catch(() => {}); // Não falhar se analytics der erro

    // ðŸŽ¨ Response design: útil para o frontend
    res.apiResponse({
      courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasNext: skip + take < total,
        hasPrev: Number(page) > 1
      },
      filters: filters,
      meta: {
        totalPublished: total,
        featuredCount: courses.filter(c => c.destaque).length,
        newCount: courses.filter(c => c.novo).length
      }
    }, `${courses.length} cursos encontrados`);

  } catch (error) {
    console.error('âŒ Error in getAllCourses:', error);
    res.apiError('Erro ao buscar cursos', 500, 'COURSES_FETCH_ERROR');
  }
};

// ðŸŽ¯ GET /api/courses/:id - Detalhes de um curso
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { increment_view = true } = req.query;

    const course = await prisma.course.findFirst({
      where: { 
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        uploads: {
          where: { status: 'completed' },
          select: {
            id: true,
            filename: true,
            original_name: true,
            path: true,
            size: true
          }
        }
      }
    });

    if (!course) {
      return res.apiError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');
    }

    if (course.status !== 'published') {
      return res.apiError('Curso não disponÃ­vel', 403, 'COURSE_NOT_AVAILABLE');
    }

    // ðŸ“ˆ Incrementar view count (design: analytics dashboard)
    if (increment_view === 'true') {
      await Promise.all([
        prisma.course.update({
          where: { id: course.id },
          data: { views_count: { increment: 1 } }
        }),
        prisma.analytics.create({
          data: {
            event_type: 'course_view',
            course_id: course.id,
            user_agent: req.get('User-Agent'),
            ip_address: req.ip,
            referrer: req.get('Referer')
          }
        })
      ]).catch(() => {}); // Não falhar se analytics der erro
    }

    res.apiResponse(course, 'Detalhes do curso carregados');

  } catch (error) {
    console.error('âŒ Error in getCourseById:', error);
    res.apiError('Erro ao buscar detalhes do curso', 500, 'COURSE_DETAIL_ERROR');
  }
};

// ðŸ”— GET /api/courses/:id/related - Cursos relacionados
const getRelatedCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    const course = await prisma.course.findFirst({
      where: { 
        OR: [
          { id },
          { slug: id }
        ]
      },
      select: { id: true, related_ids: true, categoria: true, tipo: true, tags: true }
    });

    if (!course) {
      return res.apiError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');
    }

    // ðŸŽ¯ Lógica de relacionados (design: recomendaçÃµes inteligentes)
    let relatedCourses = [];

    // 1. Cursos especÃ­ficos relacionados
    if (course.related_ids?.length > 0) {
      relatedCourses = await prisma.course.findMany({
        where: {
          id: { in: course.related_ids },
          status: 'published'
        },
        select: {
          id: true,
          titulo: true,
          slug: true,
          empresa: true,
          tipo: true,
          summary: true,
          carga_horaria: true,
          investimento: true,
          imagem_capa: true,
          cor_categoria: true
        },
        take: Number(limit)
      });
    }

    // 2. Se não tiver suficientes, buscar por categoria/tipo
    if (relatedCourses.length < Number(limit)) {
      const remaining = Number(limit) - relatedCourses.length;
      const excludeIds = [course.id, ...relatedCourses.map(c => c.id)];

      const additionalCourses = await prisma.course.findMany({
        where: {
          id: { notIn: excludeIds },
          status: 'published',
          OR: [
            { categoria: course.categoria },
            { tipo: course.tipo },
            { tags: { hasSome: course.tags || [] } }
          ]
        },
        select: {
          id: true,
          titulo: true,
          slug: true,
          empresa: true,
          tipo: true,
          summary: true,
          carga_horaria: true,
          investimento: true,
          imagem_capa: true,
          cor_categoria: true
        },
        take: remaining,
        orderBy: { views_count: 'desc' }
      });

      relatedCourses = [...relatedCourses, ...additionalCourses];
    }

    res.apiResponse({
      related: relatedCourses,
      count: relatedCourses.length,
      basedOn: course.related_ids?.length > 0 ? 'specific' : 'algorithm'
    }, `${relatedCourses.length} cursos relacionados encontrados`);

  } catch (error) {
    console.error('âŒ Error in getRelatedCourses:', error);
    res.apiError('Erro ao buscar cursos relacionados', 500, 'RELATED_COURSES_ERROR');
  }
};

// ðŸ“Š GET /api/courses/stats - EstatÃ­sticas para o frontend
const getCourseStats = async (req, res) => {
  try {
    const stats = await prisma.course.groupBy({
      by: ['empresa', 'tipo', 'categoria'],
      where: { status: 'published' },
      _count: true
    });

    // ðŸŽ¨ Formatar para componentes visuais
    const formatted = {
      byEmpresa: {},
      byTipo: {},
      byCategoria: {},
      total: 0
    };

    stats.forEach(stat => {
      formatted.byEmpresa[stat.empresa] = (formatted.byEmpresa[stat.empresa] || 0) + stat._count;
      formatted.byTipo[stat.tipo] = (formatted.byTipo[stat.tipo] || 0) + stat._count;
      formatted.byCategoria[stat.categoria] = (formatted.byCategoria[stat.categoria] || 0) + stat._count;
      formatted.total += stat._count;
    });

    res.apiResponse(formatted, 'EstatÃ­sticas carregadas');

  } catch (error) {
    console.error('âŒ Error in getCourseStats:', error);
    res.apiError('Erro ao carregar estatÃ­sticas', 500, 'STATS_ERROR');
  }
};

// ðŸ” GET /api/courses/search/suggestions - SugestÃµes de busca
const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.apiResponse({ suggestions: [] }, 'Query muito curta');
    }

    // ðŸŽ¯ Busca em tÃ­tulos e tags
    const suggestions = await prisma.course.findMany({
      where: {
        status: 'published',
        OR: [
          { titulo: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q.toLowerCase()] } }
        ]
      },
      select: {
        id: true,
        titulo: true,
        slug: true,
        tipo: true,
        empresa: true,
        tags: true
      },
      take: 8,
      orderBy: { views_count: 'desc' }
    });

    // ðŸ·ï¸ Extrair tags relevantes
    const relevantTags = suggestions
      .flatMap(course => course.tags || [])
      .filter(tag => tag.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5);

    res.apiResponse({
      courses: suggestions,
      tags: [...new Set(relevantTags)],
      query: q
    }, `${suggestions.length} sugestÃµes encontradas`);

  } catch (error) {
    console.error('âŒ Error in getSearchSuggestions:', error);
    res.apiError('Erro ao buscar sugestÃµes', 500, 'SUGGESTIONS_ERROR');
  }
};

// 🤖 POST /api/courses/ai-search - Busca inteligente com IA
const aiSearch = async (req, res) => {
  try {
    const { q, empresa, tipo, categoria, segmento } = req.body;

    if (!q || q.trim().length < 2) {
      return res.apiError('Query muito curta', 400, 'INVALID_QUERY');
    }

    const aiSearchService = require('../services/aiSearchService');

    const filters = {
      ...(empresa && { empresa }),
      ...(tipo && { tipo }),
      ...(categoria && { categoria }),
      ...(segmento && { segmento })
    };

    const searchResults = await aiSearchService.aiSearch(q, filters);

    // 📈 Registrar analytics
    await prisma.analytics.create({
      data: {
        event_type: 'ai_search',
        search_query: q,
        filters_used: filters,
        user_agent: req.get('User-Agent'),
        ip_address: req.ip
      }
    }).catch(() => {}); // Não falhar se analytics der erro

    res.apiResponse(searchResults, `Busca IA concluída: ${searchResults.results.length} resultados relevantes`);

  } catch (error) {
    console.error('❌ Error in aiSearch:', error);
    res.apiError('Erro na busca com IA', 500, 'AI_SEARCH_ERROR');
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getRelatedCourses,
  getCourseStats,
  getSearchSuggestions,
  aiSearch,
};


// --- New admin write endpoints ---
const writeSelectableFields = [
  'titulo',
  'titulo_complemento',
  'slug',
  'categoria',
  'empresa',
  'tipo',
  'modalidade',
  'segmento',
  'segmentos_adicionais',
  'data_inicio',
  'data_fim',
  'local',
  'endereco_completo',
  'carga_horaria',
  'summary',
  'description',
  'apresentacao',
  'objetivos',
  'aprendizados',
  'publico_alvo',
  'vantagens',
  'vantagens_ead',
  'target_audience',
  'nivel',
  'professores',
  'palestrantes',
  'coordenacao',
  'investimento',
  'preco_resumido',
  'preco_online',
  'preco_presencial',
  'preco_incompany',
  'forma_pagamento',
  'programacao',
  'metodologia',
  'logistica_detalhes',
  'pdf_original',
  'pdf_url',
  'landing_page',
  'inscricao_url',
  'tags',
  'badges',
  'deliverables',
  'related_ids',
  'motivos_participar',
  'orientacoes_inscricao',
  'contatos',
  'custom_fields',
  'custom_schema',
  'cor_categoria',
  'icone',
  'imagem_capa',
  'destaque',
  'novo',
  'status'
];

const pickWritable = body => Object.fromEntries(
  Object.entries(body || {}).filter(([k]) => writeSelectableFields.includes(k))
);

async function createCourse(req, res){
  try{
    const data = pickWritable(req.body);
    if(!data.titulo){
      return res.apiError('Campo titulo é obrigatório',400,'VALIDATION_ERROR');
    }
    data.slug = data.slug && data.slug.trim() ? data.slug : (data.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-') || `curso-${Date.now()}`;
    data.status = data.status || 'draft';
    data.published_at = data.status === 'published' ? new Date() : null;
    const created = await prisma.course.create({ data });
    return res.apiResponse(created,'Curso criado');
  }catch(error){
    console.error('Erro em createCourse', error);
    return res.apiError('Erro ao criar curso',500,'COURSE_CREATE_ERROR');
  }
}

async function updateCourse(req, res){
  try{
    const { id } = req.params;
    const data = pickWritable(req.body);
    if(data.slug === '') delete data.slug;
    if(typeof data.status === 'string'){
      data.published_at = data.status === 'published' ? new Date() : null;
    }
    const updated = await prisma.course.update({ where: { id }, data });
    return res.apiResponse(updated,'Curso atualizado');
  }catch(error){
    console.error('Erro em updateCourse', error);
    const message = error?.message || 'Erro ao atualizar curso';
    return res.apiError(message,500,'COURSE_UPDATE_ERROR');
  }
}

async function setCourseStatus(req,res){
  try{
    const { id } = req.params;
    const { status } = req.body || {};
    if(!['draft','published','archived'].includes(status)){
      return res.apiError('Status inválido',400,'INVALID_STATUS');
    }
    const updated = await prisma.course.update({
      where:{ id },
      data:{ status, published_at: status==='published'? new Date(): null }
    });
    return res.apiResponse(updated,'Status atualizado');
  }catch(error){
    console.error('Erro em setCourseStatus', error);
    return res.apiError('Erro ao alterar status',500,'COURSE_STATUS_ERROR');
  }
}

async function deleteCourse(req, res) {
  try {
    const { id } = req.params;

    // Verificar se o curso existe
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.apiError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');
    }

    // Deletar o curso
    await prisma.course.delete({ where: { id } });

    return res.apiResponse({ id }, 'Curso deletado com sucesso');
  } catch (error) {
    console.error('Erro em deleteCourse', error);
    return res.apiError('Erro ao deletar curso', 500, 'COURSE_DELETE_ERROR');
  }
}

module.exports.createCourse = createCourse;
module.exports.updateCourse = updateCourse;
module.exports.setCourseStatus = setCourseStatus;
module.exports.deleteCourse = deleteCourse;
