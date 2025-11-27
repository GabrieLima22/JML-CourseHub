const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');

const DEFAULT_PAYMENT_METHODS = ['PIX', 'Boleto', 'Cartao'];
const DEFAULT_DELIVERABLES = ['Certificado'];
const DEFAULT_TARGET_AUDIENCE = ['Profissionais do setor publico'];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_API_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1';
const getGeminiModelPath = () => {
  const value = (process.env.GEMINI_MODEL || 'gemini-pro').trim();
  if (!value) return 'models/gemini-pro';
  return value.startsWith('models/') ? value : `models/${value}`;
};
const GEMINI_MODEL = getGeminiModelPath();
const GEMINI_ENABLED = String(process.env.ENABLE_GEMINI_EXTRACTION || '').toLowerCase() === 'true';

const SECTION_DEFINITIONS = [
  { key: 'apresentacao', labels: ['apresentacao', 'apresentacao', 'resumo', 'sobre o curso'] },
  { key: 'objetivos', labels: ['objetivos', 'objetivo'] },
  { key: 'aprendizados', labels: ['o que voce vai aprender', 'aprendizagem', 'aprendizados'] },
  { key: 'publico', labels: ['publico-alvo', 'publico-alvo', 'publico alvo', 'para quem'] },
  { key: 'conteudo', labels: ['conteudo programatico', 'conteudo programatico', 'programacao', 'programacao'] },
  { key: 'metodologia', labels: ['metodologia', 'formato', 'como funciona', 'metodologia e vantagens'] },
  { key: 'entregaveis', labels: ['entregaveis', 'o que inclui', 'beneficios', 'beneficios', 'entregas'] },
  { key: 'datas', labels: ['datas', 'agenda', 'cronograma'] },
  { key: 'investimento', labels: ['investimento', 'valores', 'precos', 'precos'] },
  { key: 'orientacoes', labels: ['orientacoes', 'orientacoes', 'inscricoes', 'inscricao', 'pagamento'] },
  { key: 'motivos', labels: ['por que participar', 'porque participar', 'por que participar do evento jml'] },
  { key: 'speakers', labels: ['palestrantes', 'facilitadores', 'professores'] },
  { key: 'contatos', labels: ['contato', 'central de relacionamento', 'central de relacionamento jml'] },
];

const KEY_VALUE_ALIASES = {
  empresa: ['empresa', 'realizacao', 'realizacao'],
  tipo: ['tipo'],
  categoria: ['categoria', 'area', 'area'],
  segmento: ['segmento', 'segmentos'],
  modalidade: ['modalidade', 'formato'],
  titulo: ['titulo', 'titulo', 'curso'],
  subtitulo: ['subtitulo', 'subtitulo', 'tema'],
  cargaHoraria: ['carga horaria', 'carga horaria', 'duracao', 'duracao', 'horas'],
  local: ['local', 'cidade'],
  datas: ['datas', 'data', 'periodo', 'periodo'],
  endereco: ['endereco', 'endereco'],
  valor: ['investimento', 'valor', 'preco', 'preco'],
};

const BADGE_KEYWORDS = [
  { keyword: 'ao vivo', label: 'Ao vivo' },
  { keyword: 'online', label: 'Online' },
  { keyword: 'in company', label: 'In Company' },
  { keyword: 'imersao', label: 'Imersao' },
  { keyword: 'hibrido', label: 'Hibrido' },
  { keyword: 'vagas limitadas', label: 'Vagas limitadas' },
  { keyword: 'nova turma', label: 'Nova turma' },
];

const normalizeWhitespace = value =>
  (value || '')
    .toString()
    .replace(/\s+/g, ' ')
    .trim();

const slugifyHeader = value => normalizeWhitespace(value).toLowerCase();

const removeBullet = value => value.replace(/^[\-\u2013\u2014\u2022\u2023\u25AA\u25CF]+/, '').trim();

const toList = block =>
  block
    .split(/\n+/)
    .map(line => removeBullet(line))
    .map(line => line.replace(/^[\d]+\)?\.?\s*/, '').trim())
    .filter(Boolean);

const detectSectionFromLine = line => {
  const normalized = slugifyHeader(line);
  const section = SECTION_DEFINITIONS.find(section =>
    section.labels.some(label => normalized.startsWith(label))
  );
  return section?.key;
};

const splitSections = rawText => {
  const lines = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map(line => normalizeWhitespace(line))
    .filter(Boolean);

  const sections = {};
  let currentSection = 'header';

  for (const line of lines) {
    const detected = detectSectionFromLine(line);
    if (detected) {
      currentSection = detected;
      sections[currentSection] = sections[currentSection] || [];
      continue;
    }
    sections[currentSection] = sections[currentSection] || [];
    sections[currentSection].push(line);
  }

  return { lines, sections };
};

const buildSectionText = sectionLines =>
  Array.isArray(sectionLines) ? sectionLines.join('\n').trim() : '';

const parseKeyValuePairs = lines => {
  const pairs = {};

  for (const line of lines) {
    const match = line.match(/^([\wA-Ua-u\s\-\/]+)\s*[:\-]\s*(.+)$/);
    if (!match) continue;

    const label = slugifyHeader(match[1]);
    const value = match[2].trim();

    Object.entries(KEY_VALUE_ALIASES).forEach(([key, aliases]) => {
      if (aliases.some(alias => label.includes(alias))) {
        pairs[key] = value;
      }
    });
  }

  return pairs;
};

const extractDurationHours = (lines, fallback) => {
  const pool = lines.join(' ');
  const match = pool.match(/(\d+)\s*(?:horas|hrs|h)/i);
  if (match) {
    return Number.parseInt(match[1], 10);
  }
  return fallback;
};

const extractDates = (textBlock = '') => {
  const matches = textBlock.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g);
  if (matches && matches.length) {
    return matches;
  }
  return [];
};

const extractPriceSummary = textBlock => {
  const matches = textBlock.match(/R\$\s?[0-9\.\,]+/g);
  if (!matches || matches.length === 0) return null;

  const unique = [...new Set(matches)];
  return unique.slice(0, 3).join(' | ');
};

const detectBadges = text => {
  const normalized = text.toLowerCase();
  return BADGE_KEYWORDS.filter(entry => normalized.includes(entry.keyword)).map(
    entry => entry.label
  );
};

const buildProgram = lines => {
  const program = [];
  let current = null;

  for (const line of lines) {
    if (/^\d+[\)\.\-]/.test(line) || /^[A-Z][^\.]{3,}$/.test(line)) {
      if (current) {
        program.push({ titulo: current.title, descricao: current.description.join(' ') });
      }
      current = { title: removeBullet(line.replace(/^\d+[\)\.\-]\s*/, '').trim()), description: [] };
    } else if (current) {
      current.description.push(line);
    }
  }

  if (current) {
    program.push({ titulo: current.title, descricao: current.description.join(' ') });
  }

  return program.filter(item => item.titulo || item.descricao);
};

const detectSpeakers = lines => {
  return lines
    .map(line => removeBullet(line))
    .map(line => {
      if (!line) return null;
      const [name, role] = line.split(/\s+(?:-|\u2013|\u2014)\s+|:\s+/);
      return {
        name: (name || '').trim(),
        role: (role || '').trim(),
      };
    })
    .filter(entry => entry && entry.name);
};

const detectContacts = lines => {
  const contacts = {};
  for (const line of lines) {
    if (line.includes('@') && !contacts.email) contacts.email = line.match(/\S+@\S+/)?.[0];
    if (/whats/i.test(line) && !contacts.whatsapp) contacts.whatsapp = line.match(/\d{8,}/)?.[0];
    if (/telefone|fone|contato/i.test(line) && !contacts.phone) {
      contacts.phone = line.match(/\d{8,}/)?.[0];
    }
    if (/http/i.test(line) && !contacts.website) {
      contacts.website = line.match(/https?:\/\/\S+/)?.[0];
    }
  }
  return contacts;
};

const normalizeSegments = value => {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map(chunk => chunk.trim())
    .filter(Boolean);
};

const buildExtractionConfidence = data => {
  const checkpoints = [
    data.title,
    data.summary,
    data.description,
    data.target_audience.length > 0,
    data.objetivos.length > 0,
    data.programacao.length > 0,
    data.price_summary,
    data.programacao.length > 2,
    data.badges.length > 0,
  ];
  const score = checkpoints.filter(Boolean).length;
  return Math.min(0.95, 0.45 + score * 0.05);
};

const sanitizeGeminiJson = text => {
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (error) {
    try {
      return JSON.parse(
        match[0]
          .replace(/```json/gi, '')
          .replace(/```/g, '')
      );
    } catch (innerError) {
      return null;
    }
  }
};

const mergeExtractionData = (base, aiData) => {
  if (!aiData || typeof aiData !== 'object') {
    return base;
  }

  const pickValue = (aiValue, baseValue) => {
    if (aiValue === undefined || aiValue === null) return baseValue;
    if (typeof aiValue === 'string') {
      const trimmed = aiValue.trim();
      return trimmed.length ? trimmed : baseValue;
    }
    if (Array.isArray(aiValue)) {
      return aiValue.length ? aiValue : baseValue;
    }
    if (typeof aiValue === 'object') {
      return Object.keys(aiValue).length ? aiValue : baseValue;
    }
    if (typeof aiValue === 'number') {
      return Number.isNaN(aiValue) ? baseValue : aiValue;
    }
    return aiValue;
  };

  const merged = { ...base };
  Object.keys(aiData).forEach(key => {
    if (key === 'confidence' || key === 'extraction_method') {
      return;
    }
    merged[key] = pickValue(aiData[key], merged[key]);
  });

  merged.confidence = Math.max(base.confidence || 0, aiData.confidence || 0.92);
  merged.extraction_method = 'gemini';
  return merged;
};

const runGeminiExtraction = async (text, heuristicData) => {
  if (!GEMINI_ENABLED || !GEMINI_API_KEY) {
    return null;
  }

  try {
    const trimmedText = text.length > 20000 ? text.slice(0, 20000) : text;
    const prompt = [
      'Voce e um assistente especializado em analisar PDFs de cursos do Grupo JML.',
      'Extraia e estruture os dados no formato JSON EXACTO abaixo (sem texto adicional):',
      JSON.stringify({
        title: '...',
        subtitle: '...',
        area: '...',
        categoria: '...',
        company: '...',
        empresa: '...',
        tipo: '...',
        segmento: '...',
        segments: ['...'],
        segmentos_adicionais: ['...'],
        modalidade: ['...'],
        summary: '...',
        description: '...',
        duration_hours: 0,
        tags: ['...'],
        badges: ['...'],
        price_summary: '...',
        schedule_details: '...',
        target_audience: ['...'],
        deliverables: ['...'],
        learning_points: ['...'],
        objetivos: ['...'],
        programacao: [{ titulo: '...', descricao: '...' }],
        metodologia: '...',
        motivos_participar: ['...'],
        orientacoes_inscricao: ['...'],
        payment_methods: ['PIX'],
        contacts: { email: '...', phone: '...', whatsapp: '...', website: '...' },
        investment_details: {
          summary: '...',
          options: [{ title: '...', price: '...', includes: ['...'] }],
          notes: '...'
        },
        speakers: [{ name: '...', role: '...' }],
        registration_guidelines: ['...'],
        reasons_to_attend: ['...'],
        logistics_details: '...'
      }, null, 2),
      'Se um campo nao for encontrado, mantenha string vazia ou array vazio.',
      'Use portugues brasileiro e mantenha os valores curtos.',
      'Texto do PDF:',
      `"""${trimmedText}"""`,
      'Sugestoes heuristicas (use apenas para validar ou completar dados ausentes):',
      JSON.stringify({
        title: heuristicData.title,
        subtitle: heuristicData.subtitle,
        resumo: heuristicData.summary?.slice(0, 200),
        categoria: heuristicData.categoria,
        modalidade: heuristicData.modalidade,
        objetivos: heuristicData.objetivos?.slice(0, 5)
      })
    ].join('\n\n');

    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('Erro HTTP ao chamar Gemini:', response.status, errorText);
      return null;
    }

    const payload = await response.json();
    const aiText =
      payload.candidates?.map(candidate =>
        candidate.content?.parts?.map(part => part.text || '').join('\n')
      ).join('\n') || '';
    const parsed = sanitizeGeminiJson(aiText);
    if (!parsed) {
      console.warn('Gemini retornou dados nao parseaveis.');
      return null;
    }
    parsed.extraction_method = 'gemini';
    parsed.confidence = parsed.confidence || 0.92;
    return parsed;
  } catch (error) {
    console.error('Erro ao extrair dados com Gemini:', error.message);
    return null;
  }
};

const normalizeList = (list, fallback = []) =>
  Array.isArray(list) && list.length > 0 ? list : fallback;

async function readPdfText(filePath) {
  const absolutePath = path.resolve(filePath);
  const buffer = await fs.readFile(absolutePath);
  const pdfData = await pdfParse(buffer);
  return pdfData.text || '';
}

async function extractCourseDataFromPDF(filePath) {
  try {
    const text = await readPdfText(filePath);
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'PDF sem conteudo legivel' };
    }

    const { lines, sections } = splitSections(text);
    const sectionText = key => buildSectionText(sections[key]);
    const keyValuePairs = parseKeyValuePairs(sections.header || []);

    const titleFromHeader = keyValuePairs.titulo || sections.header?.[0] || 'Curso sem titulo';
    const subtitleFromHeader = keyValuePairs.subtitulo || sections.header?.[1] || null;
    const segments = normalizeSegments(keyValuePairs.segmento || keyValuePairs.categoria);
    const modalidade = normalizeSegments(keyValuePairs.modalidade);

    const resumoBlock = sectionText('apresentacao') || sectionText('header');
    const descriptionBlock = resumoBlock || sectionText('conteudo');

    const aprendizadoList = normalizeList(toList(sectionText('aprendizados')));
    const objetivosList = normalizeList(toList(sectionText('objetivos')));
    const publicoList = normalizeList(
      toList(sectionText('publico')),
      DEFAULT_TARGET_AUDIENCE
    );
    const entregaveisList = normalizeList(
      toList(sectionText('entregaveis')),
      DEFAULT_DELIVERABLES
    );

    const learningPoints = aprendizadoList.length ? aprendizadoList : objetivosList;

    const programacao = buildProgram(sections.conteudo || []);
    const priceSummary =
      extractPriceSummary(sectionText('investimento')) ||
      extractPriceSummary(sectionText('orientacoes'));
    const scheduleDetails =
      sectionText('datas') || keyValuePairs.datas || extractDates(text).join(' - ');

    const badges = detectBadges(text);
    const durationHours = extractDurationHours(
      sections.header || [],
      extractDurationHours(sections.conteudo || [], null)
    );

    const speakers = detectSpeakers(sections.speakers || []);
    const contacts = detectContacts(sections.contatos || sections.orientacoes || []);

    const motivosParticipar = normalizeList(toList(sectionText('motivos')));
    const orientacoesInscricao = normalizeList(
      toList(sectionText('orientacoes')),
      ['Acesse o portal JML para concluir a inscricao.']
    );

    const paymentMethods =
      normalizeList(
        toList(sectionText('investimento'))
          .filter(item => /pix|boleto|cart[aa]o|transfer/i.test(item))
          .map(item => item.replace(/.*(PIX|Boleto|Cart[aa]o|Transfer[ee]ncia).*/i, '$1')),
        DEFAULT_PAYMENT_METHODS
      ) || DEFAULT_PAYMENT_METHODS;

    let normalizedData = {
      title: titleFromHeader,
      subtitle: subtitleFromHeader,
      area: keyValuePairs.categoria || segments[0] || 'Estatais',
      categoria: keyValuePairs.categoria || segments[0] || 'Estatais',
      company: ['JML', 'CONECTA', 'Conecta'].includes(keyValuePairs.empresa) ? keyValuePairs.empresa : 'JML',
      empresa: ['JML', 'CONECTA', 'Conecta'].includes(keyValuePairs.empresa) ? keyValuePairs.empresa : 'JML',
      tipo: keyValuePairs.tipo || 'aberto',
      segmento: keyValuePairs.segmento || segments[0] || 'Estatais',
      segments,
      segmentos_adicionais: segments.slice(1),
      modalidade: modalidade.length ? modalidade : ['Curso EAD JML'],
      summary:
        resumoBlock ||
        'Resumo nao identificado automaticamente. Edite no painel administrativo.',
      description:
        descriptionBlock ||
        'Descricao nao identificada. Complete os dados manualmente no painel.',
      duration_hours: durationHours || 8,
      tags: detectBadges(text),
      badges,
      price_summary: priceSummary,
      schedule_details: scheduleDetails,
      target_audience: publicoList,
      deliverables: entregaveisList,
      learning_points: learningPoints,
      objetivos: objetivosList,
      programacao,
      metodologia: sectionText('metodologia') || null,
      motivos_participar: motivosParticipar,
      orientacoes_inscricao: orientacoesInscricao,
      payment_methods: paymentMethods,
      contacts: Object.keys(contacts).length ? contacts : null,
      investment_details: {
        summary: priceSummary || sectionText('investimento') || null,
        options: priceSummary
          ? priceSummary.split('|').map(option => ({ title: option.trim() }))
          : [],
        notes: sectionText('investimento') || null,
      },
      speakers,
      registration_guidelines: orientacoesInscricao,
      reasons_to_attend: motivosParticipar,
      logistics_details: sectionText('datas') || null,
      confidence: 0,
      extraction_method: 'heuristic',
    };

    normalizedData.confidence = buildExtractionConfidence(normalizedData);

    const aiData = await runGeminiExtraction(text, normalizedData);
    if (aiData) {
      normalizedData = mergeExtractionData(normalizedData, aiData);
    }

    return {
      success: true,
      data: normalizedData,
      meta: {
        pages: extractDates(text).length,
      },
    };
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return {
      success: false,
      error: error.message || 'Falha inesperada ao processar PDF',
    };
  }
}

module.exports = {
  extractCourseDataFromPDF,
};






