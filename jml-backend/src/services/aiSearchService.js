// src/services/aiSearchService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Garante que a API Key existe
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn("⚠️ AVISO: GOOGLE_API_KEY não configurada.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

// --- CACHE EM MEMÓRIA (Solução B) ---
// Estrutura simples para guardar resultados recentes e economizar tokens
const searchCache = new Map();
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

function getFromCache(key) {
  const cached = searchCache.get(key);
  if (!cached) return null;

  // Verifica se expirou
  if (Date.now() - cached.timestamp > CACHE_DURATION_MS) {
    searchCache.delete(key);
    return null;
  }
  return cached.data;
}

function saveToCache(key, data) {
  // Limpeza preventiva se o cache ficar gigante (> 1000 termos)
  if (searchCache.size > 1000) {
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }
  searchCache.set(key, {
    timestamp: Date.now(),
    data: data
  });
}

// --- FIM DO CACHE ---

function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function expandSearchQuery(query) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Atue como um Especialista em Vendas de Cursos Corporativos e Jurídicos (JML/Conecta).
      Contexto: Um consultor comercial está atendendo um cliente e digitou: "${query}".

      Sua missão:
      1. Identificar a "Dor" ou "Necessidade" técnica por trás do pedido.
      2. Gerar palavras-chave técnicas, sinônimos, siglas (ex: TCU, AGU) e leis associadas.
      3. Identificar cargos que compram esse tipo de solução.

      Retorne APENAS um JSON:
      {
        "expandedTerms": ["termo1", "termo2", ...],
        "intent": "Resumo da necessidade em uma frase",
        "targetRoles": ["cargo1", "cargo2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonString = response.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error('Erro na IA (Fallback local):', error.message);
    return {
      expandedTerms: [query, ...query.split(' ')],
      searchIntent: query,
      targetRoles: []
    };
  }
}

function extractCourseText(course) {
  const join = (arr) => Array.isArray(arr) ? arr.join(' ') : (arr || '');
  
  // Extração robusta de todos os campos novos do Admin
  const parts = [
    course.titulo,
    course.titulo_complemento,
    course.categoria,
    course.segmento,
    join(course.segmentos_adicionais),
    join(course.tags),
    join(course.badges),
    course.summary,
    course.description,
    course.apresentacao,
    course.metodologia,
    // Programação e Conteúdo Técnico
    Array.isArray(course.programacao) 
      ? course.programacao.map(p => `${p.title || ''} ${p.description || ''} ${join(p.topics)}`).join(' ') 
      : '',
    // Argumentos de Venda (Novos campos)
    join(course.objetivos),
    join(course.aprendizados),
    join(course.motivos_participar),
    join(course.vantagens),
    join(course.vantagens_ead),
    join(course.publico_alvo),
    // Custom Fields
    course.custom_fields ? Object.values(course.custom_fields).join(' ') : ''
  ];

  return normalizeText(parts.filter(Boolean).join(' '));
}

function calculateRelevanceScore(course, courseText, aiContext) {
  let score = 0;
  const { expandedTerms, targetRoles } = aiContext;
  
  // Normaliza tokens do curso
  const courseTokens = new Set(courseText.split(/\s+/)); 

  // 1. Match de Palavras-Chave (IA)
  expandedTerms.forEach((term, index) => {
    const normalizedTerm = normalizeText(term);
    const importance = 1 + (1 / (index + 1)); 

    if (courseText.includes(normalizedTerm)) {
      score += 15 * importance; // Match exato na frase
    }

    const termWords = normalizedTerm.split(/\s+/);
    termWords.forEach(word => {
      // Aceita palavras curtas se forem siglas conhecidas ou > 2 letras
      if ((word.length > 2 || ['tcu','agu','stf','rh','ti'].includes(word)) && courseTokens.has(word)) {
        score += 5 * importance;
      }
    });
  });

  // 2. Match de Público-Alvo (Peso Crítico para Venda)
  if (targetRoles && targetRoles.length > 0) {
    const publicoAlvoTexto = normalizeText(Array.isArray(course.publico_alvo) ? course.publico_alvo.join(' ') : course.publico_alvo || '');
    targetRoles.forEach(role => {
      if (publicoAlvoTexto.includes(normalizeText(role))) {
        score += 20;
      }
    });
  }

  return score;
}

async function aiSearch(query, filters = {}) {
  try {
    // 1. Verifica Cache (Economia de $$)
    const cacheKey = `search:${normalizeText(query)}:${JSON.stringify(filters)}`;
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      console.log('⚡ Cache Hit: Retornando resultado da memória para:', query);
      return cachedResult;
    }

    // 2. Se não estiver em cache, chama a IA
    console.log('🤖 IA Call: Processando nova busca para:', query);
    const aiContext = await expandSearchQuery(query);

    const whereClause = {
      status: 'published',
      ...(filters.empresa && { empresa: filters.empresa }),
      ...(filters.tipo && { tipo: filters.tipo }),
      ...(filters.segmento && { segmento: filters.segmento })
    };

    const allCourses = await prisma.course.findMany({
      where: whereClause,
      // Seleciona todos os campos necessários para o cálculo de relevância
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
        summary: true,
        description: true,
        apresentacao: true,
        objetivos: true,
        publico_alvo: true,
        aprendizados: true,
        tags: true,
        badges: true,
        programacao: true,
        metodologia: true,
        palestrantes: true,
        professores: true,
        custom_fields: true,
        motivos_participar: true,
        vantagens: true,
        vantagens_ead: true,
        carga_horaria: true,
        imagem_capa: true,
        cor_categoria: true,
        destaque: true,
        novo: true,
        landing_page: true,
        pdf_url: true,
        related_ids: true
      }
    });

    const scoredCourses = allCourses.map(course => {
      const fullText = extractCourseText(course);
      const score = calculateRelevanceScore(course, fullText, aiContext);
      return {
        ...course,
        _aiScore: score,
        _matchedTerms: aiContext.expandedTerms.filter(term => fullText.includes(normalizeText(term))).slice(0, 3)
      };
    });

    const minScore = 10; 
    const results = scoredCourses
      .filter(c => c._aiScore >= minScore)
      .sort((a, b) => b._aiScore - a._aiScore);

    const finalResponse = {
      query: {
        original: query,
        intent: aiContext.searchIntent,
        categories: aiContext.targetRoles
      },
      results: results,
      meta: {
        totalFound: results.length,
        totalSearched: allCourses.length,
        maxScore: results.length > 0 ? results[0]._aiScore : 0
      }
    };

    // 3. Salva no Cache antes de retornar
    saveToCache(cacheKey, finalResponse);

    return finalResponse;

  } catch (error) {
    console.error('❌ Erro crítico no aiSearch:', error);
    throw error;
  }
}

module.exports = {
  aiSearch,
  expandSearchQuery
};