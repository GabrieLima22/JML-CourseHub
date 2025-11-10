const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Dados dos 22 cursos reais
const coursesData = [
  {
    id: "1",
    titulo: "Contratação Direta: Dispensa e Inexigibilidade",
    slug: "contratacao-direta",
    empresa: "JML",
    tipo: "ead",
    segmento: "Estatais",
    categoria: "Estatais",
    modalidade: ["Curso EAD JML"],
    tags: ["contratação direta", "dispensa", "inexigibilidade", "sistema s", "estatais"],
    summary: "Entenda quando e como contratar sem licitar, respeitando limites legais e reduzindo riscos.",
    description: "Módulo 1: Fundamentos da contratação direta | Módulo 2: Dispensas de licitação (arts. 75 e 76) | Módulo 3: Inexigibilidade de licitação | Módulo 4: Procedimentos e documentação | Módulo 5: Controles e riscos",
    carga_horaria: 12,
    nivel: "Intermediário",
    publico_alvo: ["Gestores de contratos", "pregoeiros", "agentes de contratação"],
    deliverables: ["Certificado digital", "Apostila completa", "Modelos de documentos"],
    landing_page: "https://jml.com.br/cursos/contratacao-direta",
    pdf_url: "https://jml.com.br/ementas/contratacao-direta.pdf",
    related_ids: ["2", "7", "15"],
    status: "published",
    destaque: true,
    novo: true
  },
  {
    id: "2",
    titulo: "Nova Lei de Licitações (14.133/21): Visão Completa",
    slug: "nova-lei-licitacoes",
    empresa: "JML",
    tipo: "hibrido",
    segmento: "Judiciário",
    categoria: "Judiciário",
    modalidade: ["Curso Híbrido JML"],
    tags: ["lei 14.133", "licitações", "pregão", "modalidades", "estatais"],
    summary: "Domine todos os aspectos da nova lei de licitações e contratos administrativos.",
    description: "Módulo 1: Princípios e novidades | Módulo 2: Modalidades de licitação | Módulo 3: Fases do procedimento | Módulo 4: Gestão e fiscalização de contratos | Módulo 5: Infrações e sanções",
    carga_horaria: 20,
    nivel: "Intermediário",
    publico_alvo: ["Gestores públicos", "advogados", "agentes de contratação"],
    deliverables: ["Certificado digital", "Apostila completa", "Checklist prático"],
    landing_page: "https://jml.com.br/cursos/lei-14133",
    pdf_url: "https://jml.com.br/ementas/lei-14133.pdf",
    related_ids: ["1", "3", "4"],
    status: "published",
    destaque: true,
    novo: true
  },
  {
    id: "3",
    titulo: "Pregão Eletrônico: Da Elaboração ao Encerramento",
    slug: "pregao-eletronico",
    empresa: "Conecta",
    tipo: "aberto",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso aberto Conecta"],
    tags: ["pregão eletrônico", "termo de referência", "habilitação", "recursos"],
    summary: "Domine todas as fases do pregão eletrônico com segurança e eficiência.",
    description: "Módulo 1: Planejamento e estudos técnicos preliminares | Módulo 2: Elaboração do termo de referência | Módulo 3: Condução da sessão pública | Módulo 4: Habilitação e recursos | Módulo 5: Homologação e formalização",
    carga_horaria: 16,
    nivel: "Intermediário",
    publico_alvo: ["Pregoeiros", "equipes de apoio", "gestores de compras"],
    deliverables: ["Certificado digital", "Modelos de editais", "Fluxogramas"],
    landing_page: "https://jml.com.br/cursos/pregao-eletronico",
    pdf_url: "https://jml.com.br/ementas/pregao-eletronico.pdf",
    related_ids: ["2", "5", "6"],
    status: "published",
    destaque: false,
    novo: true
  },
  {
    id: "4",
    titulo: "Gestão e Fiscalização de Contratos Administrativos",
    slug: "gestao-contratos",
    empresa: "JML",
    tipo: "aberto",
    segmento: "Estatais",
    categoria: "Estatais",
    modalidade: ["Curso aberto JML"],
    tags: ["gestão de contratos", "fiscalização", "glosas", "aditivos"],
    summary: "Aprenda a gerir e fiscalizar contratos com segurança jurídica e eficiência operacional.",
    description: "Módulo 1: Papéis e responsabilidades | Módulo 2: Execução contratual | Módulo 3: Alterações e aditivos | Módulo 4: Glosas e sanções | Módulo 5: Extinção e prestação de contas",
    carga_horaria: 12,
    nivel: "Básico",
    publico_alvo: ["Fiscais de contrato", "gestores", "servidores públicos"],
    deliverables: ["Certificado digital", "Checklist de fiscalização", "Modelos de relatórios"],
    landing_page: "https://jml.com.br/cursos/gestao-contratos",
    pdf_url: "https://jml.com.br/ementas/gestao-contratos.pdf",
    related_ids: ["2", "7", "10"],
    status: "published",
    destaque: true,
    novo: false
  },
  {
    id: "5",
    titulo: "Planejamento de Contratações Públicas",
    slug: "planejamento-contratacoes",
    empresa: "JML",
    tipo: "ead",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso EAD JML"],
    tags: ["planejamento", "PCA", "estudos técnicos", "ETP"],
    summary: "Estruture contratações mais eficientes com planejamento estratégico e estudos técnicos.",
    description: "Módulo 1: Plano de Contratações Anual (PCA) | Módulo 2: Estudos técnicos preliminares (ETP) | Módulo 3: Análise de riscos | Módulo 4: Gestão de demanda | Módulo 5: Alinhamento orçamentário",
    carga_horaria: 8,
    nivel: "Básico",
    publico_alvo: ["Gestores públicos", "equipes de compras", "planejadores"],
    deliverables: ["Certificado digital", "Templates de ETP", "Guia de boas práticas"],
    landing_page: "https://jml.com.br/cursos/planejamento-contratacoes",
    pdf_url: "https://jml.com.br/ementas/planejamento-contratacoes.pdf",
    related_ids: ["3", "11", "13"],
    status: "published",
    destaque: false,
    novo: true
  },
  {
    id: "6",
    titulo: "Elaboração de Editais e Termos de Referência",
    slug: "editais-termos-referencia",
    empresa: "JML",
    tipo: "aberto",
    segmento: "Judiciário",
    categoria: "Judiciário",
    modalidade: ["Curso aberto JML"],
    tags: ["edital", "termo de referência", "especificações técnicas", "critérios de julgamento"],
    summary: "Construa editais e TRs robustos, claros e juridicamente seguros.",
    description: "Módulo 1: Estrutura do edital | Módulo 2: Termo de referência detalhado | Módulo 3: Critérios de julgamento | Módulo 4: Garantias e sanções | Módulo 5: Checagem e publicação",
    carga_horaria: 12,
    nivel: "Intermediário",
    publico_alvo: ["Pregoeiros", "assessores jurídicos", "gestores de compras"],
    deliverables: ["Certificado digital", "Biblioteca de cláusulas", "Modelos prontos"],
    landing_page: "https://jml.com.br/cursos/editais-termos",
    pdf_url: "https://jml.com.br/ementas/editais-termos.pdf",
    related_ids: ["3", "5", "2"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "7",
    titulo: "Contratos Administrativos: Aspectos Jurídicos e Práticos",
    slug: "contratos-administrativos",
    empresa: "Conecta",
    tipo: "incompany",
    segmento: "Judiciário",
    categoria: "Judiciário",
    modalidade: ["Curso InCompany Conecta"],
    tags: ["contratos administrativos", "cláusulas exorbitantes", "equilíbrio econômico", "rescisão"],
    summary: "Compreenda a natureza jurídica e os desafios práticos dos contratos administrativos.",
    description: "Módulo 1: Conceitos e características | Módulo 2: Cláusulas exorbitantes | Módulo 3: Equilíbrio econômico-financeiro | Módulo 4: Reajuste e repactuação | Módulo 5: Rescisão e extinção",
    carga_horaria: 10,
    nivel: "Intermediário",
    publico_alvo: ["Advogados públicos", "gestores de contratos", "procuradores"],
    deliverables: ["Certificado digital", "Apostila jurídica", "Jurisprudência selecionada"],
    landing_page: "https://jml.com.br/cursos/contratos-administrativos",
    pdf_url: "https://jml.com.br/ementas/contratos-administrativos.pdf",
    related_ids: ["1", "4", "2"],
    status: "published",
    destaque: true,
    novo: false
  },
  {
    id: "8",
    titulo: "Compliance em Contratações Públicas",
    slug: "compliance-contratacoes",
    empresa: "JML",
    tipo: "ead",
    segmento: "Estatais",
    categoria: "Estatais",
    modalidade: ["Curso EAD JML"],
    tags: ["compliance", "integridade", "lei anticorrupção", "controles internos"],
    summary: "Implante programas de integridade e reduza riscos de corrupção e irregularidades.",
    description: "Módulo 1: Conceitos de compliance | Módulo 2: Lei Anticorrupção (12.846/13) | Módulo 3: Controles internos | Módulo 4: Canal de denúncias | Módulo 5: Auditoria e monitoramento",
    carga_horaria: 8,
    nivel: "Intermediário",
    publico_alvo: ["Controladores", "auditores", "gestores de compliance"],
    deliverables: ["Certificado digital", "Toolkit de compliance", "Matriz de riscos"],
    landing_page: "https://jml.com.br/cursos/compliance",
    pdf_url: "https://jml.com.br/ementas/compliance.pdf",
    related_ids: ["9", "12", "14"],
    status: "published",
    destaque: false,
    novo: true
  },
  {
    id: "9",
    titulo: "Auditoria e Controle Interno de Contratos",
    slug: "auditoria-controle",
    empresa: "Conecta",
    tipo: "aberto",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso aberto Conecta"],
    tags: ["auditoria", "controle interno", "TCU", "conformidade"],
    summary: "Desenvolva competências para auditar contratos e garantir conformidade.",
    description: "Módulo 1: Princípios de auditoria | Módulo 2: Técnicas de amostragem | Módulo 3: Verificação documental | Módulo 4: Relatórios de auditoria | Módulo 5: Acompanhamento de recomendações",
    carga_horaria: 12,
    nivel: "Avançado",
    publico_alvo: ["Auditores internos", "controladores", "analistas de controle"],
    deliverables: ["Certificado digital", "Checklists de auditoria", "Modelos de relatórios"],
    landing_page: "https://jml.com.br/cursos/auditoria-controle",
    pdf_url: "https://jml.com.br/ementas/auditoria-controle.pdf",
    related_ids: ["8", "12", "14"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "10",
    titulo: "Responsabilidade Civil e Criminal do Gestor Público",
    slug: "responsabilidade-gestor",
    empresa: "JML",
    tipo: "incompany",
    segmento: "Judiciário",
    categoria: "Judiciário",
    modalidade: ["Curso InCompany JML"],
    tags: ["responsabilidade", "improbidade", "crimes licitatórios", "LIA"],
    summary: "Conheça os riscos jurídicos e proteja-se contra ações de responsabilização.",
    description: "Módulo 1: Tipos de responsabilidade | Módulo 2: Improbidade administrativa (LIA) | Módulo 3: Crimes licitatórios | Módulo 4: Ação de ressarcimento | Módulo 5: Defesas e boas práticas",
    carga_horaria: 10,
    nivel: "Intermediário",
    publico_alvo: ["Gestores públicos", "procuradores", "servidores"],
    deliverables: ["Certificado digital", "Guia de defesa", "Jurisprudência"],
    landing_page: "https://jml.com.br/cursos/responsabilidade-gestor",
    pdf_url: "https://jml.com.br/ementas/responsabilidade-gestor.pdf",
    related_ids: ["2", "4", "8"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "11",
    titulo: "Licitações Sustentáveis e Critérios ESG",
    slug: "licitacoes-sustentaveis",
    empresa: "JML",
    tipo: "hibrido",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso Híbrido JML"],
    tags: ["sustentabilidade", "ESG", "licitações verdes", "compras sustentáveis"],
    summary: "Integre critérios socioambientais e de governança nas suas contratações.",
    description: "Módulo 1: Conceitos de ESG | Módulo 2: Marco legal das licitações sustentáveis | Módulo 3: Critérios de sustentabilidade | Módulo 4: Comprovação e fiscalização | Módulo 5: Cases de sucesso",
    carga_horaria: 8,
    nivel: "Básico",
    publico_alvo: ["Gestores de compras", "pregoeiros", "sustentabilidade"],
    deliverables: ["Certificado digital", "Checklist ESG", "Biblioteca de critérios"],
    landing_page: "https://jml.com.br/cursos/licitacoes-sustentaveis",
    pdf_url: "https://jml.com.br/ementas/licitacoes-sustentaveis.pdf",
    related_ids: ["5", "13", "6"],
    status: "published",
    destaque: true,
    novo: true
  },
  {
    id: "12",
    titulo: "LGPD na Administração Pública",
    slug: "lgpd-administracao",
    empresa: "Conecta",
    tipo: "incompany",
    segmento: "Estatais",
    categoria: "Estatais",
    modalidade: ["Curso InCompany Conecta"],
    tags: ["LGPD", "proteção de dados", "privacidade", "encarregado"],
    summary: "Adeque sua organização pública à Lei Geral de Proteção de Dados.",
    description: "Módulo 1: Fundamentos da LGPD | Módulo 2: Bases legais no setor público | Módulo 3: Direitos dos titulares | Módulo 4: Governança de dados | Módulo 5: Incidentes e notificações",
    carga_horaria: 10,
    nivel: "Intermediário",
    publico_alvo: ["Encarregados de dados", "TI", "gestores públicos"],
    deliverables: ["Certificado digital", "Toolkit LGPD", "Modelos de políticas"],
    landing_page: "https://jml.com.br/cursos/lgpd",
    pdf_url: "https://jml.com.br/ementas/lgpd.pdf",
    related_ids: ["8", "9", "14"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "13",
    titulo: "Sistema de Registro de Preços (SRP)",
    slug: "registro-precos",
    empresa: "JML",
    tipo: "aberto",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso aberto JML"],
    tags: ["registro de preços", "ata de registro", "carona", "adesão"],
    summary: "Utilize o SRP de forma estratégica e legal, evitando riscos de adesões inadequadas.",
    description: "Módulo 1: O que é e quando usar o SRP | Módulo 2: Licitação e formação da ata | Módulo 3: Gerenciamento da ata | Módulo 4: Adesão ('carona') | Módulo 5: Vedações e jurisprudência",
    carga_horaria: 8,
    nivel: "Básico",
    publico_alvo: ["Gestores de compras", "pregoeiros", "servidores"],
    deliverables: ["Certificado digital", "Fluxograma do SRP", "Modelos de ata"],
    landing_page: "https://jml.com.br/cursos/registro-precos",
    pdf_url: "https://jml.com.br/ementas/registro-precos.pdf",
    related_ids: ["3", "5", "11"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "14",
    titulo: "Controle de Transparência e Acesso à Informação",
    slug: "transparencia-acesso",
    empresa: "Conecta",
    tipo: "aberto",
    segmento: "Judiciário",
    categoria: "Judiciário",
    modalidade: ["Curso aberto Conecta"],
    tags: ["transparência", "LAI", "acesso à informação", "portal"],
    summary: "Garanta conformidade com a Lei de Acesso à Informação e amplie a transparência.",
    description: "Módulo 1: Lei de Acesso à Informação (LAI) | Módulo 2: Transparência ativa e passiva | Módulo 3: Procedimentos de atendimento | Módulo 4: Recursos e prazos | Módulo 5: Portais de transparência",
    carga_horaria: 6,
    nivel: "Básico",
    publico_alvo: ["Servidores", "ouvidores", "equipes de comunicação"],
    deliverables: ["Certificado digital", "Guia de atendimento", "Checklist LAI"],
    landing_page: "https://jml.com.br/cursos/transparencia",
    pdf_url: "https://jml.com.br/ementas/transparencia.pdf",
    related_ids: ["8", "9", "12"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "15",
    titulo: "Licitações para Obras Públicas",
    slug: "licitacoes-obras",
    empresa: "JML",
    tipo: "incompany",
    segmento: "Estatais",
    categoria: "Estatais",
    modalidade: ["Curso InCompany JML"],
    tags: ["obras públicas", "BDI", "planilha orçamentária", "medições"],
    summary: "Domine as especificidades das licitações de obras, do projeto básico à conclusão.",
    description: "Módulo 1: Projeto básico e executivo | Módulo 2: Orçamento e BDI | Módulo 3: Modalidades aplicáveis | Módulo 4: Fiscalização e medições | Módulo 5: Aditivos e acréscimos",
    carga_horaria: 16,
    nivel: "Avançado",
    publico_alvo: ["Engenheiros", "arquitetos", "gestores de obras", "fiscais"],
    deliverables: ["Certificado digital", "Modelos de planilha", "Checklist técnico"],
    landing_page: "https://jml.com.br/cursos/obras-publicas",
    pdf_url: "https://jml.com.br/ementas/obras-publicas.pdf",
    related_ids: ["1", "4", "6"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "16",
    titulo: "Negociação e Comunicação Assertiva",
    slug: "negociacao-comunicacao",
    empresa: "JML",
    tipo: "aberto",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso aberto JML"],
    tags: ["negociação", "comunicação", "liderança", "conflitos"],
    summary: "Desenvolva habilidades de negociação e comunicação para melhorar resultados e relacionamentos.",
    description: "Módulo 1: Fundamentos da negociação | Módulo 2: Técnicas de comunicação assertiva | Módulo 3: Gestão de conflitos | Módulo 4: Escuta ativa | Módulo 5: Prática e simulações",
    carga_horaria: 12,
    nivel: "Básico",
    publico_alvo: ["Gestores", "líderes", "servidores públicos"],
    deliverables: ["Certificado digital", "Toolkit de negociação", "Exercícios práticos"],
    landing_page: "https://jml.com.br/cursos/negociacao",
    pdf_url: "https://jml.com.br/ementas/negociacao.pdf",
    related_ids: ["17", "18", "19"],
    status: "published",
    destaque: false,
    novo: true
  },
  {
    id: "17",
    titulo: "Gestão de Equipes e Liderança",
    slug: "gestao-equipes",
    empresa: "Conecta",
    tipo: "aberto",
    segmento: "Judiciário",
    categoria: "Judiciário",
    modalidade: ["Curso aberto Conecta"],
    tags: ["liderança", "gestão de equipes", "motivação", "feedback"],
    summary: "Aprimore suas competências de liderança e gestão de pessoas no setor público.",
    description: "Módulo 1: Estilos de liderança | Módulo 2: Gestão de desempenho | Módulo 3: Feedback eficaz | Módulo 4: Motivação e engajamento | Módulo 5: Desenvolvimento de talentos",
    carga_horaria: 10,
    nivel: "Intermediário",
    publico_alvo: ["Gestores", "líderes", "coordenadores"],
    deliverables: ["Certificado digital", "Ferramentas de gestão", "Planos de ação"],
    landing_page: "https://jml.com.br/cursos/gestao-equipes",
    pdf_url: "https://jml.com.br/ementas/gestao-equipes.pdf",
    related_ids: ["16", "18", "20"],
    status: "published",
    destaque: true,
    novo: false
  },
  {
    id: "18",
    titulo: "Gestão do Tempo e Produtividade",
    slug: "gestao-tempo",
    empresa: "JML",
    tipo: "ead",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso EAD JML"],
    tags: ["produtividade", "gestão do tempo", "priorização", "organização"],
    summary: "Organize melhor suas tarefas, elimine desperdícios de tempo e aumente a produtividade.",
    description: "Módulo 1: Diagnóstico do tempo | Módulo 2: Técnicas de priorização | Módulo 3: Ferramentas digitais | Módulo 4: Eliminação de distrações | Módulo 5: Rotinas eficazes",
    carga_horaria: 6,
    nivel: "Básico",
    publico_alvo: ["Servidores", "gestores", "profissionais em geral"],
    deliverables: ["Certificado digital", "Planner digital", "Checklist de produtividade"],
    landing_page: "https://jml.com.br/cursos/gestao-tempo",
    pdf_url: "https://jml.com.br/ementas/gestao-tempo.pdf",
    related_ids: ["16", "17", "19"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "19",
    titulo: "Inteligência Emocional no Trabalho",
    slug: "inteligencia-emocional",
    empresa: "JML",
    tipo: "hibrido",
    segmento: "Judiciário",
    categoria: "Judiciário",
    modalidade: ["Curso Híbrido JML"],
    tags: ["inteligência emocional", "autoconhecimento", "empatia", "resiliência"],
    summary: "Desenvolva inteligência emocional para lidar melhor com pressões e relacionamentos.",
    description: "Módulo 1: O que é inteligência emocional | Módulo 2: Autoconhecimento | Módulo 3: Autogestão emocional | Módulo 4: Empatia e relacionamentos | Módulo 5: Resiliência e adaptação",
    carga_horaria: 8,
    nivel: "Básico",
    publico_alvo: ["Todos os profissionais"],
    deliverables: ["Certificado digital", "Ferramentas de autoavaliação", "Planos de desenvolvimento"],
    landing_page: "https://jml.com.br/cursos/inteligencia-emocional",
    pdf_url: "https://jml.com.br/ementas/inteligencia-emocional.pdf",
    related_ids: ["16", "17", "18"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "20",
    titulo: "Gestão de Projetos no Setor Público",
    slug: "gestao-projetos",
    empresa: "Conecta",
    tipo: "incompany",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso InCompany Conecta"],
    tags: ["gestão de projetos", "PMI", "cronograma", "riscos"],
    summary: "Aplique metodologias de gestão de projetos para entregar resultados no prazo e qualidade.",
    description: "Módulo 1: Conceitos e fases do projeto | Módulo 2: Escopo e cronograma | Módulo 3: Gestão de riscos | Módulo 4: Equipe e comunicação | Módulo 5: Monitoramento e encerramento",
    carga_horaria: 12,
    nivel: "Intermediário",
    publico_alvo: ["Gestores de projetos", "coordenadores", "servidores"],
    deliverables: ["Certificado digital", "Templates de gestão", "Ferramentas de controle"],
    landing_page: "https://jml.com.br/cursos/gestao-projetos",
    pdf_url: "https://jml.com.br/ementas/gestao-projetos.pdf",
    related_ids: ["17", "5", "13"],
    status: "published",
    destaque: false,
    novo: false
  },
  {
    id: "21",
    titulo: "Transformação Digital na Gestão Pública",
    slug: "transformacao-digital",
    empresa: "JML",
    tipo: "hibrido",
    segmento: "Estatais",
    categoria: "Estatais",
    modalidade: ["Curso Híbrido JML"],
    tags: ["transformação digital", "governo digital", "automação", "inovação"],
    summary: "Lidere a modernização digital dos processos e serviços públicos.",
    description: "Módulo 1: Conceitos de governo digital | Módulo 2: Análise de processos | Módulo 3: Ferramentas de automação | Módulo 4: Gestão da mudança | Módulo 5: Implementação e métricas",
    carga_horaria: 14,
    nivel: "Avançado",
    publico_alvo: ["Gestores de TI", "diretores", "coordenadores de modernização"],
    deliverables: ["Certificado digital", "Roadmap de digitalização", "Toolkit de automação"],
    landing_page: "https://jml.com.br/cursos/transformacao-digital",
    pdf_url: "https://jml.com.br/ementas/transformacao-digital.pdf",
    related_ids: ["12", "8", "20"],
    status: "published",
    destaque: true,
    novo: true
  },
  {
    id: "22",
    titulo: "Metodologias Ágeis para o Setor Público",
    slug: "metodologias-ageis",
    empresa: "JML",
    tipo: "hibrido",
    segmento: "Sistema S",
    categoria: "Sistema S",
    modalidade: ["Curso Híbrido JML"],
    tags: ["metodologias ágeis", "scrum", "design thinking", "inovação pública"],
    summary: "Aplique metodologias ágeis para acelerar a entrega de projetos e serviços.",
    description: "Módulo 1: Introdução às metodologias ágeis | Módulo 2: Framework Scrum | Módulo 3: Design Thinking | Módulo 4: Lean Government | Módulo 5: Implementação prática",
    carga_horaria: 16,
    nivel: "Intermediário",
    publico_alvo: ["Gestores de projetos", "equipes de inovação", "coordenadores"],
    deliverables: ["Certificado digital", "Toolkit Scrum", "Canvas de projetos"],
    landing_page: "https://jml.com.br/cursos/metodologias-ageis",
    pdf_url: "https://jml.com.br/ementas/metodologias-ageis.pdf",
    related_ids: ["20", "21", "17"],
    status: "published",
    destaque: false,
    novo: true
  }
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // 1. Limpar dados existentes
  console.log('🗑️  Limpando dados existentes...');
  await prisma.analytics.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Dados limpos!\n');

  // 2. Criar usuário admin
  console.log('👤 Criando usuário admin...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@jml.com.br',
      password: hashedPassword,
      name: 'Administrador JML',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
      email_verified: true
    }
  });
  console.log(`✅ Admin criado: ${admin.email}\n`);

  // 3. Criar cursos
  console.log('📚 Criando 22 cursos...');
  const createdCourses = [];

  for (const courseData of coursesData) {
    const course = await prisma.course.create({
      data: {
        ...courseData,
        investimento: {
          valor: Math.floor(Math.random() * 1000) + 500,
          moeda: 'BRL'
        },
        programacao: [
          { modulo: 1, titulo: courseData.description.split('|')[0]?.trim() || 'Módulo 1' },
          { modulo: 2, titulo: courseData.description.split('|')[1]?.trim() || 'Módulo 2' },
          { modulo: 3, titulo: courseData.description.split('|')[2]?.trim() || 'Módulo 3' }
        ],
        views_count: Math.floor(Math.random() * 500) + 50,
        clicks_count: Math.floor(Math.random() * 100) + 10,
        conversions_count: Math.floor(Math.random() * 20) + 1,
        created_by: admin.id,
        updated_by: admin.id,
        published_at: new Date()
      }
    });
    createdCourses.push(course);
    console.log(`  ✓ ${course.titulo}`);
  }
  console.log(`\n✅ ${createdCourses.length} cursos criados!\n`);

  // 4. Criar analytics realistas
  console.log('📊 Gerando analytics...');
  const events = ['view', 'click', 'download', 'search'];
  const analyticsPromises = [];

  for (const course of createdCourses) {
    // Criar entre 5-20 eventos por curso
    const numEvents = Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < numEvents; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      analyticsPromises.push(
        prisma.analytics.create({
          data: {
            course_id: course.id,
            event_type: events[Math.floor(Math.random() * events.length)],
            created_at: date,
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            referrer: 'https://jml.com.br',
            session_id: `session_${Math.random().toString(36).substring(7)}`
          }
        })
      );
    }
  }

  await Promise.all(analyticsPromises);
  console.log(`✅ ${analyticsPromises.length} eventos de analytics criados!\n`);

  // 5. Estatísticas finais
  const stats = {
    courses: await prisma.course.count(),
    users: await prisma.user.count(),
    analytics: await prisma.analytics.count(),
    published: await prisma.course.count({ where: { status: 'published' } }),
    featured: await prisma.course.count({ where: { destaque: true } })
  };

  console.log('═══════════════════════════════════════');
  console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
  console.log('═══════════════════════════════════════');
  console.log(`📚 Total de cursos: ${stats.courses}`);
  console.log(`   └─ Publicados: ${stats.published}`);
  console.log(`   └─ Em destaque: ${stats.featured}`);
  console.log(`👥 Usuários: ${stats.users}`);
  console.log(`📊 Eventos analytics: ${stats.analytics}`);
  console.log('═══════════════════════════════════════');
  console.log('\n🔐 CREDENCIAIS DE ACESSO:');
  console.log('   Email: admin@jml.com.br');
  console.log('   Senha: admin123');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
