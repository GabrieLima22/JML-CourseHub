// src/controllers/coursesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 🎨 Design Pattern: Consistent response structure

// 📋 GET /api/courses - Lista todos os cursos (para o frontend público)
const getAllCourses = async (req, res) => {
  try {
    const { 
      empresa, 
      tipo, 
      categoria, 
      segmento, 
      nivel,
      search,
      page = 1, 
      limit = 20,
      status = 'published'
    } = req.query;

    // Filtros din�micos (design: interface de filtros)
    const filters = {
      ...(status && status !== 'all' && { status }),
      ...(empresa && { empresa }),
      ...(tipo && { tipo }),
      ...(categoria && { categoria }),
      ...(segmento && { segmento }),
      ...(nivel && { nivel })
    };

    // 🔎 Busca por texto (design: search bar)
    if (search) {
      filters.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search.toLowerCase()] } }
      ];
    }

    // 📊 Paginação (design: pagination component)
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // 🎯 Query otimizada
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: filters,
        select: {
          id: true,
          titulo: true,
          slug: true,
          empresa: true,
          tipo: true,
          categoria: true,
          segmento: true,
          modalidade: true,
          summary: true,
          nivel: true,
          carga_horaria: true,
          investimento: true,
          tags: true,
          deliverables: true,
          related_ids: true,
          views_count: true,
          destaque: true,
          novo: true,
          cor_categoria: true,
          icone: true,
          imagem_capa: true,
          landing_page: true,
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

    // 📈 Incrementar views (analytics)
    await prisma.analytics.create({
      data: {
        event_type: 'courses_list_view',
        filters_used: filters,
        user_agent: req.get('User-Agent'),
        ip_address: req.ip
      }
    }).catch(() => {}); // Não falhar se analytics der erro

    // 🎨 Response design: útil para o frontend
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
    console.error('❌ Error in getAllCourses:', error);
    res.apiError('Erro ao buscar cursos', 500, 'COURSES_FETCH_ERROR');
  }
};

// 🎯 GET /api/courses/:id - Detalhes de um curso
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
      return res.apiError('Curso não disponível', 403, 'COURSE_NOT_AVAILABLE');
    }

    // 📈 Incrementar view count (design: analytics dashboard)
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
    console.error('❌ Error in getCourseById:', error);
    res.apiError('Erro ao buscar detalhes do curso', 500, 'COURSE_DETAIL_ERROR');
  }
};

// 🔗 GET /api/courses/:id/related - Cursos relacionados
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

    // 🎯 Lógica de relacionados (design: recomendações inteligentes)
    let relatedCourses = [];

    // 1. Cursos específicos relacionados
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
          nivel: true,
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
          nivel: true,
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
    console.error('❌ Error in getRelatedCourses:', error);
    res.apiError('Erro ao buscar cursos relacionados', 500, 'RELATED_COURSES_ERROR');
  }
};

// 📊 GET /api/courses/stats - Estatísticas para o frontend
const getCourseStats = async (req, res) => {
  try {
    const stats = await prisma.course.groupBy({
      by: ['empresa', 'tipo', 'categoria'],
      where: { status: 'published' },
      _count: true
    });

    // 🎨 Formatar para componentes visuais
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

    res.apiResponse(formatted, 'Estatísticas carregadas');

  } catch (error) {
    console.error('❌ Error in getCourseStats:', error);
    res.apiError('Erro ao carregar estatísticas', 500, 'STATS_ERROR');
  }
};

// 🔍 GET /api/courses/search/suggestions - Sugestões de busca
const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.apiResponse({ suggestions: [] }, 'Query muito curta');
    }

    // 🎯 Busca em títulos e tags
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

    // 🏷️ Extrair tags relevantes
    const relevantTags = suggestions
      .flatMap(course => course.tags || [])
      .filter(tag => tag.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5);

    res.apiResponse({
      courses: suggestions,
      tags: [...new Set(relevantTags)],
      query: q
    }, `${suggestions.length} sugestões encontradas`);

  } catch (error) {
    console.error('❌ Error in getSearchSuggestions:', error);
    res.apiError('Erro ao buscar sugestões', 500, 'SUGGESTIONS_ERROR');
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getRelatedCourses,
  getCourseStats,
  getSearchSuggestions
};
