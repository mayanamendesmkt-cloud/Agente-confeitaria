import { useState, useCallback } from "react";

// ─── GEMINI API ───────────────────────────────────────────────────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
async function callGemini(prompt, systemPrompt = "") {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      generationConfig: { maxOutputTokens: 4096, temperature: 0.8 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ${res.status}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM = `Você é o agente exclusivo de conteúdo da Anna Corinna, Chef Pâtissière com mais de 20 anos de experiência, formada em Gastronomia com especialização em Confeitaria e Chocolateria.

IDENTIDADE DA MARCA:
• Nome: Anna Corinna — "Douce et chocolat"
• Fundadora da Assúcar (1ª Associação da Confeitaria Pernambucana)
• +10.000 alunas certificadas | +223k seguidores Instagram | +38k YouTube
• Espaço Anna Corinna: coworking gastronômico em Recife
• Parceria Sebrae-PE no Espaço Confeitar (HFN)
• 3 frentes: Conteúdo Orgânico | Cursos de Confeitaria | Locação do Espaço

PÚBLICO: 90,9% feminino, 25–54 anos. Recife, SP, RJ, Salvador.
Anna fala DIRETAMENTE com a aluna/seguidora — segunda pessoa do singular, íntima mas com autoridade.

TOM DE VOZ:
• Sofisticado e acessível ao mesmo tempo
• Afetivo, inspirador, com autoridade técnica
• Usa o francês sutilmente: douce, chocolat, pâtisserie, mon amour, voilà...
• Trata as seguidoras como "pimentinhas" 🌶️
• Nunca genérico, nunca raso

PALAVRAS PROIBIDAS: incrível, arrasa, arrasou, conteúdo de valor, empoderar, empoderamento

PILARES: Educação técnica (40%) | Autoridade+Bastidor (30%) | Vendas (30%)

HOOKS QUE CONVERTEM: Pergunta provocativa | Dado/curiosidade técnica | Afirmação polêmica | Cena visual impactante

CTA: Sempre específico — nunca vago. Link na bio / curso / Espaço Anna Corinna.`;

// ─── DATAS COMEMORATIVAS ──────────────────────────────────────────────────────
const DATAS_FIXAS = {
  1: ["01/01 Ano Novo","06/01 Dia de Reis","Temporada de verão","Volta às aulas (fim do mês)"],
  2: ["02/02 Iemanjá (Bahia/PE)","Carnaval (data varia)","14/02 Dia dos Namorados (em alguns países)","Dia Mundial da Nutella (5/2)"],
  3: ["08/03 Dia Internacional da Mulher","20/03 Início do Outono","Páscoa (data varia)","Dia Mundial do Macaron (20/3)"],
  4: ["Páscoa (data varia)","21/04 Tiradentes","Semana Santa","Dia do Chocolate (7/4 — Dia Mundial da Saúde do Chocolate)"],
  5: ["01/05 Dia do Trabalho","Dia das Mães (2º domingo)","Festa Junina (preparação)","Dia Mundial do Croissant (30/1 — lembrete tardio)"],
  6: ["Festa Junina (mês inteiro)","12/06 Dia dos Namorados BR","29/06 São Pedro","Dia Mundial do Sorvete (1º domingo)"],
  7: ["Férias escolares","Festa Junina (início do mês)","Dia Mundial do Chocolate (7/7)","Dia do Brigadeiro (30/7)"],
  8: ["Dia dos Pais (2º domingo)","Dia Nacional do Sorvete (2/8)","Dia do Confeiteiro (5/8)","Mês do Cacau"],
  9: ["07/09 Independência do Brasil","Início da Primavera (22/9)","Dia do Mel (29/9)","Oktoberfest (fins do mês)"],
  10: ["12/10 Dia das Crianças","12/10 Nossa Senhora Aparecida","Halloween (31/10)","Dia do Doce (3/10)","Dia Nacional do Chocolate (28/10)"],
  11: ["02/11 Finados","15/11 Proclamação da República","Dia Nacional da Torta (26/11)","Black Friday (última sexta)","Início das festas de fim de ano"],
  12: ["Natal (25/12)","Réveillon (31/12)","Chocolates natalinos","Panetone","Alta temporada de encomendas"],
};

// ─── CHECKLIST DATA ───────────────────────────────────────────────────────────
const CHECKLIST = [
  { cat: "✍️ Texto", items: ["Hook para dentro dos primeiros 3 segundos (Reels) ou primeiras 2 linhas (legenda)","Tom da Anna: afetivo, técnico, sofisticado","Nenhuma palavra proibida usada","CTA específico — não vago","Seguidoras chamadas de pimentinhas (se couber)"] },
  { cat: "🎨 Visual", items: ["Identidade visual consistente com a marca","Qualidade de imagem/vídeo adequada","Texto sobreposto legível (se houver)","Thumbnail do Reel atrativa"] },
  { cat: "⚙️ Técnico", items: ["Tamanho correto (1:1 feed | 9:16 Reels/Stories)","Hashtags revisadas (máx 5 estratégicas)","Localização marcada (Recife, PE — se relevante)","Conta marcada quando aplicável","Legenda sem erros de digitação"] },
  { cat: "🎯 Estratégia", items: ["Alinhado ao pilar do mês","Distribuição 40/30/30 respeitada","Data e horário ideal de publicação definidos","Link na bio atualizado (se o CTA pede)"] },
];

// ─── HOOKS BANK ───────────────────────────────────────────────────────────────
const HOOKS = {
  "Educação Técnica": [
    "O erro que 90% das confeiteiras cometem ao derreter chocolate — e você provavelmente faz isso também.",
    "Você sabe a diferença entre ganache e trufa? A resposta vai mudar a sua confeitaria.",
    "Por que seu brigadeiro açucara? A resposta está na temperatura, não na receita.",
    "Essa técnica francesa de 3 passos transforma qualquer mousse em algo de vitrine.",
    "O ponto do caramelo que ninguém te ensinou — e é o que separa confeiteira de chef.",
  ],
  "Autoridade": [
    "20 anos de confeitaria me ensinaram uma coisa: técnica é libertade, não limitação.",
    "Formei mais de 10.000 alunas. O que todas as melhores tinham em comum? Isso aqui.",
    "Quando fundei a Assúcar, ninguém acreditava que Pernambuco viraria referência em confeitaria.",
    "Já apresentei em palcos do Brasil inteiro. O que mais me perguntam nos bastidores é isso.",
    "Minha formação em gastronomia me deu base. Mas o que realmente me formou foi isso aqui.",
  ],
  "Empreendedorismo": [
    "Precificar errado é trabalhar de graça. Te mostro a fórmula que uso com minhas alunas.",
    "A diferença entre confeiteira e empresária da confeitaria está em uma decisão.",
    "Você vende doce ou vende experiência? A resposta define o quanto você pode cobrar.",
    "Minha primeira encomenda grande me ensinou mais sobre negócios do que qualquer curso.",
    "Como sair do WhatsApp e criar um negócio de verdade na confeitaria — sem abandonar a cozinha.",
  ],
  "Bastidor": [
    "Bastidor real: o que acontece na minha cozinha antes de cada aula.",
    "Deixa eu te mostrar como é o Espaço Anna Corinna por dentro.",
    "Esse foi o dia mais caótico da minha vida profissional — e o que aprendi com ele.",
    "Preparação de uma vitrine de páscoa do zero. Vem comigo.",
    "O que eu jamais abriria mão na minha bancada de confeitaria.",
  ],
  "Vendas": [
    "As vagas para o próximo curso estão abertas — e fecham quando encher.",
    "Última turma do ano. Se você ainda não fez, essa é a sua chance.",
    "Quer confeitaria no seu currículo com o nome de quem formou mais de 10.000 alunas?",
    "O Espaço Anna Corinna está disponível para o seu próximo curso ou evento.",
    "Transformação real: o antes e depois de quem passou pelo meu método.",
  ],
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const getMesAtual = () => `${MESES[new Date().getMonth()]} de ${new Date().getFullYear()}`;
const getMesNum = () => new Date().getMonth() + 1;

// ─── SPINNER ──────────────────────────────────────────────────────────────────
function Spinner({ color = "#C4713A" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"2.5rem", gap:12 }}>
      <div style={{ width:40, height:40, border:`3px solid ${color}22`, borderTop:`3px solid ${color}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <span style={{ color, fontSize:12, fontStyle:"italic", opacity:0.8 }}>Preparando seu conteúdo...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── RESULT BOX ───────────────────────────────────────────────────────────────
function ResultBox({ text, accent }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ marginTop:"1.25rem", background:"rgba(255,255,255,0.03)", border:`1px solid ${accent}44`, borderRadius:14, overflow:"hidden" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.6rem 1rem", borderBottom:`1px solid ${accent}22`, background:`${accent}11` }}>
        <span style={{ fontSize:11, color:accent, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>Resultado</span>
        <button onClick={copy} style={{ background: copied ? `${accent}33` : "transparent", border:`1px solid ${accent}44`, borderRadius:6, padding:"3px 12px", color: copied ? accent : "#9B6B3A", fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>
          {copied ? "✓ Copiado!" : "Copiar"}
        </button>
      </div>
      <div style={{ padding:"1rem 1.25rem", whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.75, color:"#e8d5c0", fontFamily:"'Georgia', serif" }}>{text}</div>
    </div>
  );
}

// ─── ERROR BOX ────────────────────────────────────────────────────────────────
function ErrorBox({ msg }) {
  return (
    <div style={{ marginTop:"1rem", padding:"1rem", background:"rgba(178,34,34,0.1)", border:"1px solid rgba(178,34,34,0.3)", borderRadius:12, color:"#ff8080", fontSize:13 }}>
      ⚠️ {msg}
    </div>
  );
}

// ─── FIELD COMPONENT ─────────────────────────────────────────────────────────
function Field({ field, value, onChange }) {
  const base = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"0.65rem 0.9rem", color:"#e8d5c0", fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };
  return (
    <div style={{ marginBottom:"0.85rem" }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#9B6B3A", letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>{field.label}</label>
      {field.type === "select" ? (
        <select value={value||""} onChange={e => onChange(e.target.value)} style={{ ...base, cursor:"pointer" }}>
          <option value="">Selecione...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea value={value||""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder||""} rows={field.rows||3} style={{ ...base, resize:"vertical" }} />
      ) : (
        <input type="text" value={value||""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder||""} style={base} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 1 — CALENDÁRIO EDITORIAL
// ═══════════════════════════════════════════════════════════════════════════════
function CalendarioView() {
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FIELDS = [
    { name:"mes", label:"Mês e Ano", placeholder:"Ex: Abril de 2025" },
    { name:"foco", label:"Foco estratégico do mês", placeholder:"Ex: Lançamento do curso de páscoa, alta temporada de encomendas..." },
    { name:"produto", label:"Produto ou curso em destaque", placeholder:"Ex: Curso de Chocolate Belga, Kit Páscoa Premium..." },
    { name:"lancamento", label:"Tem lançamento?", type:"select", options:["Não","Sim — curso","Sim — produto","Sim — evento no Espaço"] },
    { name:"qtd", label:"Quantidade de posts", type:"select", options:["12 posts (3/semana)","16 posts (4/semana)","20 posts (5/semana)"] },
  ];

  const generate = async () => {
    if (!fields.mes || !fields.foco) { setError("Preencha pelo menos mês e foco estratégico."); return; }
    setLoading(true); setError(""); setResult("");
    const mesNum = MESES.indexOf(fields.mes?.split(" ")[0]) + 1 || getMesNum();
    const datas = (DATAS_FIXAS[mesNum] || []).join(" | ");
    try {
      const r = await callGemini(`Crie um calendário editorial completo para o Instagram da Anna Corinna.

MÊS: ${fields.mes}
FOCO ESTRATÉGICO: ${fields.foco}
PRODUTO/CURSO EM DESTAQUE: ${fields.produto || "Não especificado"}
LANÇAMENTO: ${fields.lancamento || "Não"}
QUANTIDADE: ${fields.qtd || "16 posts"}
DATAS COMEMORATIVAS DO MÊS: ${datas}

ENTREGUE:
1. TEMA CENTRAL DO MÊS (1 frase que resume a estratégia)
2. DISTRIBUIÇÃO: quantos posts por pilar (40% educação / 30% autoridade+bastidor / 30% vendas)
3. DESTAQUES DO MÊS: datas comemorativas relevantes para confeitaria com sugestão de pauta
4. GRADE SEMANAL (4 semanas):
   Semana X — Tema da semana
   • Post 1: [Pilar] — Tema específico — Formato (Reel 30s / Reel 60s / Carrossel / Arte estática)
   • Post 2: [Pilar] — Tema específico — Formato
   (continue para todos os posts da semana)
5. FRASE DO MÊS: uma frase de posicionamento no tom da Anna para usar nas comunicações`, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}. Verifique sua API Key e tente novamente.`); }
    setLoading(false);
  };

  return (
    <div>
      {FIELDS.map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#3B1A0A,#6B3A1A)", border:"1px solid #C4713A44", borderRadius:10, color:"#f0d5a0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", letterSpacing:0.5 }}>
        {loading ? "Gerando calendário..." : "📅 Gerar Calendário Editorial"}
      </button>
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner />}
      {result && <ResultBox text={result} accent="#C4713A" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 2 — TEMAS & FORMATOS
// ═══════════════════════════════════════════════════════════════════════════════
function TemasView() {
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FIELDS = [
    { name:"tema", label:"Tema do conteúdo", placeholder:"Ex: Temperagem do chocolate, Como precificar sua confeitaria..." },
    { name:"frente", label:"Frente de negócio", type:"select", options:["Conteúdo orgânico (Instagram/YouTube)","Cursos de confeitaria","Locação do Espaço Anna Corinna"] },
    { name:"pilar", label:"Pilar", type:"select", options:["Educação técnica","Autoridade e trajetória","Bastidor","Empreendedorismo feminino","Vendas e lançamentos"] },
    { name:"publico", label:"Público do post", type:"select", options:["Seguidoras em geral","Alunas e ex-alunas","Confeiteiras profissionais","Empresas (locação)"] },
  ];

  const generate = async () => {
    if (!fields.tema) { setError("Informe o tema do conteúdo."); return; }
    setLoading(true); setError(""); setResult("");
    try {
      const r = await callGemini(`Analise o tema e entregue a estratégia de formato ideal para a Anna Corinna.

TEMA: ${fields.tema}
FRENTE: ${fields.frente || "Conteúdo orgânico"}
PILAR: ${fields.pilar || "Educação técnica"}
PÚBLICO: ${fields.publico || "Seguidoras em geral"}

ENTREGUE:
1. FORMATO IDEAL: qual formato funciona melhor para esse tema (Reel 30s / Reel 60s+ / Carrossel / Arte estática / Stories) e por quê
2. FORMATO ALTERNATIVO: segundo melhor formato com justificativa
3. ANGULAGEM: como a Anna aborda esse tema com autoridade técnica — o ângulo único dela
4. GANCHO PRINCIPAL: a abertura perfeita para esse conteúdo (hook dos primeiros 3 segundos ou primeiras 2 linhas)
5. ESTRUTURA SUGERIDA: o esqueleto do post (do início ao CTA)
6. MELHOR MOMENTO PARA PUBLICAR: dia da semana e horário ideal`, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div>
      {FIELDS.map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#1A0A3B,#3A1A6B)", border:"1px solid #7A3BC444", borderRadius:10, color:"#d5a0f0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
        {loading ? "Analisando..." : "🎯 Definir Tema & Formato"}
      </button>
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner color="#7A3BC4" />}
      {result && <ResultBox text={result} accent="#7A3BC4" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 3 — ROTEIRO DE REELS
// ═══════════════════════════════════════════════════════════════════════════════
function RoteiroView() {
  const [activeTab, setActiveTab] = useState("30s");
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FIELDS_30 = [
    { name:"tema", label:"Tema do Reel", placeholder:"Ex: Por que seu brigadeiro fica mole demais" },
    { name:"objetivo", label:"Objetivo", type:"select", options:["Educar e gerar autoridade","Engajar e viralizar","Vender curso","Vender produto","Bastidor e conexão"] },
    { name:"frente", label:"Frente", type:"select", options:["Conteúdo orgânico","Curso","Espaço Anna Corinna"] },
  ];

  const FIELDS_60 = [
    ...FIELDS_30,
    { name:"produto", label:"Produto/curso mencionado (se houver)", placeholder:"Ex: Curso de Chocolateria Avançada" },
    { name:"estilo", label:"Estilo de gravação", type:"select", options:["Anna falando para câmera","Demonstração de técnica","Antes e depois","Tour pelo espaço","Bastidor real"] },
  ];

  const fields_atual = activeTab === "30s" ? FIELDS_30 : FIELDS_60;

  const generate = async () => {
    if (!fields.tema) { setError("Informe o tema do Reel."); return; }
    setLoading(true); setError(""); setResult("");
    const dur = activeTab === "30s" ? "30 segundos" : "60 a 90 segundos";
    try {
      const r = await callGemini(`Crie um roteiro completo de Reel de ${dur} para a Anna Corinna.

TEMA: ${fields.tema}
OBJETIVO: ${fields.objetivo || "Educar e gerar autoridade"}
FRENTE: ${fields.frente || "Conteúdo orgânico"}
${activeTab === "60s" ? `PRODUTO/CURSO: ${fields.produto || "Não especificado"}
ESTILO: ${fields.estilo || "Anna falando para câmera"}` : ""}

ENTREGUE O ROTEIRO COMPLETO:

HOOK (0–3s): [fala ou ação que para o scroll]
${activeTab === "30s" ? `DESENVOLVIMENTO (3–20s): [conteúdo principal com timecodes]
VIRADA (20–25s): [ponto de valor ou surpresa]
CTA (25–30s): [chamada para ação específica]` : `DESENVOLVIMENTO (3–40s): [conteúdo principal com timecodes detalhados]
APROFUNDAMENTO (40–60s): [detalhe técnico ou história]
VIRADA (60–70s): [ponto de valor ou surpresa]
CTA (70–${activeTab === "60s" ? "80" : "90"}s): [chamada para ação específica]`}

LEGENDA SUGERIDA: [legenda completa com hook, corpo e CTA]
THUMBNAIL SUGERIDA: [descrição do frame perfeito para a thumbnail]
TRILHA SUGERIDA: [estilo de música para o Reel]`, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:"1rem" }}>
        {["30s","60s+"].map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setResult(""); setError(""); }} style={{ flex:1, padding:"0.5rem", background: activeTab===t ? "rgba(122,59,28,0.4)" : "transparent", border:`1px solid ${activeTab===t ? "#7A3B1E" : "rgba(255,255,255,0.1)"}`, borderRadius:8, color: activeTab===t ? "#e8c99a" : "#9B6B3A", fontSize:12, fontWeight: activeTab===t ? 700 : 400, cursor:"pointer", transition:"all 0.15s" }}>
            🎬 Reel {t}
          </button>
        ))}
      </div>
      {fields_atual.map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#3B1A0A,#7A3B1E)", border:"1px solid #7A3B1E44", borderRadius:10, color:"#f0d5a0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
        {loading ? "Criando roteiro..." : "🎬 Gerar Roteiro"}
      </button>
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner color="#7A3B1E" />}
      {result && <ResultBox text={result} accent="#7A3B1E" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 4 — AGENDA DE CURSOS
// ═══════════════════════════════════════════════════════════════════════════════
function CursosView() {
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FIELDS = [
    { name:"nome", label:"Nome do curso", placeholder:"Ex: Chocolateria Belga do Zero ao Avançado" },
    { name:"data", label:"Data e duração", placeholder:"Ex: 15 e 16 de abril — 2 dias — 8h cada" },
    { name:"conteudo", label:"O que será ensinado", type:"textarea", placeholder:"Ex: Temperagem, ganaches, trufas, pralinés, bombons recheados...", rows:3 },
    { name:"vagas", label:"Vagas e investimento", placeholder:"Ex: 12 vagas — R$890 (inclui material)" },
    { name:"modalidade", label:"Modalidade", type:"select", options:["Presencial — Espaço Anna Corinna","Presencial — outro local","Online ao vivo","Online gravado","Híbrido"] },
    { name:"nivel", label:"Nível", type:"select", options:["Iniciante","Intermediário","Avançado","Todos os níveis"] },
    { name:"transformacao", label:"Principal transformação da aluna", placeholder:"Ex: Sair do curso produzindo bombons de vitrine e precificando corretamente" },
  ];

  const generate = async () => {
    if (!fields.nome || !fields.data) { setError("Preencha pelo menos nome e data do curso."); return; }
    setLoading(true); setError(""); setResult("");
    try {
      const r = await callGemini(`Crie o kit completo de comunicação para o curso da Anna Corinna.

CURSO: ${fields.nome}
DATA: ${fields.data}
CONTEÚDO: ${fields.conteudo || "Não especificado"}
VAGAS E INVESTIMENTO: ${fields.vagas || "Não especificado"}
MODALIDADE: ${fields.modalidade || "Presencial"}
NÍVEL: ${fields.nivel || "Todos os níveis"}
TRANSFORMAÇÃO: ${fields.transformacao || "Não especificada"}

ENTREGUE:

1. POST DE LANÇAMENTO (Feed):
   Hook + Desenvolvimento + Detalhes do curso + CTA com urgência

2. ROTEIRO DE REEL DE CHAMADA (30s):
   Hook (0–3s) | Desenvolvimento (3–20s) | CTA (20–30s)

3. SEQUÊNCIA DE STORIES (5 telas):
   Tela 1 a 5 com texto de cada tela e elemento interativo sugerido

4. TEXTO PARA LINK DA BIO:
   Versão curta para atualizar durante o período de inscrições

5. MENSAGEM DE ABERTURA DE VAGAS (WhatsApp/DM):
   Para enviar para lista de interessadas`, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div>
      {FIELDS.map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#0A2B1A,#1A6B3A)", border:"1px solid #2D6B3A44", borderRadius:10, color:"#a0f0c0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
        {loading ? "Criando kit do curso..." : "🎓 Gerar Kit do Curso"}
      </button>
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner color="#2D6B3A" />}
      {result && <ResultBox text={result} accent="#2D6B3A" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 5 — LOCAÇÃO DO ESPAÇO
// ═══════════════════════════════════════════════════════════════════════════════
function EspacoView() {
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FIELDS = [
    { name:"tipo", label:"Tipo de uso", type:"select", options:["Curso externo (outro professor)","Evento corporativo gastronômico","Gravação de vídeo/foto","Workshop ou imersão","Confraternização gastronômica","Outro"] },
    { name:"publico_alvo", label:"Público-alvo da locação", type:"select", options:["Confeiteiras e professoras independentes","Empresas do setor gastronômico","Marcas de alimentos e insumos","Produtoras de conteúdo gastronômico","Público geral"] },
    { name:"diferenciais", label:"Diferenciais a destacar", type:"textarea", placeholder:"Ex: cozinha equipada, ambiente instagramável, localização central em Recife, capacidade X pessoas...", rows:2 },
    { name:"cta", label:"CTA desejado", type:"select", options:["Solicitar orçamento por DM","Acessar link na bio","Ligar/WhatsApp direto","Preencher formulário"] },
  ];

  const generate = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const r = await callGemini(`Crie o kit de comunicação para divulgação da locação do Espaço Anna Corinna.

TIPO DE USO: ${fields.tipo || "Curso externo"}
PÚBLICO-ALVO: ${fields.publico_alvo || "Confeiteiras e professoras independentes"}
DIFERENCIAIS: ${fields.diferenciais || "Cozinha profissional completa, ambiente sofisticado e instagramável, Recife-PE"}
CTA: ${fields.cta || "Solicitar orçamento por DM"}

O Espaço Anna Corinna é um coworking gastronômico sofisticado em Recife, ideal para cursos, workshops, gravações e eventos do setor gastronômico. Parceria com Sebrae-PE no Espaço Confeitar.

ENTREGUE:

1. POST DE DIVULGAÇÃO (Feed):
   Abordagem profissional e aspiracional — o espaço como solução para quem quer crescer

2. ROTEIRO DE REEL DE TOUR (60s):
   Tour virtual pelo espaço com narração da Anna

3. STORIES DE APRESENTAÇÃO (4 telas):
   Uma sequência que vende o espaço

4. MENSAGEM B2B (para empresas):
   Tom mais formal, focado em resultados e estrutura

5. LEGENDA PARA FOTO DO ESPAÇO:
   Versão aspiracional para posts de feed`, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div>
      {FIELDS.map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#0A1A2B,#1A3A6B)", border:"1px solid #1A3A6B44", borderRadius:10, color:"#a0c0f0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
        {loading ? "Criando kit do espaço..." : "🏛️ Gerar Kit do Espaço"}
      </button>
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner color="#2D5B9A" />}
      {result && <ResultBox text={result} accent="#2D5B9A" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 6 — LEGENDA
// ═══════════════════════════════════════════════════════════════════════════════
function LegendaView() {
  const [activeTab, setActiveTab] = useState("educativo");
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tabs = [
    { id:"educativo", label:"📚 Educativo" },
    { id:"autoridade", label:"👑 Autoridade" },
    { id:"venda", label:"💰 Venda" },
  ];

  const FIELDS = [
    { name:"tema", label:"Tema do post", placeholder:"Ex: Como fazer ganache perfeita, Abertura de vagas do curso..." },
    { name:"formato", label:"Formato do post", type:"select", options:["Reel curto (30s)","Reel longo (60s+)","Carrossel","Arte estática","Stories"] },
    { name:"produto", label:"Produto/curso mencionado (se houver)", placeholder:"Opcional" },
  ];

  const tipos = { educativo:"educativo e técnico", autoridade:"de autoridade e trajetória", venda:"de vendas com urgência e prova social" };

  const generate = async () => {
    if (!fields.tema) { setError("Informe o tema do post."); return; }
    setLoading(true); setError(""); setResult("");
    try {
      const r = await callGemini(`Crie uma legenda ${tipos[activeTab]} para o Instagram da Anna Corinna.

TEMA: ${fields.tema}
FORMATO: ${fields.formato || "Reel"}
PRODUTO/CURSO: ${fields.produto || "Não especificado"}

ENTREGUE:
1. VERSÃO COMPLETA:
   • Hook (primeiras 2 linhas — força o "ver mais")
   • Desenvolvimento (corpo da legenda)
   • CTA específico
   • 5 hashtags estratégicas

2. VERSÃO CURTA (para Reels):
   • Máx 3 linhas + CTA + 3 hashtags`, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:"1rem", flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setResult(""); setError(""); }} style={{ flex:1, padding:"0.5rem", background: activeTab===t.id ? "rgba(196,113,58,0.3)" : "transparent", border:`1px solid ${activeTab===t.id ? "#C4713A" : "rgba(255,255,255,0.1)"}`, borderRadius:8, color: activeTab===t.id ? "#e8c99a" : "#9B6B3A", fontSize:12, fontWeight: activeTab===t.id ? 700 : 400, cursor:"pointer", transition:"all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>
      {FIELDS.map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#3B1A0A,#C4713A55)", border:"1px solid #C4713A44", borderRadius:10, color:"#f0d5a0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
        {loading ? "Criando legenda..." : "✍️ Gerar Legenda"}
      </button>
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner color="#C4713A" />}
      {result && <ResultBox text={result} accent="#C4713A" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 7 — STORIES
// ═══════════════════════════════════════════════════════════════════════════════
function StoriesView() {
  const [activeTab, setActiveTab] = useState("original");
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FIELDS_ORIG = [
    { name:"tema", label:"Tema dos stories", placeholder:"Ex: Bastidor do preparo do curso, Dica rápida de chocolate..." },
    { name:"objetivo", label:"Objetivo", type:"select", options:["Engajar seguidoras","Vender curso","Divulgar o Espaço","Bastidor e conexão","Informar datas/novidades"] },
    { name:"qtd", label:"Quantidade de telas", type:"select", options:["3 telas","5 telas","7 telas","10 telas"] },
  ];

  const FIELDS_ADAPT = [
    { name:"conteudo", label:"Cole o conteúdo para adaptar", type:"textarea", placeholder:"Cole aqui o texto do post, legenda ou roteiro para transformar em stories...", rows:5 },
    { name:"qtd", label:"Quantidade de telas", type:"select", options:["3 telas","5 telas","7 telas"] },
  ];

  const generate = async () => {
    if (activeTab === "original" && !fields.tema) { setError("Informe o tema."); return; }
    if (activeTab === "adaptar" && !fields.conteudo) { setError("Cole o conteúdo para adaptar."); return; }
    setLoading(true); setError(""); setResult("");
    try {
      const prompt = activeTab === "original"
        ? `Crie uma sequência de ${fields.qtd || "5 telas"} de Stories para o Instagram da Anna Corinna.
TEMA: ${fields.tema}
OBJETIVO: ${fields.objetivo || "Engajar seguidoras"}

Para cada tela entregue:
TELA X:
• Texto principal (curto, impactante)
• Elemento interativo sugerido (enquete / caixa de pergunta / contador / quiz / emoji slider)
• Sugestão visual (cor de fundo, sticker, elemento gráfico)`
        : `Adapte o conteúdo abaixo para uma sequência de ${fields.qtd || "5 telas"} de Stories da Anna Corinna.
CONTEÚDO ORIGINAL:
${fields.conteudo}

Para cada tela entregue:
TELA X:
• Texto adaptado (curto e direto para stories)
• Elemento interativo sugerido
• Sugestão visual`;
      const r = await callGemini(prompt, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:"1rem" }}>
        {[{id:"original",label:"✨ Criar do Zero"},{id:"adaptar",label:"🔄 Adaptar Conteúdo"}].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setResult(""); setError(""); setFields({}); }} style={{ flex:1, padding:"0.5rem", background: activeTab===t.id ? "rgba(139,105,20,0.3)" : "transparent", border:`1px solid ${activeTab===t.id ? "#8B6914" : "rgba(255,255,255,0.1)"}`, borderRadius:8, color: activeTab===t.id ? "#e8c99a" : "#9B6B3A", fontSize:12, fontWeight: activeTab===t.id ? 700 : 400, cursor:"pointer" }}>
            {t.label}
          </button>
        ))}
      </div>
      {(activeTab === "original" ? FIELDS_ORIG : FIELDS_ADAPT).map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
      <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#2B1A0A,#8B6914)", border:"1px solid #8B691444", borderRadius:10, color:"#f0d5a0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
        {loading ? "Criando stories..." : "📱 Gerar Stories"}
      </button>
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner color="#8B6914" />}
      {result && <ResultBox text={result} accent="#8B6914" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 8 — BANCO DE HOOKS
// ═══════════════════════════════════════════════════════════════════════════════
function HooksView() {
  const [activeTab, setActiveTab] = useState("banco");
  const [activeCat, setActiveCat] = useState(Object.keys(HOOKS)[0]);
  const [copied, setCopied] = useState(null);
  const [fields, setFields] = useState({});
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const copy = (text, idx) => { navigator.clipboard.writeText(text); setCopied(idx); setTimeout(() => setCopied(null), 1500); };

  const FIELDS_GEN = [
    { name:"tema", label:"Tema do conteúdo", placeholder:"Ex: Chocolate branco não é chocolate de verdade" },
    { name:"estilo", label:"Estilo do hook", type:"select", options:["Pergunta provocativa","Dado ou curiosidade técnica","Afirmação polêmica","Confissão pessoal da Anna","Erro comum revelado","Promessa de transformação"] },
    { name:"formato", label:"Para qual formato", type:"select", options:["Reels (fala nos primeiros 3s)","Legenda de feed (primeiras 2 linhas)","Stories (primeira tela)","Carrossel (capa do slide)"] },
    { name:"qtd", label:"Quantas opções", type:"select", options:["3 opções","5 opções","7 opções"] },
  ];

  const generate = async () => {
    if (!fields.tema) { setError("Informe o tema."); return; }
    setLoading(true); setError(""); setResult("");
    try {
      const r = await callGemini(`Crie ${fields.qtd || "5 opções"} de hooks para o Instagram da Anna Corinna.
TEMA: ${fields.tema}
ESTILO: ${fields.estilo || "Pergunta provocativa"}
FORMATO: ${fields.formato || "Reels"}

Para cada hook:
• HOOK [número]: [o hook pronto para usar]
• Gatilho: [qual gatilho psicológico usa e por que funciona]`, SYSTEM);
      setResult(r);
    } catch(e) { setError(`Erro ao gerar: ${e.message}`); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:"1rem" }}>
        {[{id:"banco",label:"📚 Banco por Pilar"},{id:"gerador",label:"✍️ Gerar Hook"}].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setResult(""); setError(""); }} style={{ flex:1, padding:"0.5rem", background: activeTab===t.id ? "rgba(139,105,20,0.3)" : "transparent", border:`1px solid ${activeTab===t.id ? "#8B6914" : "rgba(255,255,255,0.1)"}`, borderRadius:8, color: activeTab===t.id ? "#e8c99a" : "#9B6B3A", fontSize:12, fontWeight: activeTab===t.id ? 700 : 400, cursor:"pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "banco" && (
        <>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1rem" }}>
            {Object.keys(HOOKS).map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{ background: activeCat===cat ? "rgba(139,105,20,0.3)" : "transparent", border:`1px solid ${activeCat===cat ? "#8B6914" : "rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"0.35rem 0.8rem", color: activeCat===cat ? "#e8c99a" : "#9B6B3A", cursor:"pointer", fontSize:11, fontWeight: activeCat===cat ? 700 : 400 }}>{cat}</button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {HOOKS[activeCat].map((hook, i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"0.75rem 1rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:13, color:"#c9a882", lineHeight:1.5, flex:1 }}>{hook}</span>
                <button onClick={() => copy(hook, i)} style={{ background: copied===i ? "rgba(139,105,20,0.3)" : "transparent", border:`1px solid ${copied===i ? "#8B6914" : "rgba(255,255,255,0.1)"}`, borderRadius:6, padding:"3px 10px", color: copied===i ? "#e8c99a" : "#9B6B3A", fontSize:10, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                  {copied===i ? "✓" : "Copiar"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "gerador" && (
        <>
          {FIELDS_GEN.map(f => <Field key={f.name} field={f} value={fields[f.name]} onChange={v => setFields(p => ({...p,[f.name]:v}))} />)}
          <button onClick={generate} disabled={loading} style={{ width:"100%", padding:"0.8rem", background:"linear-gradient(135deg,#2B1A0A,#8B6914)", border:"1px solid #8B691444", borderRadius:10, color:"#f0d5a0", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "Gerando hooks..." : "🎣 Gerar Hooks"}
          </button>
          {error && <ErrorBox msg={error} />}
          {loading && <Spinner color="#8B6914" />}
          {result && <ResultBox text={result} accent="#8B6914" />}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 9 — HOT TOPICS
// ═══════════════════════════════════════════════════════════════════════════════
function HotTopicsView() {
  const [topics, setTopics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTopics = async () => {
    setLoading(true); setError(""); setTopics(null);
    try {
      const mes = getMesAtual();
      const mesNum = getMesNum();
      const datas = (DATAS_FIXAS[mesNum] || []).join(", ");
      const text = await callGemini(`Para o mês de ${mes}, liste exatamente 6 tendências de conteúdo para uma Chef Pâtissière no Instagram brasileiro.
Datas do mês: ${datas}

Responda APENAS com JSON válido, sem texto adicional, sem markdown:
{"topics":[{"tema":"nome do tema","temperatura":"quente","motivo":"por que está em alta — 1 linha"},{"tema":"nome","temperatura":"morno","motivo":"explicação"},{"tema":"nome","temperatura":"frio","motivo":"explicação"}]}
Use temperatura: "quente", "morno" ou "frio". Retorne exatamente 6 tópicos.`);
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setTopics(parsed.topics || []);
    } catch(e) { setError(`Erro ao buscar tendências: ${e.message}`); }
    setLoading(false);
  };

  const cfg = {
    quente: { emoji:"🔥", label:"Quente", color:"#B22222", bg:"rgba(178,34,34,0.1)", bar:"#ff4444", w:"90%" },
    morno:  { emoji:"🌡️", label:"Morno",  color:"#C4713A", bg:"rgba(196,113,58,0.1)", bar:"#f0a050", w:"55%" },
    frio:   { emoji:"❄️", label:"Frio",   color:"#4A90D9", bg:"rgba(74,144,217,0.1)", bar:"#4A90D9", w:"20%" },
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", color:"#e8c99a", fontWeight:700, fontSize:"1rem" }}>Radar de Tendências</div>
          <div style={{ fontSize:11, color:"#7A5C3A", marginTop:2 }}>{getMesAtual()}</div>
        </div>
        <button onClick={fetchTopics} disabled={loading} style={{ background: loading ? "rgba(178,34,34,0.2)" : "linear-gradient(135deg,#8B1111,#B22222)", border:"none", borderRadius:10, padding:"0.5rem 1.1rem", color:"#fff", fontSize:12, fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow: loading ? "none" : "0 4px 14px rgba(178,34,34,0.3)" }}>
          {loading ? "Analisando..." : topics ? "🔄 Atualizar" : "🔥 Analisar Mês"}
        </button>
      </div>

      {!topics && !loading && !error && (
        <div style={{ textAlign:"center", padding:"3rem 1rem", background:"rgba(178,34,34,0.05)", border:"1px solid rgba(178,34,34,0.15)", borderRadius:16 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🔥</div>
          <p style={{ fontFamily:"'Playfair Display',serif", color:"#c9a882", fontStyle:"italic", fontSize:"0.9rem" }}>
            Clique em "Analisar Mês" para ver o que está em alta para a Anna Corinna.
          </p>
        </div>
      )}
      {error && <ErrorBox msg={error} />}
      {loading && <Spinner color="#B22222" />}
      {topics && !loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {topics.map((t, i) => {
            const c = cfg[t.temperatura] || cfg.frio;
            return (
              <div key={i} style={{ background:c.bg, border:`1px solid ${c.color}33`, borderRadius:12, padding:"0.85rem 1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color:"#e8c99a", flex:1, paddingRight:8 }}>{t.tema}</div>
                  <div style={{ background:c.color, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, color:"#fff", whiteSpace:"nowrap" }}>{c.emoji} {c.label}</div>
                </div>
                <div style={{ fontSize:11, color:"#9B6B3A", marginBottom:7, lineHeight:1.4 }}>{t.motivo}</div>
                <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:5, overflow:"hidden" }}>
                  <div style={{ width:c.w, height:"100%", background:c.bar, borderRadius:99, transition:"width 1s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABA 10 — CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════════
function ChecklistView() {
  const [checked, setChecked] = useState({});
  const total = CHECKLIST.reduce((a, c) => a + c.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);

  return (
    <div>
      <div style={{ marginBottom:"1.25rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:12, color:"#9B6B3A" }}>{done} de {total} itens</span>
          <span style={{ fontSize:12, fontWeight:700, color: pct===100 ? "#6fcf8a" : "#C4713A" }}>{pct}%</span>
        </div>
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:8, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background: pct===100 ? "linear-gradient(90deg,#2D6B3A,#6fcf8a)" : "linear-gradient(90deg,#C4713A,#f0a050)", borderRadius:99, transition:"width 0.4s ease" }} />
        </div>
        {pct===100 && <div style={{ marginTop:8, textAlign:"center", color:"#6fcf8a", fontSize:13, fontWeight:700 }}>✅ Pode publicar, pimentinha! 🌶️</div>}
      </div>

      {CHECKLIST.map((cat, ci) => (
        <div key={ci} style={{ marginBottom:"1.25rem" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#7A5C3A", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{cat.cat}</div>
          {cat.items.map((item, ii) => {
            const key = `${ci}-${ii}`;
            return (
              <div key={key} onClick={() => setChecked(p => ({...p,[key]:!p[key]}))} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"0.6rem 0.75rem", borderRadius:8, marginBottom:4, cursor:"pointer", background: checked[key] ? "rgba(45,107,58,0.12)" : "rgba(255,255,255,0.02)", border:`1px solid ${checked[key] ? "rgba(45,107,58,0.25)" : "rgba(255,255,255,0.06)"}`, transition:"all 0.15s" }}>
                <div style={{ width:17, height:17, borderRadius:5, border:`2px solid ${checked[key] ? "#6fcf8a" : "rgba(255,255,255,0.2)"}`, background: checked[key] ? "#2D6B3A" : "transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {checked[key] && <span style={{ color:"#6fcf8a", fontSize:10, fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:12, color: checked[key] ? "#6b8f73" : "#c9a882", textDecoration: checked[key] ? "line-through" : "none", lineHeight:1.5 }}>{item}</span>
              </div>
            );
          })}
        </div>
      ))}

      <button onClick={() => setChecked({})} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"0.4rem 1rem", color:"#6b4c35", cursor:"pointer", fontSize:12, marginTop:4 }}>
        Resetar checklist
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const TOOLS = [
  { id:"calendario", icon:"📅", label:"Calendário", sublabel:"Editorial Mensal",    accent:"#C4713A", component: CalendarioView },
  { id:"temas",      icon:"🎯", label:"Temas",      sublabel:"Formatos & Ângulos",  accent:"#7A3BC4", component: TemasView },
  { id:"roteiro",    icon:"🎬", label:"Roteiro",    sublabel:"Reels 30s & 60s+",    accent:"#7A3B1E", component: RoteiroView },
  { id:"cursos",     icon:"🎓", label:"Cursos",     sublabel:"Agenda & Kit",        accent:"#2D6B3A", component: CursosView },
  { id:"espaco",     icon:"🏛️", label:"Espaço",     sublabel:"Locação & Divulgação",accent:"#2D5B9A", component: EspacoView },
  { id:"legenda",    icon:"✍️", label:"Legenda",    sublabel:"Feed & Reels",        accent:"#C4713A", component: LegendaView },
  { id:"stories",    icon:"📱", label:"Stories",    sublabel:"Sequências",          accent:"#8B6914", component: StoriesView },
  { id:"hooks",      icon:"🎣", label:"Hooks",      sublabel:"Banco & Gerador",     accent:"#8B6914", component: HooksView },
  { id:"hottopics",  icon:"🔥", label:"Hot Topics", sublabel:"Tendências do Mês",   accent:"#B22222", component: HotTopicsView },
  { id:"checklist",  icon:"✅", label:"Checklist",  sublabel:"Antes de Publicar",   accent:"#2D6B3A", component: ChecklistView },
];

export default function AnnaCorinnaAgente() {
  const [activeTool, setActiveTool] = useState(null);
  const tool = TOOLS.find(t => t.id === activeTool);
  const Component = tool?.component;

  const row1 = TOOLS.slice(0, 5);
  const row2 = TOOLS.slice(5);

  return (
    <div style={{ minHeight:"100vh", background:"#0d0703", fontFamily:"'Lato',sans-serif", color:"#f0e0cc" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:"linear-gradient(180deg,#1a0c05 0%,#0d0703 100%)", borderBottom:"1px solid rgba(196,113,58,0.15)", padding:"1.25rem 1rem 1rem", textAlign:"center" }}>
        <div style={{ fontSize:10, letterSpacing:5, color:"#7A5C3A", textTransform:"uppercase", marginBottom:5 }}>Agente Exclusivo de Conteúdo</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.4rem,4vw,2rem)", fontWeight:700, margin:"0 0 3px", background:"linear-gradient(90deg,#c9a882,#f0d5a0,#C4713A)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Anna Corinna</h1>
        <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", color:"#5C3A1E", fontSize:12, letterSpacing:3 }}>Douce et chocolat 🍫</div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"1.25rem 0.75rem" }}>

        {/* Nav Row 1 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"0.4rem", marginBottom:"0.4rem" }}>
          {row1.map(t => (
            <button key={t.id} onClick={() => setActiveTool(activeTool===t.id ? null : t.id)} style={{ background: activeTool===t.id ? `${t.accent}cc` : "rgba(255,255,255,0.03)", border:`1.5px solid ${activeTool===t.id ? t.accent : "rgba(255,255,255,0.07)"}`, borderRadius:12, padding:"0.65rem 0.3rem", cursor:"pointer", textAlign:"center", color: activeTool===t.id ? "#fff" : "#9B6B3A", transition:"all 0.2s" }}>
              <div style={{ fontSize:"clamp(1rem,2.5vw,1.3rem)", marginBottom:3 }}>{t.icon}</div>
              <div style={{ fontSize:"clamp(9px,1.5vw,11px)", fontWeight:700, letterSpacing:0.5 }}>{t.label}</div>
              <div style={{ fontSize:"clamp(7px,1.2vw,9px)", opacity:0.7, marginTop:1 }}>{t.sublabel}</div>
            </button>
          ))}
        </div>

        {/* Nav Row 2 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"0.4rem", marginBottom:"1.25rem" }}>
          {row2.map(t => (
            <button key={t.id} onClick={() => setActiveTool(activeTool===t.id ? null : t.id)} style={{ background: activeTool===t.id ? `${t.accent}cc` : "rgba(255,255,255,0.03)", border:`1.5px solid ${activeTool===t.id ? t.accent : "rgba(255,255,255,0.07)"}`, borderRadius:12, padding:"0.65rem 0.3rem", cursor:"pointer", textAlign:"center", color: activeTool===t.id ? "#fff" : "#9B6B3A", transition:"all 0.2s" }}>
              <div style={{ fontSize:"clamp(1rem,2.5vw,1.3rem)", marginBottom:3 }}>{t.icon}</div>
              <div style={{ fontSize:"clamp(9px,1.5vw,11px)", fontWeight:700, letterSpacing:0.5 }}>{t.label}</div>
              <div style={{ fontSize:"clamp(7px,1.2vw,9px)", opacity:0.7, marginTop:1 }}>{t.sublabel}</div>
            </button>
          ))}
        </div>

        {/* Welcome */}
        {!activeTool && (
          <div style={{ textAlign:"center", padding:"3rem 1rem", background:"rgba(255,255,255,0.01)", border:"1px solid rgba(196,113,58,0.08)", borderRadius:20 }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🍫</div>
            <p style={{ fontFamily:"'Playfair Display',serif", color:"#7A5C3A", fontStyle:"italic", fontSize:"0.95rem", lineHeight:1.7 }}>
              Selecione um módulo acima para começar<br/>a criar conteúdo para as pimentinhas. 🌶️
            </p>
          </div>
        )}

        {/* Active Tool */}
        {tool && Component && (
          <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${tool.accent}22`, borderRadius:18, padding:"1.5rem" }}>
            <div style={{ marginBottom:"1.25rem", paddingBottom:"0.85rem", borderBottom:`1px solid ${tool.accent}22` }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.1rem", color:"#e8c99a" }}>
                {tool.icon} {tool.label}
              </div>
              <div style={{ fontSize:12, color:"#7A5C3A", marginTop:3 }}>{tool.sublabel}</div>
            </div>
            <Component />
          </div>
        )}

      </div>
    </div>
  );
}
