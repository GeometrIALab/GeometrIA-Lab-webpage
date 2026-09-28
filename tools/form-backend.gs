/**
 * GeometrIA — back-end do formulário "Colabore" (Google Apps Script).
 *
 * O que faz (por enquanto, só isto)
 *   Cada proposta enviada pelo site vira um e-mail para a conta do laboratório, com o
 *   PDF anexado. Não há planilha, pasta de arquivos nem triagem automática: a equipe
 *   leva a proposta do e-mail para o Claude à mão (roteiro em tools/triagem-manual.md).
 *
 * O e-mail
 *   • Assunto: "[GeometrIA][CBG] GIA-2026-0007 — título". O [CBG] aparece quando o
 *     proponente é membro do CBG, que tem prioridade na padronização.
 *   • Corpo em texto simples, em três partes: um resumo (ID, data, pedidos extras, PDF);
 *     o bloco PROPONENTE, com os dados pessoais; e o bloco PROPOSTA — só o projeto, sem
 *     dados pessoais, pronto para colar no Claude junto com o PDF.
 *   • Responder ao e-mail responde direto ao proponente (Reply-To).
 *
 * Proteções: campo-armadilha e tempo mínimo contra robôs; validação dos campos; limite
 * de envios por hora; reenvio da mesma proposta ignorado (submission_id); o anexo precisa
 * ser um PDF de verdade, com até MAX_PDF_MB. Se o e-mail não puder ser enviado, o site
 * mostra um erro com o endereço do laboratório — nenhuma proposta some em silêncio.
 *
 * Instalação (~5 min) — passo a passo no README, seção "Formulário".
 *   1. Com a conta Google que vai enviar os e-mails, abra https://script.google.com → Novo projeto.
 *   2. Apague o conteúdo de Código.gs, cole este arquivo e salve.
 *   3. Execute a função `setup` e autorize o envio de e-mail.
 *   4. Implantar → Nova implantação → tipo "App da Web":
 *        Executar como: Eu  ·  Quem pode acessar: Qualquer pessoa.
 *      Copie o URL que termina em /exec e cole em `endpoint`, no _data/form.yml do site.
 *   5. (Opcional) Execute `testSubmission`: chega uma proposta de teste no e-mail do laboratório.
 *
 * Propriedade do script (opcional)
 *   LAB_EMAIL   quem recebe as propostas (padrão: geometria.lab@cbg.unicamp.br)
 *
 * Ao alterar este código: Implantar → Gerenciar implantações → editar (lápis) →
 * Versão: "Nova versão" → Implantar. Assim o URL /exec continua o mesmo.
 */

// ───────────────────────────── Configuração ─────────────────────────────

const DEFAULT_LAB_EMAIL = 'geometria.lab@cbg.unicamp.br';
const TZ = 'America/Sao_Paulo';

const MAX_PDF_MB = 10;                  // igual a max_pdf_mb em _data/form.yml
const MAX_TEXT = 20000;                 // caracteres por campo de texto longo
const MAX_PER_EMAIL_PER_HOUR = 5;       // limite de envios por e-mail, por hora
const MAX_PER_HOUR = 60;                // limite global de envios por hora

const INTERESTS = ['Propor um problema', 'Começar a usar IA', 'Os dois'];

// ───────────────────────────── Web app ─────────────────────────────

/** Teste rápido do URL /exec no navegador. */
function doGet() {
  return json_({ ok: true, service: 'GeometrIA — formulário Colabore', time: new Date().toISOString() });
}

/** Recebe uma proposta do site (JSON enviado como text/plain). */
function doPost(e) {
  let data = null;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '');
  } catch (err) {
    return json_({ ok: false, error: 'bad-request' });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json_({ ok: false, error: 'bad-request' });
  try {
    return json_(handleSubmission_(data));
  } catch (err) {
    console.error('doPost', err && err.stack ? err.stack : err);
    return json_({ ok: false, error: 'server' });
  }
}

function handleSubmission_(data) {
  // Robôs: campo oculto preenchido, ou envio rápido demais (ou sem o tempo que o site sempre
  // manda). Finge sucesso e não envia nada.
  if (clean_(data.website, 200) || !(Number(data.elapsed_ms) >= 2500)) return { ok: true, id: '' };

  const p = normalize_(data);
  const bad = validate_(p);
  if (bad.length) return { ok: false, error: 'invalid', fields: bad };

  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    // O site pode reenviar a mesma proposta (sem ler a resposta, se o CORS falhar): a cópia
    // devolve o mesmo ID e não gera outro e-mail. O ID só é memorizado depois do envio, e o
    // bloqueio vale até lá — assim uma cópia simultânea espera e encontra o ID pronto.
    const subKey = p.submission_id ? 'sub_' + p.submission_id : '';
    if (subKey) {
      const prev = cache.get(subKey);
      if (prev) return { ok: true, id: prev };
    }
    if (!rateOk_(cache, p.email)) return { ok: false, error: 'rate' };
    const id = nextId_();
    const pdf = data.pdf && data.pdf.data ? checkPdf_(data.pdf, id) : null;
    try {
      sendToLab_(p, id, pdf);
    } catch (err) {
      console.error('sendToLab_', id, err && err.stack ? err.stack : err);
      return { ok: false, error: 'mail' };   // o site mostra o erro com o e-mail do laboratório
    }
    if (subKey) cache.put(subKey, id, 6 * 3600);
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

function normalize_(d) {
  const S = (k, max) => clean_(d[k], max || 500);
  return {
    name: S('name', 200),
    email: S('email', 254).toLowerCase(),
    institution: S('institution', 300),
    position: S('position', 100),
    area: S('area', 100),
    cbg_member: S('cbg_member', 10),
    interest: S('interest', 100),
    extras: S('extras', 300),
    problem_title: S('problem_title', 300),
    state_of_art: S('state_of_art', MAX_TEXT),
    approach: S('approach', MAX_TEXT),
    help_type: S('help_type', 300),
    data: S('data', 100),
    experience: S('experience', 100),
    language: S('language', 50),
    message: S('message', MAX_TEXT),
    consent_lgpd: S('consent_lgpd', 10),
    consent_llm: S('consent_llm', 10),
    site_lang: S('site_lang', 5) === 'en' ? 'en' : 'pt',
    submission_id: S('submission_id', 80).replace(/[^A-Za-z0-9_-]/g, ''),
  };
}

function validate_(p) {
  const bad = [];
  if (!p.name) bad.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) bad.push('email');
  if (!p.institution) bad.push('institution');
  if (['Sim', 'Não'].indexOf(p.cbg_member) < 0) bad.push('cbg_member');
  if (INTERESTS.indexOf(p.interest) < 0) bad.push('interest');
  if (p.interest === 'Propor um problema' || p.interest === 'Os dois') {
    if (!p.state_of_art) bad.push('state_of_art');
    if (!p.approach) bad.push('approach');
  }
  if (p.consent_lgpd !== 'Sim') bad.push('consent_lgpd');
  if (p.consent_llm !== 'Sim') bad.push('consent_llm');
  return bad;
}

function rateOk_(cache, email) {
  const hour = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  const kE = 'rl_e_' + hash_(email) + '_' + hour;
  const kG = 'rl_g_' + hour;
  const nE = Number(cache.get(kE) || 0);
  const nG = Number(cache.get(kG) || 0);
  if (nE >= MAX_PER_EMAIL_PER_HOUR || nG >= MAX_PER_HOUR) return false;
  cache.put(kE, String(nE + 1), 3700);
  cache.put(kG, String(nG + 1), 3700);
  return true;
}

/** Próximo ID do ano: GIA-2026-0001, GIA-2026-0002… */
function nextId_() {
  const year = Utilities.formatDate(new Date(), TZ, 'yyyy');
  const key = 'SEQ_' + year;
  const n = Number(prop_(key, '0')) + 1;
  props_().setProperty(key, String(n));
  return 'GIA-' + year + '-' + String(n).padStart(4, '0');
}

/** Confere o PDF enviado pelo site: { nome, tamanho, blob } ou, se recusado, { nome, problema }. */
function checkPdf_(pdf, id) {
  const nome = safeFileName_(pdf.name);
  let bytes;
  try {
    bytes = Utilities.base64Decode(String(pdf.data));
  } catch (err) {
    return { nome: nome, problema: 'arquivo corrompido' };
  }
  if (bytes.length > MAX_PDF_MB * 1024 * 1024) return { nome: nome, problema: 'maior que ' + MAX_PDF_MB + ' MB' };
  const head = bytes.slice(0, 5).map((b) => String.fromCharCode(b & 0xff)).join('');
  if (head !== '%PDF-') return { nome: nome, problema: 'não é um PDF' };
  return { nome: nome, tamanho: bytes.length, blob: Utilities.newBlob(bytes, 'application/pdf', id + '_' + nome) };
}

// ───────────────────────────── E-mail para o laboratório ─────────────────────────────

/** Monta e envia o e-mail da proposta. Lança um erro se o envio falhar. */
function sendToLab_(p, id, pdf) {
  const V = (v) => (v ? String(v) : '—');
  const bar = (t) => '==================== ' + t + ' ====================';
  const member = p.cbg_member === 'Sim';
  const attached = !!(pdf && pdf.blob);
  let pdfLine = 'não enviado';
  if (attached) pdfLine = 'anexado — ' + pdf.blob.getName() + ' (' + fmtSize_(pdf.tamanho) + ')';
  else if (pdf) pdfLine = 'NÃO anexado: o arquivo "' + pdf.nome + '" foi recusado (' + pdf.problema + '). Peça o PDF ao proponente.';

  const lines = [
    'Nova proposta recebida pelo site do GeometrIA: ' + id,
    'Recebida em ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm') + ' (horário de Brasília).',
    '',
    'Membro do CBG: ' + (member ? 'Sim — prioridade na padronização' : 'Não'),
    'Também quer: ' + V(p.extras),
    'PDF: ' + pdfLine,
    '',
    bar('PROPONENTE — dados pessoais, não vão para o Claude'),
    'Nome: ' + V(p.name),
    'E-mail: ' + V(p.email),
    'Instituição: ' + V(p.institution),
    'Etapa da carreira: ' + V(p.position),
    'Consentimentos: LGPD — ' + V(p.consent_lgpd) + ' · uso de LLMs na triagem — ' + V(p.consent_llm),
    'Idioma do site: ' + p.site_lang,
    'Para escrever ao proponente, basta responder a este e-mail.',
    '',
    bar('PROPOSTA — cole no Claude, com o PDF anexado'),
    'Proposta: ' + id,
    'Área principal: ' + V(p.area),
    'Interesse: ' + V(p.interest),
    'Título provisório: ' + V(p.problem_title),
    '',
    'a) Resumo do estado da arte:',
    V(p.state_of_art),
    '',
    'b) Abordagem:',
    V(p.approach),
    '',
    'Tipo de ajuda: ' + V(p.help_type),
    'Exemplos ou dados: ' + V(p.data),
    'Experiência com programação: ' + V(p.experience),
    'Idioma preferido: ' + V(p.language),
    'Algo mais: ' + V(p.message),
    'PDF anexado: ' + (attached ? 'sim' : 'não'),
    bar('FIM DA PROPOSTA'),
  ];
  const opts = {
    to: labEmail_(),
    subject: oneLine_((member ? '[GeometrIA][CBG] ' : '[GeometrIA] ') + id + ' — ' + (p.problem_title || p.interest), 200),
    body: lines.join('\n'),
    replyTo: p.email,
    name: 'GeometrIA · formulário',
  };
  if (attached) opts.attachments = [pdf.blob];
  try {
    MailApp.sendEmail(opts);
  } catch (err) {
    // Um endereço de resposta recusado não pode derrubar o envio: tenta de novo sem o Reply-To
    // (o e-mail do proponente está no corpo). Se falhar outra vez, o erro sobe e o site avisa.
    console.warn('sendEmail', err);
    delete opts.replyTo;
    MailApp.sendEmail(opts);
  }
}

// ───────────────────────────── Instalação e teste ─────────────────────────────

/** Execute uma vez depois de colar o código: autoriza o envio de e-mail e mostra o próximo passo. */
function setup() {
  const p = props_();
  if (!p.getProperty('LAB_EMAIL')) p.setProperty('LAB_EMAIL', DEFAULT_LAB_EMAIL);
  const quota = MailApp.getRemainingDailyQuota();   // pede a autorização de envio de e-mail
  console.log([
    'GeometrIA: tudo pronto.',
    'As propostas vão para ' + labEmail_() + ' (para mudar, edite a propriedade LAB_EMAIL).',
    'E-mails que ainda podem ser enviados hoje: ' + quota + '.',
    'Próximo passo: Implantar → Nova implantação → App da Web (Executar como: Eu; Quem pode acessar: Qualquer pessoa).',
  ].join('\n'));
}

/** Opcional: envia uma proposta de teste para o e-mail do laboratório (não gasta um ID). */
function testSubmission() {
  const p = normalize_({
    name: 'Teste GeometrIA', email: labEmail_(), institution: 'IMECC/UNICAMP', position: 'Outro',
    area: 'Geometria diferencial', cbg_member: 'Sim', interest: 'Propor um problema',
    extras: 'Convite MathIA AmLat', problem_title: 'Proposta de teste — pode apagar',
    state_of_art: 'Texto de teste para conferir a instalação.',
    approach: 'Texto de teste para conferir a instalação.',
    language: 'Português', consent_lgpd: 'Sim', consent_llm: 'Sim', site_lang: 'pt',
  });
  sendToLab_(p, 'GIA-TESTE', null);
  console.log('Proposta de teste enviada para ' + labEmail_() + '.');
}

// ───────────────────────────── Utilidades ─────────────────────────────

function props_() { return PropertiesService.getScriptProperties(); }

function prop_(key, dflt) {
  const v = props_().getProperty(key);
  return v === null || v === undefined || v === '' ? dflt : v;
}

function labEmail_() { return prop_('LAB_EMAIL', DEFAULT_LAB_EMAIL); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  return String(v === null || v === undefined ? '' : v)
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function oneLine_(s, max) { return String(s).replace(/\s+/g, ' ').trim().slice(0, max); }

function safeFileName_(name) {
  let s = oneLine_(String(name || 'proposta.pdf').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_'), 120);
  if (!/\.pdf$/i.test(s)) s += '.pdf';
  return s;
}

function fmtSize_(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
}

function hash_(s) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s).toLowerCase(), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(d).slice(0, 22);
}
