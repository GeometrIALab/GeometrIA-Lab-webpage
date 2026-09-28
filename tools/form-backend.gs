/**
 * GeometrIA — back-end do formulário "Colabore" (Google Apps Script).
 *
 * O que faz (por enquanto, só isto)
 *   Cada proposta enviada pelo site vira um e-mail para a caixa do laboratório
 *   (LAB_EMAIL, abaixo), com o PDF anexado. Não há planilha, pasta de arquivos nem
 *   triagem automática: a equipe leva a proposta do e-mail para o Claude à mão
 *   (roteiro em tools/triagem-manual.md).
 *
 *   O destino é o Gmail do laboratório, não o alias geometria.lab@cbg.unicamp.br: com o
 *   script instalado nessa mesma conta, a cópia que volta pelo alias é descartada pelo
 *   Gmail como duplicata e só aparece em "Enviados", nunca na caixa de entrada.
 *
 * O e-mail
 *   • Assunto: "[GeometrIA][CBG] GIA-2026-0007 — título". O [CBG] aparece quando o
 *     proponente é membro do CBG, que tem prioridade na padronização.
 *   • Corpo em texto simples, em três partes: um resumo (ID, data, pedidos extras, PDF);
 *     o bloco PROPONENTE, com os dados pessoais; e o bloco PROPOSTA — só o projeto, sem
 *     dados pessoais, pronto para colar no Claude junto com o PDF.
 *   • Responder ao e-mail responde direto ao proponente (Reply-To).
 *
 * Proteções: e-mail confirmado por código e anti-robô ALTCHA (abaixo); campo-armadilha e
 * tempo mínimo; validação dos campos; limite de envios por hora; reenvio da mesma proposta
 * ignorado (submission_id); o anexo precisa ser um PDF de verdade, com até MAX_PDF_MB. Se o
 * e-mail não puder ser enviado, o site mostra um erro com o endereço do laboratório —
 * nenhuma proposta some em silêncio.
 *
 * E-mail confirmado (VERIFY_EMAIL)
 *   Só entra proposta de quem confirmou o e-mail. No site, a pessoa marca "Eu não sou um
 *   robô" e clica em "Enviar código": o script manda um código de 6 dígitos para o endereço
 *   (vale CODE_TTL_MIN minutos, uma vez só, com CODE_MAX_TRIES tentativas). Ao digitar o
 *   código certo, o site recebe uma confirmação assinada, válida por VERIFIED_TTL_H horas,
 *   que vai junto com a proposta. Limites: CODE_MAX_PER_EMAIL_PER_HOUR códigos por endereço
 *   e CODE_MAX_PER_HOUR no total, por hora; e o script para de mandar códigos quando restam
 *   MAIL_RESERVE e-mails na cota do dia, para não faltar e-mail para as propostas.
 *
 * Anti-robô (ALTCHA, https://altcha.org — código aberto, sem conta e sem cookies)
 *   O widget "Eu não sou um robô" do site pede um desafio a este script (GET /exec?altcha)
 *   e o navegador resolve uma prova de trabalho: acha o número n tal que
 *   SHA-256(salt + n) = challenge. O script confere a solução, a assinatura HMAC e o prazo,
 *   e aceita cada solução uma única vez. Com VERIFY_EMAIL, o ALTCHA protege o pedido de
 *   código (ninguém usa o formulário para disparar e-mails a terceiros); sem ele, protege o
 *   envio da proposta.
 *
 * A chave secreta que assina os desafios e as confirmações é criada sozinha (propriedade do
 * script HMAC_KEY). Os interruptores daqui valem junto com os do _data/form.yml do site:
 * VERIFY_EMAIL ↔ verify_email e ALTCHA_REQUIRED ↔ altcha — mude os dois lados juntos.
 *
 * Instalação (~5 min) — passo a passo no README, seção "Formulário".
 *   1. Com a conta geometrialab@gmail.com, abra https://script.google.com → Novo projeto.
 *   2. Apague o conteúdo de Código.gs, cole este arquivo e salve.
 *   3. Execute a função `setup` e autorize o envio de e-mail.
 *   4. Implantar → Nova implantação → tipo "App da Web":
 *        Executar como: Eu  ·  Quem pode acessar: Qualquer pessoa.
 *      Copie o URL que termina em /exec e cole em `endpoint`, no _data/form.yml do site.
 *   5. (Opcional) Execute `testSubmission`: chega uma proposta de teste no e-mail do laboratório.
 *
 * Ao alterar este código: salve e publique uma nova versão — Implantar → Gerenciar
 * implantações → editar (lápis) → Versão: "Nova versão" → Implantar. Sem isso, o URL
 * /exec continua rodando a versão antiga. O URL não muda, e abri-lo mostra a versão em uso.
 */

// ───────────────────────────── Configuração ─────────────────────────────

const LAB_EMAIL = 'geometrialab@gmail.com';   // quem recebe as propostas
const VERSION = '2026-09-28d';                 // aparece ao abrir o URL /exec
const TZ = 'America/Sao_Paulo';

const VERIFY_EMAIL = true;              // só aceita proposta com e-mail confirmado por código
const CODE_TTL_MIN = 15;                // validade do código enviado por e-mail
const CODE_MAX_TRIES = 5;               // tentativas por código
const CODE_MAX_PER_EMAIL_PER_HOUR = 3;  // códigos por endereço, por hora
const CODE_MAX_PER_HOUR = 30;           // códigos por hora, no total
const MAIL_RESERVE = 20;                // e-mails da cota diária guardados para as propostas
const VERIFIED_TTL_H = 6;               // depois de confirmado, o e-mail vale por 6 h no formulário

const ALTCHA_REQUIRED = true;           // exige o anti-robô (no pedido de código, ou no envio)
const ALTCHA_MAX_NUMBER = 100000;       // dificuldade: o navegador testa, em média, metade disso
const ALTCHA_TTL_MIN = 30;              // validade de um desafio, em minutos

const MAX_PDF_MB = 10;                  // igual a max_pdf_mb em _data/form.yml
const MAX_TEXT = 20000;                 // caracteres por campo de texto longo
const MAX_PER_EMAIL_PER_HOUR = 5;       // limite de envios por e-mail, por hora
const MAX_PER_HOUR = 60;                // limite global de envios por hora

const INTERESTS = ['Propor um problema', 'Começar a usar IA', 'Os dois'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ───────────────────────────── Web app ─────────────────────────────

/** Teste rápido do URL /exec no navegador; com ?altcha, devolve um desafio anti-robô. */
function doGet(e) {
  if (e && e.parameter && e.parameter.altcha !== undefined) return json_(altchaChallenge_());
  return json_({ ok: true, service: 'GeometrIA — formulário Colabore', version: VERSION, time: new Date().toISOString() });
}

/**
 * Recebe do site (JSON enviado como text/plain): pedido de código ({ action: 'code' }),
 * conferência do código ({ action: 'verify' }) ou a proposta (sem action).
 */
function doPost(e) {
  let data = null;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '');
  } catch (err) {
    return json_({ ok: false, error: 'bad-request' });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json_({ ok: false, error: 'bad-request' });
  try {
    if (data.action === 'code') return json_(handleCode_(data));
    if (data.action === 'verify') return json_(handleVerify_(data));
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
    // A mesma proposta (mesmo submission_id) chegando duas vezes — por exemplo, uma requisição
    // repetida pela rede — devolve o mesmo ID e não gera outro e-mail. O ID só é memorizado
    // depois do envio, e o bloqueio vale até lá: uma cópia simultânea espera e encontra o ID.
    const subKey = p.submission_id ? 'sub_' + p.submission_id : '';
    if (subKey) {
      const prev = cache.get(subKey);
      if (prev) return { ok: true, id: prev };
    }
    if (VERIFY_EMAIL) {
      const why = verifiedCheck_(p.email, clean_(data.email_token, 200));
      if (why) {
        console.warn('E-mail não confirmado: ' + why);
        return { ok: false, error: 'email-unverified' };   // o site pede um código novo
      }
      p.email_verified = true;
    } else if (ALTCHA_REQUIRED) {
      const why = altchaCheck_(clean_(data.altcha, 4000), cache);
      if (why) {
        console.warn('ALTCHA recusado: ' + why);
        return { ok: false, error: 'captcha' };   // o site pede para tentar de novo
      }
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

// ───────────────────────────── E-mail confirmado por código ─────────────────────────────

/** Pedido de código: confere o anti-robô e os limites, e manda o código ao endereço. */
function handleCode_(data) {
  const email = clean_(data.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid', fields: ['email'] };
  const lang = clean_(data.site_lang, 5) === 'en' ? 'en' : 'pt';
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (ALTCHA_REQUIRED) {
      const why = altchaCheck_(clean_(data.altcha, 4000), cache);
      if (why) {
        console.warn('ALTCHA recusado (código): ' + why);
        return { ok: false, error: 'captcha' };
      }
    }
    if (!codeRateOk_(cache, email)) return { ok: false, error: 'code-rate' };
    const skey = secretKey_(true);
    if (MailApp.getRemainingDailyQuota() < MAIL_RESERVE) {
      console.warn('Cota de e-mails do dia quase no fim: códigos suspensos até amanhã.');
      return { ok: false, error: 'code-quota' };
    }
    const code = String(parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 1000000).padStart(6, '0');
    const key = 'otp_' + hash_(email);
    cache.put(key, JSON.stringify({ h: codeHash_(email, code, skey), n: CODE_MAX_TRIES, x: Date.now() + CODE_TTL_MIN * 60000 }), CODE_TTL_MIN * 60);
    try {
      sendCode_(email, code, lang);
    } catch (err) {
      cache.remove(key);
      console.error('sendCode_', err && err.stack ? err.stack : err);
      return { ok: false, error: 'mail' };
    }
    return { ok: true, minutes: CODE_TTL_MIN };
  } finally {
    lock.releaseLock();
  }
}

/** Conferência do código: certo → confirmação assinada, válida por VERIFIED_TTL_H horas. */
function handleVerify_(data) {
  const email = clean_(data.email, 254).toLowerCase();
  const code = clean_(data.code, 20).replace(/\D/g, '');
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid', fields: ['email'] };
  if (code.length !== 6) return { ok: false, error: 'code-format' };
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const skey = secretKey_(true);
    const key = 'otp_' + hash_(email);
    let o = null;
    try { o = JSON.parse(cache.get(key) || 'null'); } catch (err) { o = null; }
    if (!o || !(o.x > Date.now())) {
      cache.remove(key);
      return { ok: false, error: 'code-expired' };
    }
    if (!sameText_(codeHash_(email, code, skey), o.h)) {
      o.n -= 1;
      if (o.n <= 0) {
        cache.remove(key);
        return { ok: false, error: 'code-locked' };
      }
      cache.put(key, JSON.stringify(o), Math.max(1, Math.ceil((o.x - Date.now()) / 1000)));
      return { ok: false, error: 'code-wrong', left: o.n };
    }
    cache.remove(key);   // o código vale uma vez
    const exp = Math.floor(Date.now() / 1000) + VERIFIED_TTL_H * 3600;
    return { ok: true, token: exp + '.' + hmacHex_('verify|' + email + '|' + exp, skey), hours: VERIFIED_TTL_H };
  } finally {
    lock.releaseLock();
  }
}

/** Confere a confirmação que acompanha a proposta. Devolve '' quando vale, ou o motivo. */
function verifiedCheck_(email, token) {
  const m = /^(\d{9,11})\.([0-9a-f]{64})$/.exec(token || '');
  if (!m) return 'ausente';
  const key = props_().getProperty('HMAC_KEY');
  if (!key) return 'sem chave';
  if (!sameText_(hmacHex_('verify|' + email + '|' + m[1], key), m[2])) return 'assinatura';
  if (Number(m[1]) * 1000 < Date.now()) return 'expirado';
  return '';
}

function codeHash_(email, code, key) {
  return hmacHex_('code|' + email + '|' + code, key);
}

function codeRateOk_(cache, email) {
  const hour = Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  const kE = 'cl_e_' + hash_(email) + '_' + hour;
  const kG = 'cl_g_' + hour;
  const nE = Number(cache.get(kE) || 0);
  const nG = Number(cache.get(kG) || 0);
  if (nE >= CODE_MAX_PER_EMAIL_PER_HOUR || nG >= CODE_MAX_PER_HOUR) return false;
  cache.put(kE, String(nE + 1), 3700);
  cache.put(kG, String(nG + 1), 3700);
  return true;
}

/** O e-mail com o código, no idioma da página. */
function sendCode_(email, code, lang) {
  const T = {
    pt: {
      subject: 'GeometrIA — seu código de confirmação: ' + code,
      body: [
        'Olá,',
        '',
        'Seu código para confirmar este e-mail no formulário do GeometrIA é:',
        '',
        '    ' + code,
        '',
        'Ele vale por ' + CODE_TTL_MIN + ' minutos. Se você não pediu este código, ignore esta mensagem: nada é enviado sem ele.',
        '',
        'GeometrIA · CBG – Laboratório de IA e Geometria',
        'Centro Brasileiro de Geometria · IMECC/UNICAMP',
      ],
    },
    en: {
      subject: 'GeometrIA — your confirmation code: ' + code,
      body: [
        'Hello,',
        '',
        'Your code to confirm this email on the GeometrIA form is:',
        '',
        '    ' + code,
        '',
        'It is valid for ' + CODE_TTL_MIN + ' minutes. If you did not request this code, please ignore this message: nothing is sent without it.',
        '',
        'GeometrIA · CBG – AI & Geometry Lab',
        'Brazilian Center for Geometry · IMECC/UNICAMP',
      ],
    },
  }[lang];
  MailApp.sendEmail({ to: email, subject: T.subject, body: T.body.join('\n'), name: 'GeometrIA · CBG' });
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
  if (!EMAIL_RE.test(p.email)) bad.push('email');
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

// ───────────────────────────── Anti-robô (ALTCHA) ─────────────────────────────

/** Desafio no formato ALTCHA v1: SHA-256, prazo dentro do salt, assinatura HMAC-SHA256. */
function altchaChallenge_() {
  const expires = Math.floor(Date.now() / 1000) + ALTCHA_TTL_MIN * 60;
  const salt = Utilities.getUuid().replace(/-/g, '').slice(0, 24) + '?expires=' + expires;
  const number = parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % ALTCHA_MAX_NUMBER;
  const challenge = sha256Hex_(salt + number);
  return { algorithm: 'SHA-256', challenge: challenge, maxnumber: ALTCHA_MAX_NUMBER, salt: salt, signature: hmacHex_(challenge, secretKey_()) };
}

/**
 * Confere a solução enviada pelo widget (JSON em base64). Devolve '' quando vale, ou o motivo
 * da recusa. Cada solução vale uma vez: fica marcada como usada até o prazo acabar.
 */
function altchaCheck_(b64, cache) {
  if (!b64) return 'ausente';
  const hmacKey = props_().getProperty('HMAC_KEY');   // sem chave, nenhum desafio foi emitido
  if (!hmacKey) return 'sem chave';
  let s;
  try {
    s = JSON.parse(Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString('UTF-8'));
  } catch (err) {
    return 'ilegível';
  }
  if (!s || s.algorithm !== 'SHA-256' || typeof s.challenge !== 'string' || typeof s.salt !== 'string' ||
      typeof s.signature !== 'string' || !/^\d{1,9}$/.test(String(s.number))) return 'formato';
  if (!sameText_(hmacHex_(s.challenge, hmacKey), s.signature)) return 'assinatura';
  if (sha256Hex_(s.salt + String(s.number)) !== s.challenge) return 'solução';
  const m = /[?&]expires=(\d+)/.exec(s.salt);
  if (!m || Number(m[1]) * 1000 < Date.now()) return 'expirado';
  const key = 'altcha_' + s.challenge;
  if (cache.get(key)) return 'reutilizado';
  cache.put(key, '1', ALTCHA_TTL_MIN * 60 + 300);
  return '';
}

/**
 * Chave secreta do script (assina os desafios anti-robô e as confirmações de e-mail): criada
 * na primeira vez e guardada nas propriedades do script. Quando falta, é criada sem pegar o
 * bloqueio de novo se quem chama já o tem (o bloqueio do Apps Script não é reentrante).
 */
function secretKey_(lockHeld) {
  let key = props_().getProperty('HMAC_KEY');
  if (key) return key;
  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(30000);
  try {
    key = props_().getProperty('HMAC_KEY');
    if (!key) {
      key = sha256Hex_(Utilities.getUuid() + Utilities.getUuid() + Date.now());
      props_().setProperty('HMAC_KEY', key);
    }
    return key;
  } finally {
    if (lock) lock.releaseLock();
  }
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
    'E-mail confirmado: ' + (p.email_verified ? 'sim (o proponente digitou o código enviado a esse endereço)' : 'não'),
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
    to: LAB_EMAIL,
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

/** Execute depois de colar o código: autoriza o envio de e-mail e mostra o próximo passo. */
function setup() {
  // Versões anteriores guardavam o destino numa propriedade LAB_EMAIL (o alias do CBG).
  // Hoje o destino é a constante LAB_EMAIL; a propriedade antiga é apagada para não confundir.
  props_().deleteProperty('LAB_EMAIL');
  props_().deleteProperty('ALTCHA_HMAC_KEY');       // nome antigo da chave secreta
  secretKey_();                                     // cria a chave secreta, se faltar
  const quota = MailApp.getRemainingDailyQuota();   // pede a autorização de envio de e-mail
  console.log([
    'GeometrIA ' + VERSION + ': tudo pronto.',
    'As propostas vão para ' + LAB_EMAIL + ' (para mudar, edite LAB_EMAIL no início do script).',
    'E-mail confirmado por código: ' + (VERIFY_EMAIL ? 'exigido.' : 'desligado.'),
    'Anti-robô (ALTCHA): ' + (ALTCHA_REQUIRED ? (VERIFY_EMAIL ? 'exigido no pedido de código.' : 'exigido em cada envio.') : 'desligado.'),
    'E-mails que ainda podem ser enviados hoje: ' + quota + '.',
    'Próximo passo: Implantar → Gerenciar implantações → editar → Versão: "Nova versão" → Implantar',
    '(ou, na primeira vez, Nova implantação → App da Web; Executar como: Eu; Quem pode acessar: Qualquer pessoa).',
  ].join('\n'));
}

/** Opcional: envia uma proposta de teste para o e-mail do laboratório (não gasta um ID). */
function testSubmission() {
  const p = normalize_({
    name: 'Teste GeometrIA', email: LAB_EMAIL, institution: 'IMECC/UNICAMP', position: 'Outro',
    area: 'Geometria diferencial', cbg_member: 'Sim', interest: 'Propor um problema',
    extras: 'Convite MathIA AmLat', problem_title: 'Proposta de teste — pode apagar',
    state_of_art: 'Texto de teste para conferir a instalação.',
    approach: 'Texto de teste para conferir a instalação.',
    language: 'Português', consent_lgpd: 'Sim', consent_llm: 'Sim', site_lang: 'pt',
  });
  sendToLab_(p, 'GIA-TESTE', null);
  console.log('Proposta de teste enviada para ' + LAB_EMAIL + '. Confira a caixa de entrada (e o spam).');
}

// ───────────────────────────── Utilidades ─────────────────────────────

function props_() { return PropertiesService.getScriptProperties(); }

function prop_(key, dflt) {
  const v = props_().getProperty(key);
  return v === null || v === undefined || v === '' ? dflt : v;
}

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

function hex_(bytes) {
  return bytes.map((b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function sha256Hex_(s) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8));
}

function hmacHex_(s, key) {
  return hex_(Utilities.computeHmacSha256Signature(String(s), key, Utilities.Charset.UTF_8));
}

/** Compara dois textos sem parar no primeiro caractere diferente. */
function sameText_(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function hash_(s) {
  const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s).toLowerCase(), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(d).slice(0, 22);
}
