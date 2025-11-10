const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Obtém estatísticas gerais do dashboard admin
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Buscar estatísticas em paralelo
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      totalAnalytics,
      totalUploads,
      recentUploads,
      coursesWithAI
    ] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { status: 'published' } }),
      prisma.course.count({ where: { status: 'draft' } }),
      prisma.analytics.count(),
      prisma.upload.count(),
      prisma.upload.count({
        where: {
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.course.count({
        where: {
          pdf_original: { not: null }
        }
      })
    ]);

    // Calcular visualizações e cliques totais
    const viewsClicks = await prisma.course.aggregate({
      _sum: {
        views_count: true,
        clicks_count: true,
        conversions_count: true
      }
    });

    // Taxa de conversão
    const conversionRate = viewsClicks._sum.clicks_count > 0
      ? ((viewsClicks._sum.conversions_count / viewsClicks._sum.clicks_count) * 100).toFixed(1)
      : 0;

    // Processos de IA em andamento
    const aiProcessing = await prisma.upload.count({
      where: {
        status: { in: ['processing', 'pending'] }
      }
    });

    res.json({
      overview: {
        totalCourses,
        publishedCourses,
        draftCourses,
        coursesWithAI,
        totalViews: viewsClicks._sum.views_count || 0,
        totalClicks: viewsClicks._sum.clicks_count || 0,
        totalConversions: viewsClicks._sum.conversions_count || 0,
        conversionRate: parseFloat(conversionRate)
      },
      system: {
        totalAnalytics,
        totalUploads,
        recentUploads,
        aiProcessing,
        uptime: process.uptime(), // em segundos
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

/**
 * Obtém atividades recentes do sistema
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Buscar uploads recentes
    const recentUploads = await prisma.upload.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            titulo: true,
            slug: true
          }
        }
      }
    });

    // Buscar cursos recentemente criados
    const recentCourses = await prisma.course.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        titulo: true,
        slug: true,
        status: true,
        created_at: true,
        empresa: true,
        tipo: true
      }
    });

    // Combinar e formatar atividades
    const activities = [];

    recentUploads.forEach(upload => {
      activities.push({
        type: 'upload',
        action: upload.status === 'completed' ? 'Upload processado' : 'Upload em andamento',
        title: upload.course?.titulo || upload.original_name,
        timestamp: upload.created_at,
        status: upload.status,
        metadata: {
          filename: upload.filename,
          size: upload.size,
          courseId: upload.course_id
        }
      });
    });

    recentCourses.forEach(course => {
      activities.push({
        type: 'course',
        action: course.status === 'published' ? 'Curso publicado' : 'Curso criado',
        title: course.titulo,
        timestamp: course.created_at,
        status: course.status,
        metadata: {
          empresa: course.empresa,
          tipo: course.tipo,
          slug: course.slug
        }
      });
    });

    // Ordenar por timestamp (mais recente primeiro)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      activities: activities.slice(0, limit)
    });
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
};

/**
 * Obtém estatísticas detalhadas para analytics
 */
exports.getDetailedAnalytics = async (req, res) => {
  try {
    const daysAgo = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Analytics por tipo de evento
    const eventsByType = await prisma.analytics.groupBy({
      by: ['event_type'],
      _count: true,
      where: {
        created_at: { gte: startDate }
      }
    });

    // Top cursos por visualizações
    const topCourses = await prisma.course.findMany({
      take: 10,
      orderBy: { views_count: 'desc' },
      where: {
        views_count: { gt: 0 }
      },
      select: {
        id: true,
        titulo: true,
        slug: true,
        views_count: true,
        clicks_count: true,
        conversions_count: true,
        empresa: true,
        tipo: true,
        categoria: true
      }
    });

    // Analytics por dia (últimos 30 dias)
    const dailyStats = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN event_type = 'search' THEN 1 END) as searches
      FROM analytics
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Distribuição por segmento
    const bySegment = await prisma.course.groupBy({
      by: ['segmento'],
      _count: true,
      _sum: {
        views_count: true,
        clicks_count: true
      }
    });

    // Distribuição por empresa
    const byCompany = await prisma.course.groupBy({
      by: ['empresa'],
      _count: true,
      _sum: {
        views_count: true,
        clicks_count: true
      }
    });

    res.json({
      period: {
        days: daysAgo,
        startDate,
        endDate: new Date()
      },
      eventsByType: eventsByType.map(e => ({
        type: e.event_type,
        count: e._count
      })),
      topCourses,
      dailyStats,
      bySegment: bySegment.map(s => ({
        segmento: s.segmento,
        courses: s._count,
        views: s._sum.views_count || 0,
        clicks: s._sum.clicks_count || 0
      })),
      byCompany: byCompany.map(c => ({
        empresa: c.empresa,
        courses: c._count,
        views: c._sum.views_count || 0,
        clicks: c._sum.clicks_count || 0
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar analytics detalhados:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
};

/**
 * Obtém métricas de impacto da IA
 */
exports.getAIMetrics = async (req, res) => {
  try {
    // Cursos criados com IA (que têm PDF original)
    const coursesWithAI = await prisma.course.count({
      where: {
        pdf_original: { not: null }
      }
    });

    const totalCourses = await prisma.course.count();

    // Uploads processados
    const uploads = await prisma.upload.findMany({
      select: {
        status: true,
        processing_time: true,
        ai_confidence: true,
        created_at: true,
        manual_review: true
      }
    });

    const completedUploads = uploads.filter(u => u.status === 'completed');
    const avgProcessingTime = completedUploads.length > 0
      ? completedUploads.reduce((sum, u) => sum + (u.processing_time || 0), 0) / completedUploads.length
      : 0;

    const avgConfidence = completedUploads.length > 0
      ? completedUploads.reduce((sum, u) => sum + (u.ai_confidence || 0), 0) / completedUploads.length
      : 0;

    const manualReviewCount = uploads.filter(u => u.manual_review).length;

    // Calcular economias de tempo (estimativa: sem IA = 30min, com IA = tempo de processamento)
    const timeWithoutAI = completedUploads.length * 30; // minutos
    const timeWithAI = avgProcessingTime * completedUploads.length / 60000; // converter ms para minutos
    const timeSaved = timeWithoutAI - timeWithAI;

    // Taxa de precisão (baseada em confiança e necessidade de revisão manual)
    const accuracyRate = (avgConfidence * 100).toFixed(1);

    // Redução de erros (estimativa: revisão manual indica potencial erro)
    const errorReduction = completedUploads.length > 0
      ? (((completedUploads.length - manualReviewCount) / completedUploads.length) * 100).toFixed(1)
      : 0;

    // Ganho de produtividade
    const productivityGain = timeWithoutAI > 0
      ? ((timeSaved / timeWithoutAI) * 100).toFixed(1)
      : 0;

    // Tendências por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as uploads,
        AVG(processing_time) as avg_time,
        AVG(ai_confidence) as avg_confidence
      FROM uploads
      WHERE created_at >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    res.json({
      overview: {
        coursesCreatedByAI: coursesWithAI,
        totalCourses,
        percentage: ((coursesWithAI / totalCourses) * 100).toFixed(1),
        totalUploads: uploads.length,
        completedUploads: completedUploads.length,
        pendingUploads: uploads.filter(u => u.status === 'pending').length,
        processingUploads: uploads.filter(u => u.status === 'processing').length
      },
      performance: {
        avgProcessingTime: (avgProcessingTime / 1000).toFixed(2), // segundos
        avgConfidence: parseFloat((avgConfidence * 100).toFixed(1)),
        accuracyRate: parseFloat(accuracyRate),
        errorReduction: parseFloat(errorReduction),
        manualReviewRate: ((manualReviewCount / uploads.length) * 100).toFixed(1)
      },
      impact: {
        timeSaved: Math.round(timeSaved), // minutos
        timeWithoutAI,
        timeWithAI: Math.round(timeWithAI),
        productivityGain: parseFloat(productivityGain),
        costSavings: Math.round(timeSaved * 0.5) // estimativa: R$0.50 por minuto
      },
      trends: monthlyTrends.map(t => ({
        month: t.month,
        uploads: Number(t.uploads),
        avgTime: Number(t.avg_time) / 1000, // segundos
        avgConfidence: parseFloat((Number(t.avg_confidence) * 100).toFixed(1))
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar métricas de IA:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas de IA' });
  }
};
