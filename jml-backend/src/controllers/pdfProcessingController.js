const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extrai e processa dados de um PDF de curso
 */
async function extractCourseDataFromPDF(pdfPath) {
  try {
    // Ler o arquivo PDF
    const dataBuffer = await fs.readFile(pdfPath);

    // Extrair texto do PDF
    const pdfData = await pdfParse(dataBuffer);
    const fullText = pdfData.text;

    console.log('📄 Extraindo dados do PDF...');
    console.log(`Total de páginas: ${pdfData.numpages}`);
    console.log(`Caracteres extraídos: ${fullText.length}`);

    // Processar o texto para extrair metadados
    const extractedData = await analyzePDFContent(fullText);

    return {
      success: true,
      data: extractedData,
      rawText: fullText,
      metadata: {
        pages: pdfData.numpages,
        size: dataBuffer.length
      }
    };
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Analisa o conteúdo do PDF e extrai informações estruturadas
 */
async function analyzePDFContent(text) {
  // Limpar e normalizar o texto
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  // Extrair título (geralmente está no início, em maiúsculas ou destaque)
  const title = extractTitle(lines, cleanText);

  // Extrair carga horária
  const duration = extractDuration(cleanText);

  // Extrair nível
  const level = extractLevel(cleanText);

  // Identificar segmento (Sistema S, Judiciário, Estatais)
  const segment = identifySegment(cleanText);

  // Extrair empresa (JML ou Conecta)
  const company = identifyCompany(cleanText);

  // Extrair tipo de curso (aberto, incompany, ead, hibrido)
  const courseType = identifyCourseType(cleanText);

  // Extrair modalidade
  const modality = buildModality(company, courseType);

  // Extrair resumo (primeiros parágrafos significativos)
  const summary = extractSummary(cleanText);

  // Extrair descrição/programação
  const description = extractDescription(cleanText);

  // Extrair tags relevantes
  const tags = extractTags(cleanText);

  // Extrair público-alvo
  const targetAudience = extractTargetAudience(cleanText);

  // Extrair objetivos
  const objectives = extractObjectives(cleanText);

  // Calcular confiança baseado na quantidade de dados extraídos
  const confidence = calculateConfidence({
    title,
    duration,
    level,
    segment,
    summary,
    description
  });

  return {
    title: title || 'Curso Extraído do PDF',
    area: segment,
    categoria: segment,
    empresa: company,
    tipo: courseType,
    modalidade: modality,
    segmento: segment,
    summary: summary || 'Resumo não identificado no PDF',
    description: description || 'Descrição não identificada no PDF',
    duration_hours: duration || 8,
    nivel: level || 'Intermediário',
    level: level || 'Intermediário',
    tags: tags,
    target_audience: targetAudience,
    publico_alvo: targetAudience,
    objetivos: objectives,
    deliverables: ['Certificado', 'Material didático'],
    confidence: confidence
  };
}

/**
 * Extrai o título do curso
 */
function extractTitle(lines, text) {
  // Procurar por padrões comuns de título
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();

    // Títulos geralmente têm entre 10 e 150 caracteres
    if (line.length > 10 && line.length < 150) {
      // Ignorar linhas que parecem ser cabeçalhos ou rodapés
      if (!line.match(/página|page|\d+\/\d+|www\.|@|tel:|fone:/i)) {
        // Se tiver palavras em maiúsculas ou for linha significativa
        if (line === line.toUpperCase() || line.match(/curso|capacitação|treinamento|formação/i)) {
          return line;
        }
      }
    }
  }

  // Fallback: procurar por "curso de" ou similar
  const courseMatch = text.match(/(?:curso|capacitação|treinamento|formação)[\s:]+([^\n.]+)/i);
  if (courseMatch) {
    return courseMatch[1].trim();
  }

  return lines[0]?.trim() || null;
}

/**
 * Extrai a carga horária
 */
function extractDuration(text) {
  // Padrões: "16h", "16 horas", "carga horária: 16h", etc
  const patterns = [
    /(?:carga\s*horária|duração)[\s:]+(\d+)\s*h(?:oras)?/i,
    /(\d+)\s*(?:horas|hrs|h)\s*(?:aula|curso)?/i,
    /(\d+)\s*h\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const hours = parseInt(match[1]);
      if (hours >= 1 && hours <= 200) {
        return hours;
      }
    }
  }

  return null;
}

/**
 * Extrai o nível do curso
 */
function extractLevel(text) {
  const textLower = text.toLowerCase();

  if (textLower.includes('avançado') || textLower.includes('avancado')) {
    return 'Avançado';
  }
  if (textLower.includes('intermediário') || textLower.includes('intermediario')) {
    return 'Intermediário';
  }
  if (textLower.includes('básico') || textLower.includes('basico') || textLower.includes('inicial')) {
    return 'Básico';
  }

  return null;
}

/**
 * Identifica o segmento do curso
 */
function identifySegment(text) {
  const textLower = text.toLowerCase();

  // Sistema S
  if (textLower.match(/sesi|senai|sesc|senac|sebrae|senar|sest|senat|sistema\s*s/i)) {
    return 'Sistema S';
  }

  // Judiciário
  if (textLower.match(/judiciário|judiciario|tribunal|juiz|juíza|magistrado|justiça|judicial/i)) {
    return 'Judiciário';
  }

  // Estatais
  if (textLower.match(/estatal|estatais|empresa\s*pública|pública|publica|setor\s*público|administração\s*pública/i)) {
    return 'Estatais';
  }

  // Default
  return 'Sistema S';
}

/**
 * Identifica a empresa (JML ou Conecta)
 */
function identifyCompany(text) {
  const textLower = text.toLowerCase();

  if (textLower.includes('conecta')) {
    return 'Conecta';
  }

  return 'JML'; // Default
}

/**
 * Identifica o tipo de curso
 */
function identifyCourseType(text) {
  const textLower = text.toLowerCase();

  if (textLower.match(/ead|educação\s*a\s*distância|online|remoto/i)) {
    return 'ead';
  }

  if (textLower.match(/híbrido|hibrido|semipresencial/i)) {
    return 'hibrido';
  }

  if (textLower.match(/in\s*company|incompany|empresa|customizado/i)) {
    return 'incompany';
  }

  return 'aberto'; // Default
}

/**
 * Constrói o array de modalidade
 */
function buildModality(company, type) {
  const modalityMap = {
    'JML-aberto': 'Curso aberto JML',
    'JML-incompany': 'Curso InCompany JML',
    'JML-ead': 'Curso EAD JML',
    'JML-hibrido': 'Curso Híbrido JML',
    'Conecta-aberto': 'Curso aberto Conecta',
    'Conecta-incompany': 'Curso InCompany Conecta'
  };

  const key = `${company}-${type}`;
  return [modalityMap[key] || 'Curso aberto JML'];
}

/**
 * Extrai resumo do curso
 */
function extractSummary(text) {
  // Procurar por seção de resumo, objetivo ou apresentação
  const summaryMatch = text.match(/(?:resumo|objetivo|apresentação|sobre\s*o\s*curso)[\s:]+([^.\n]{50,300})/i);
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }

  // Fallback: pegar primeiros 200 caracteres significativos
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const firstParagraph = cleanText.substring(0, 200).trim();
  return firstParagraph || 'Curso voltado para capacitação profissional';
}

/**
 * Extrai descrição/programação do curso
 */
function extractDescription(text) {
  // Procurar por programação ou conteúdo programático
  const programMatch = text.match(/(?:programação|conteúdo\s*programático|módulos?)[\s:]+([^\n]{100,500})/i);
  if (programMatch) {
    return programMatch[1].trim();
  }

  // Procurar por lista de módulos
  const modules = [];
  const moduleMatches = text.matchAll(/(?:módulo|modulo)\s*(\d+)[:\s]+([^\n.]+)/gi);
  for (const match of moduleMatches) {
    modules.push(`Módulo ${match[1]}: ${match[2].trim()}`);
  }

  if (modules.length > 0) {
    return modules.join(' | ');
  }

  return 'Programação detalhada disponível na ementa completa';
}

/**
 * Extrai tags relevantes
 */
function extractTags(text) {
  const textLower = text.toLowerCase();
  const tags = [];

  // Tags comuns
  const commonTags = [
    'licitação', 'licitacoes', 'pregão', 'pregao', 'contratos', 'compliance',
    'auditoria', 'controle', 'gestão', 'gestao', 'liderança', 'lideranca',
    'lei 14.133', 'lei anticorrupção', 'lgpd', 'transparência', 'esg',
    'administração pública', 'setor público', 'estatais'
  ];

  for (const tag of commonTags) {
    if (textLower.includes(tag.toLowerCase())) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 10); // Limitar a 10 tags
}

/**
 * Extrai público-alvo
 */
function extractTargetAudience(text) {
  const audienceMatch = text.match(/(?:público[\s-]*alvo|destinatários|para\s*quem)[\s:]+([^\n.]{20,200})/i);
  if (audienceMatch) {
    return [audienceMatch[1].trim()];
  }

  // Tags genéricas
  return ['Gestores públicos', 'Servidores', 'Profissionais do setor'];
}

/**
 * Extrai objetivos
 */
function extractObjectives(text) {
  const objectives = [];
  const objectiveMatches = text.matchAll(/(?:objetivo|meta)[\s:]+([^\n.]{20,150})/gi);

  for (const match of objectiveMatches) {
    objectives.push(match[1].trim());
  }

  return objectives.length > 0 ? objectives : ['Capacitar profissionais', 'Desenvolver competências'];
}

/**
 * Calcula confiança da extração
 */
function calculateConfidence(data) {
  let score = 0;
  let total = 0;

  const checks = [
    { field: data.title, weight: 0.25, minLength: 10 },
    { field: data.duration, weight: 0.15, isNumber: true },
    { field: data.level, weight: 0.10, minLength: 5 },
    { field: data.segment, weight: 0.15, minLength: 5 },
    { field: data.summary, weight: 0.20, minLength: 30 },
    { field: data.description, weight: 0.15, minLength: 30 }
  ];

  for (const check of checks) {
    total += check.weight;

    if (check.isNumber) {
      if (check.field && check.field > 0) {
        score += check.weight;
      }
    } else if (check.field && check.field.length >= (check.minLength || 1)) {
      score += check.weight;
    }
  }

  return Math.min(score / total, 1.0);
}

module.exports = {
  extractCourseDataFromPDF,
  analyzePDFContent
};
