export type SeedTopic =
  | string
  | {
      name: string;
      content?: string;
    };

export interface SeedBlock {
  name: string;
  topics: SeedTopic[];
}

export interface SeedSubject {
  id: string;
  name: string;
  tag: string;
  blocks: SeedBlock[];
}

export function seedTopicName(topic: SeedTopic): string {
  return typeof topic === "string" ? topic : topic.name;
}

export function seedTopicContent(topic: SeedTopic): string {
  return typeof topic === "string" ? "" : (topic.content ?? "");
}

export const SEED_SUBJECTS: SeedSubject[] = [
  {
    id: "biologia",
    name: "Biologia",
    tag: "BIO",
    blocks: [
      {
        name: "Biologia Celular e Molecular",
        topics: [
          {
            name: "Estrutura da célula procariota e eucariota",
            content: `## Essencial

Células **procariotas** (bactérias e arqueias) não têm núcleo delimitado por membrana; o DNA fica no nucleoide. Células **eucariotas** (animais, plantas, fungos, protozoários) têm núcleo verdadeiro e organelas membranosas.

## Por que importa na Medicina

Infecções bacterianas vs. células humanas exigem alvos terapêuticos diferentes (parede celular, ribossomos 70S). Entender a organização celular é a base de histologia, patologia e farmacologia.

## Pontos para fixar

- Procariota: sem núcleo, sem mitocôndria, ribossomo 70S
- Eucariota: núcleo, organelas, ribossomo 80S
`,
          },
          {
            name: "Membrana plasmática e transporte (difusão, osmose, transporte ativo)",
            content: `## Essencial

A membrana é um **bicamada lipídica** com proteínas embutidas (modelo do mosaico fluido). Controla o que entra e sai da célula.

## Tipos de transporte

- **Difusão simples**: solutos lipossolúveis, a favor do gradiente
- **Difusão facilitada**: canais/transportadores, sem ATP
- **Osmose**: água a favor do gradiente de potencial hídrico
- **Transporte ativo**: contra o gradiente, consome ATP (ex.: bomba Na⁺/K⁺)

## Clínica

Edema, desidratação e choque envolvem equilíbrio hídrico e iônico dependente dessas vias.
`,
          },
          {
            name: "Organelas: mitocôndria, retículo endoplasmático, Golgi, lisossomos, ribossomos",
            content: `## Essencial

Cada organela tem função especializada:

| Organela | Função principal |
|---|---|
| Mitocôndria | ATP (fosforilação oxidativa) |
| RE rugoso | Síntese de proteínas secretadas/membranosas |
| RE liso | Lipídeos, detoxificação |
| Golgi | Modificação e empacotamento |
| Lisossomo | Digestão intracelular |
| Ribossomo | Tradução (síntese proteica) |

## Dica de estudo

Associe doença ↔ organela (ex.: mitocondriopatias, lisossomais).
`,
          },
          {
            name: "Núcleo e organização do material genético",
            content: `## Essencial

O **núcleo** guarda o genoma em cromatina (DNA + histonas). Eucromatina = mais ativa; heterocromatina = mais condensada/silenciada.

## Organização

- DNA → nucleossomos → fibra de cromatina → cromossomos (na divisão)
- Nucléolo: biogenêse de ribossomos
- Envelope nuclear com poros para tráfego RNA/proteínas

## Ponte

Mutações, epigenética e câncer começam na organização e leitura desse material.
`,
          },
          {
            name: "Ciclo celular: interfase, mitose, meiose",
            content: `## Essencial

**Interfase:** G1 (crescimento) → S (replicação do DNA) → G2 (preparo).  
**Mitose:** divisão equacional (2 células diploides idênticas).  
**Meiose:** divisão reducional (gametas haploides) com crossing-over.

## Pontos-chave

- Mitose: prófase → metáfase → anáfase → telófase (+ citocinese)
- Meiose I separa homólogos; Meiose II separa cromátides
- Erros na meiose → aneuploidias (ex.: trissomia 21)
`,
          },
          {
            name: "Controle do ciclo celular e apoptose",
            content: `## Essencial

Checkpoints (G1/S, G2/M, metafásico) usam **ciclinas + CDKs**. Proteínas como p53 podem parar o ciclo ou induzir morte se o DNA estiver danificado.

**Apoptose** é morte celular programada, limpa e sem inflamação intensa — diferente de necrose.

## Clínica

Falhas no controle → proliferação descontrolada (câncer). Muitos quimioterápicos miram células em divisão.
`,
          },
        ],
      },
      {
        name: "Genética e Biologia Molecular",
        topics: [
          "Estrutura do DNA e RNA",
          "Replicação, transcrição e tradução",
          "Código genético e síntese proteica",
          "Mutações e mecanismos de reparo do DNA",
          "Genética mendeliana (leis, cruzamentos, heredogramas)",
          "Genética não mendeliana (ligação, epistasia, herança poligênica)",
          "Noções de genética de populações",
          "Tecnologias de DNA recombinante (PCR, CRISPR — noções)",
        ],
      },
      {
        name: "Bioquímica",
        topics: [
          "Água, pH e tampões biológicos",
          "Biomoléculas: carboidratos, lipídeos, proteínas, ácidos nucleicos",
          "Enzimas: cinética, cofatores, inibição",
          "Metabolismo energético: glicólise, ciclo de Krebs, cadeia respiratória",
          "Visão geral do metabolismo de lipídeos e proteínas",
        ],
      },
      {
        name: "Histologia",
        topics: [
          "Tecido epitelial",
          "Tecido conjuntivo",
          "Tecido muscular",
          "Tecido nervoso",
          "Tecido ósseo e cartilaginoso",
          "Sangue e hematopoese",
        ],
      },
      {
        name: "Embriologia (introdução)",
        topics: [
          "Gametogênese",
          "Fecundação",
          "Clivagem, gastrulação e folhetos embrionários",
          "Formação geral dos principais sistemas",
        ],
      },
      {
        name: "Fisiologia Humana (por sistema)",
        topics: [
          "Sistema cardiovascular",
          "Sistema respiratório",
          "Sistema digestório",
          "Sistema urinário / renal",
          "Sistema nervoso central e periférico",
          "Sistema endócrino",
          "Sistema muscular e esquelético",
          "Sistema imunológico",
          "Sistema reprodutor",
        ],
      },
      {
        name: "Microbiologia e Parasitologia (noções)",
        topics: [
          "Bactérias: estrutura, classificação, reprodução",
          "Vírus: estrutura e ciclo de replicação",
          "Fungos e protozoários — visão básica",
          "Principais doenças infecciosas de relevância no Brasil",
        ],
      },
      {
        name: "Ecologia e Evolução",
        topics: [
          "Níveis de organização ecológica",
          "Ciclos biogeoquímicos",
          "Relações ecológicas",
          "Teoria da evolução e seleção natural",
          "Especiação",
        ],
      },
    ],
  },
  {
    id: "quimica",
    name: "Química",
    tag: "QUI",
    blocks: [
      {
        name: "Química Geral",
        topics: [
          {
            name: "Estrutura atômica e modelos atômicos",
            content: `## Essencial

Átomo = núcleo (prótons + nêutrons) + elétrons em níveis de energia. Modelos evoluíram de Dalton → Thomson → Rutherford → Bohr → orbital quântico.

## Para Medicina

Número atômico (Z) define o elemento; isótopos importam em imagem e terapia (ex.: radioisótopos). Configuração eletrônica explica ligações e reatividade.
`,
          },
          {
            name: "Tabela periódica e propriedades periódicas",
            content: `## Essencial

A tabela organiza elementos por **número atômico**. Propriedades periódicas úteis: raio atômico, eletronegatividade, energia de ionização, caráter metálico.

## Atalho

Da esquerda para a direita num período: raio ↓, eletronegatividade ↑. De cima para baixo num grupo: raio ↑, eletronegatividade ↓ (em geral).
`,
          },
          {
            name: "Ligações químicas: iônica, covalente, metálica",
            content: `## Essencial

- **Iônica:** transferência de elétrons (metal + não metal) → íons
- **Covalente:** compartilhamento (não metais) — polar ou apolar
- **Metálica:** “mar de elétrons” — condutividade, maleabilidade

Na bioquímica, ligações covalentes montam biomoléculas; interações iônicas e dipolo estabilizam proteínas e DNA.
`,
          },
          {
            name: "Geometria molecular e polaridade",
            content: `## Essencial

A geometria (VSEPR) e a diferença de eletronegatividade definem se a molécula é **polar** ou **apolar**. Isso governa solubilidade (“semelhante dissolve semelhante”) e interações com membranas e solventes biológicos.
`,
          },
          {
            name: "Forças intermoleculares",
            content: `## Essencial

Dipolo-dipolo, London (dispersão) e **ponte de hidrogênio**. Em água e biomoléculas, H-bonds explicam ponto de ebulição alto, estrutura secundária de proteínas e pareamento de bases no DNA.
`,
          },
          {
            name: "Funções inorgânicas: ácidos, bases, sais, óxidos",
            content: `## Essencial

Classifique ácidos, bases, sais e óxidos e relacione com equilíbrio ácido-base corporal (tampões, pH sanguíneo ≈ 7,35–7,45). Arrhenius, Brønsted-Lowry e Lewis são camadas da mesma ideia.
`,
          },
          {
            name: "Reações químicas e balanceamento",
            content: `## Essencial

Conserve átomos e carga. Tipos comuns: síntese, decomposição, deslocamento, oxirredução. Balancear é pré-requisito de estequiometria e dose/concentração.
`,
          },
          {
            name: "Estequiometria",
            content: `## Essencial

Mol ↔ massa ↔ volume (gases) via coeficientes da equação. Em clínica e laboratório, a mesma lógica aparece em concentrações, diluições e cálculos de dose.
`,
          },
          {
            name: "Soluções: concentração, diluição, solubilidade",
            content: `## Essencial

Molaridade (mol/L), % m/v, ppm. Diluição: \(C_1V_1 = C_2V_2\). Solubilidade depende de temperatura e polaridade — base de soro, medicamentos e fluidos corporais.
`,
          },
          {
            name: "Termoquímica",
            content: `## Essencial

Reações **exotérmicas** liberam calor; **endotérmicas** absorvem. Entalpia (ΔH) e noção de energia livre ligam química a metabolismo energético.
`,
          },
          {
            name: "Cinética química",
            content: `## Essencial

Velocidade depende de concentração, temperatura, catalisador e superfície. Enzimas são catalisadores biológicos que baixam a energia de ativação.
`,
          },
          {
            name: "Equilíbrio químico",
            content: `## Essencial

Reações reversíveis tendem a um equilíbrio dinâmico (K). Princípio de Le Chatelier: o sistema reage a perturbações. Tampões e transporte de O₂/CO₂ usam esse raciocínio.
`,
          },
          {
            name: "Eletroquímica: pilhas e eletrólise",
            content: `## Essencial

Oxidação (perda de e⁻) e redução (ganho). Pilhas geram corrente espontânea; eletrólise força reações não espontâneas. Potenciais elétricos também aparecem em membranas celulares.
`,
          },
          {
            name: "Ácidos e bases: teorias, pH e pOH",
            content: `## Essencial

pH = −log[H₃O⁺]. Escala 0–14. Tampões (ex.: bicarbonato) resistam a mudanças bruscas de pH — conceito central em gasometria e acidose/alcalose.
`,
          },
        ],
      },
      {
        name: "Química Orgânica",
        topics: [
          "Cadeias carbônicas e nomenclatura IUPAC",
          "Funções orgânicas: álcoois, aldeídos, cetonas, ácidos carboxílicos, ésteres, aminas, amidas",
          "Isomeria (plana e espacial)",
          "Reações orgânicas principais: substituição, adição, eliminação",
          "Grupos funcionais relevantes para biomoléculas",
        ],
      },
      {
        name: "Ponte com a Bioquímica",
        topics: [
          "Estrutura e função de carboidratos, lipídeos, proteínas e ácidos nucleicos",
          "Enzimologia básica",
          "Principais vias metabólicas",
        ],
      },
    ],
  },
  {
    id: "fisica",
    name: "Física",
    tag: "FIS",
    blocks: [
      {
        name: "Mecânica",
        topics: [
          {
            name: "Cinemática e leis de Newton",
            content: `## Essencial

Cinemática descreve movimento (posição, velocidade, aceleração). Dinâmica explica causas: as **três leis de Newton**.

## Ponte médica

Marcha, trauma, biomecânica ortopédica e ergonomia usam essas ideias o tempo todo.
`,
          },
          {
            name: "Trabalho, energia e potência",
            content: `## Essencial

Trabalho = força × deslocamento (componente). Energia mecânica = cinética + potencial. Potência = energia/tempo. Conservação de energia é o fio condutor — inclusive no metabolismo (ATP).
`,
          },
          {
            name: "Estática e equilíbrio (base para biomecânica)",
            content: `## Essencial

Corpo em equilíbrio: resultante de forças e de torques = 0. Útil para postura, alavancas ósseas e análise de carga em articulações.
`,
          },
        ],
      },
      {
        name: "Fluidos",
        topics: [
          "Hidrostática: pressão, princípio de Pascal",
          "Hidrodinâmica (relevante para fluxo sanguíneo)",
        ],
      },
      {
        name: "Termodinâmica",
        topics: [
          "Temperatura, calor e trocas térmicas",
          "Leis da termodinâmica",
        ],
      },
      {
        name: "Ondas e Óptica",
        topics: [
          "Óptica geométrica (base para oftalmologia)",
          "Ondas sonoras (base para audição e ultrassom)",
        ],
      },
      {
        name: "Eletricidade e Magnetismo",
        topics: [
          "Corrente elétrica e circuitos básicos",
          "Bioeletricidade: potencial de ação (base para ECG/EEG)",
        ],
      },
      {
        name: "Física Moderna (noções)",
        topics: ["Radioatividade (base para radiologia e medicina nuclear)"],
      },
    ],
  },
  {
    id: "matematica",
    name: "Matemática & Estatística",
    tag: "MAT",
    blocks: [
      {
        name: "Fundamentos",
        topics: [
          {
            name: "Funções e interpretação de gráficos",
            content: `## Essencial

Função relaciona entrada → saída. Em Medicina você lê curvas de crescimento, dose-resposta, saturação de O₂ e tendências de exames. Identifique eixos, escala, tendência e outliers antes de concluir.
`,
          },
          {
            name: "Noções de cálculo (derivadas e integrais básicas)",
            content: `## Essencial

**Derivada** ≈ taxa de variação (ex.: velocidade de mudança de uma concentração). **Integral** ≈ acumulação (área sob a curva). Mesmo sem calcular à mão, o conceito ajuda a ler modelos e papers.
`,
          },
          {
            name: "Estatística descritiva: média, mediana, desvio padrão",
            content: `## Essencial

- Média: sensível a extremos
- Mediana: mais robusta em distribuições assimétricas
- Desvio padrão / IQR: dispersão

Sempre pergunte: a amostra é simétrica? Há outliers? O que o gráfico mostra além do número?
`,
          },
          {
            name: "Probabilidade básica",
            content: `## Essencial

Probabilidade de eventos, independência, regra do produto/soma. Sensibilidade, especificidade e valor preditivo são aplicações diretas no raciocínio diagnóstico.
`,
          },
          {
            name: "Interpretação de dados e gráficos (bioestatística)",
            content: `## Essencial

Leia eixos, intervalos de confiança e tamanho amostral. Correlação ≠ causalidade. Em evidência clínica, entenda risco relativo, NNT e limitações do estudo antes de mudar conduta.
`,
          },
        ],
      },
    ],
  },
  {
    id: "outras",
    name: "Outras Áreas Importantes",
    tag: "+",
    blocks: [
      {
        name: "Anatomia Humana (introdução)",
        topics: [
          {
            name: "Terminologia anatômica (planos, eixos, posições)",
            content: `## Essencial

Posição anatômica padrão: em pé, face e palmas à frente. Planos: sagital, coronal (frontal), transversal. Termos: medial/lateral, proximal/distal, anterior/posterior, superior/inferior.

## Dica

Decore o vocabulário cedo — ele aparece em todo exame físico e laudo.
`,
          },
          {
            name: "Visão geral dos sistemas do corpo humano",
            content: `## Essencial

Integre sistemas (cardio, resp, digestório, nervoso, endócrino, urinário, músculo-esquelético, imune, reprodutor) como redes cooperantes, não silos. Fisiologia e patologia sempre atravessam mais de um sistema.
`,
          },
        ],
      },
      {
        name: "Inglês Científico",
        topics: [
          "Vocabulário médico em inglês",
          "Leitura de artigos científicos (papers)",
        ],
      },
      {
        name: "Humanidades e Ética",
        topics: [
          "Bioética básica",
          "Saúde pública e sistema de saúde (ex: SUS)",
          "Comunicação e relação médico-paciente (introdução)",
        ],
      },
      {
        name: "Habilidades de Estudo",
        topics: [
          "Técnicas de memorização ativa (flashcards, repetição espaçada)",
          "Leitura crítica de artigos científicos",
          "Organização e gestão de tempo de estudo",
        ],
      },
    ],
  },
];
