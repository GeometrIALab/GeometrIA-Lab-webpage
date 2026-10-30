/* GeometrIA — formulário "Colabore".
 *
 * Com `endpoint` preenchido em _data/form.yml, envia a proposta (JSON, com o PDF em
 * base64) para o Google Apps Script em tools/form-backend.gs, que a encaminha por
 * e-mail, com o PDF anexado, para a conta do laboratório. Antes, a pessoa confirma o
 * e-mail com um código de 6 dígitos (veja "confirmação do e-mail"), pedido depois do
 * anti-robô ALTCHA (veja altchaToken). Sem endpoint, abre um e-mail pré-preenchido
 * para contact_email.
 */
(function () {
  "use strict";
  var form = document.querySelector("[data-form]");
  if (!form) return;

  var endpoint = (form.getAttribute("data-endpoint") || "").trim();
  // Versão no site do CBG: o plugin do WordPress põe aqui um passe assinado da conta logada.
  var wpPass = (form.getAttribute("data-wp-pass") || "").trim();
  var email = form.getAttribute("data-email");
  var lang = form.getAttribute("data-lang") || "pt";
  var maxMB = parseFloat(form.getAttribute("data-max-mb")) || 10;
  var status = form.querySelector("[data-status]");
  var submit = form.querySelector("[data-submit]");
  var card = form.parentNode;
  var startedAt = Date.now();
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var FIELDS = ["name", "email", "institution", "position", "area", "cbg_member",
    "interest", "extras", "problem_title", "state_of_art", "approach",
    "help_type", "data", "experience", "language", "message",
    "consent_lgpd", "consent_llm"];

  var CONSENT_LABELS = {
    pt: { consent_lgpd: "Consentimento (LGPD)", consent_llm: "Ciente do uso de LLMs na triagem" },
    en: { consent_lgpd: "Consent (LGPD)", consent_llm: "Aware of LLM use in the triage" }
  };

  if (!endpoint && window.console) {
    console.info("[GeometrIA] Formulário sem endpoint: usando e-mail (veja _data/form.yml).");
  }

  /* ---------- utilidades ---------- */
  function values(name) {
    var els = form.querySelectorAll('[name="' + name + '"]');
    var out = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.type === "file") continue;
      if (el.type === "checkbox" || el.type === "radio") { if (el.checked) out.push(el.value); }
      else if (el.value.trim() !== "") out.push(el.value.trim());
    }
    return out.join("; ");
  }

  function cleanLabel(text) {
    return text.replace(/\*/g, "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  }

  function labelFor(name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return name;
    var group = el.closest(".choice-group");
    if (group) { var lg = group.querySelector("legend"); if (lg) return cleanLabel(lg.textContent); }
    var lab = el.id && form.querySelector('label[for="' + el.id + '"]');
    if (lab) return cleanLabel(lab.textContent);
    return name;
  }

  function fmtSize(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
    var mb = (bytes / (1024 * 1024)).toFixed(1);
    return (lang === "pt" ? mb.replace(".", ",") : mb) + " MB";
  }

  function newId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function say(el, msg, isError, withEmail) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", !!isError);
    if (withEmail) {
      var a = document.createElement("a");
      a.href = "mailto:" + email;
      a.textContent = email;
      el.appendChild(document.createTextNode(" "));
      el.appendChild(a);
      el.appendChild(document.createTextNode("."));
    }
  }

  function setStatus(msg, isError, withEmail) { say(status, msg, isError, withEmail); }

  /* ---------- a pergunta é obrigatória quando há um problema concreto ---------- */
  var needProblem = form.querySelectorAll("[data-need-problem]");
  function syncRequired() {
    var v = values("interest");
    var need = v === "Propor um problema" || v === "Os dois";
    for (var i = 0; i < needProblem.length; i++) {
      var box = needProblem[i];
      var ctl = box.querySelector("textarea, input");
      var mark = box.querySelector("[data-req-mark]");
      if (ctl) { ctl.required = need; if (!need) clearError(ctl); }
      if (mark) mark.hidden = !need;
    }
  }

  function clearError(el) {
    if (!el || !el.closest) return;
    var group = el.closest(".choice-group");
    if (group) group.removeAttribute("aria-invalid");
    if (el.getAttribute("aria-invalid")) el.removeAttribute("aria-invalid");
    if (el.name) clearFieldError(el.name);
  }

  /* ---------- avisos de erro: um embaixo de cada item que falta e um resumo acima do botão ---------- */
  var errSummary = form.querySelector("[data-error-summary]");
  var errTitle = form.querySelector("[data-error-title]");
  var errList = form.querySelector("[data-error-list]");

  function controlsOf(name) {
    return Array.prototype.slice.call(form.querySelectorAll('[name="' + name + '"]'));
  }

  // O texto do aviso de cada campo (em _data/text/collaborate.yml, form.errors).
  function errorText(el) {
    if (el.type === "file") return (pdfError && pdfError.textContent) || "";
    if (el.type === "email" && el.value.trim() !== "") return form.getAttribute("data-msg-err-email-format") || "";
    return form.getAttribute("data-msg-err-" + el.name.replace(/_/g, "-")) || form.getAttribute("data-msg-invalid") || "";
  }

  function describedBy(el, id, on) {
    var ids = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(function (x) { return x && x !== id; });
    if (on) ids.push(id);
    if (ids.length) el.setAttribute("aria-describedby", ids.join(" ")); else el.removeAttribute("aria-describedby");
  }

  // Onde o aviso aparece: logo abaixo da pergunta (grupos de opções), da caixa de concordância ou do campo.
  function placeError(el, p) {
    var group = el.type === "radio" && el.closest(".choice-group");
    if (group) { var lg = group.querySelector("legend"); group.insertBefore(p, lg ? lg.nextSibling : group.firstChild); return; }
    var box = el.type === "checkbox" && el.closest("label.choice");
    if (box) { box.parentNode.insertBefore(p, box.nextSibling); return; }
    var field = el.closest(".field");
    (field || el.parentNode).appendChild(p);
  }

  function setFieldError(el, msg) {
    if (el.type === "file") return;              // o PDF já tem o seu aviso (data-pdf-error)
    var id = "f-err-" + el.name.replace(/_/g, "-");
    var p = document.getElementById(id);
    if (!p) {
      p = document.createElement("p");
      p.className = "field-error";
      p.id = id;
      p.setAttribute("data-field-error", el.name);
      placeError(el, p);
    }
    p.textContent = msg;
    controlsOf(el.name).forEach(function (c) { describedBy(c, id, true); });
  }

  function clearFieldError(name) {
    var id = "f-err-" + name.replace(/_/g, "-");
    var p = document.getElementById(id);
    if (p) { p.parentNode.removeChild(p); controlsOf(name).forEach(function (c) { describedBy(c, id, false); }); }
    if (!errList) return;
    var li = errList.querySelector('[data-error-for="' + name + '"]');
    if (li) { li.parentNode.removeChild(li); updateSummary(); }
  }

  function updateSummary() {
    var n = errList.children.length;
    errSummary.hidden = n === 0;
    errTitle.textContent = n === 1 ? form.getAttribute("data-msg-errors-one") : (form.getAttribute("data-msg-errors-many") || "").replace("%N%", n);
  }

  function clearAllErrors() {
    var ps = form.querySelectorAll("[data-field-error]");
    for (var i = 0; i < ps.length; i++) clearFieldError(ps[i].getAttribute("data-field-error"));
    if (errList) { errList.innerHTML = ""; errSummary.hidden = true; }
  }

  function focusControl(el) {
    var target = el.type === "radio" ? (form.querySelector('[name="' + el.name + '"]:checked') || controlsOf(el.name)[0]) : el;
    target.focus({ preventScroll: true });
    (target.closest(".choice-group, .field, .consent, .file-field") || target).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  // Mostra o aviso de cada campo em `bad` (um elemento por campo) e o resumo, com um link para cada um.
  function showErrors(bad) {
    clearAllErrors();
    if (!errList) { setStatus(form.getAttribute("data-msg-invalid"), true); return; }
    bad.forEach(function (el) {
      var msg = errorText(el);
      el.setAttribute("aria-invalid", "true");
      var group = el.type === "radio" && el.closest(".choice-group");
      if (group) group.setAttribute("aria-invalid", "true");
      setFieldError(el, msg);
      var li = document.createElement("li");
      li.setAttribute("data-error-for", el.name);
      var a = document.createElement("a");
      a.href = "#" + (el.id || "proposta");
      a.textContent = msg;
      a.addEventListener("click", function (ev) { ev.preventDefault(); focusControl(el); });
      li.appendChild(a);
      errList.appendChild(li);
    });
    updateSummary();
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "interest") syncRequired();
    if (e.target.type !== "file") clearError(e.target);
  });
  form.addEventListener("input", function (e) { if (e.target.type !== "file") clearError(e.target); });
  syncRequired();

  /* ---------- anexo em PDF ---------- */
  var pdfInput = form.querySelector("[data-pdf-input]");
  var pdfDrop = form.querySelector("[data-pdf-drop]");
  var pdfName = form.querySelector("[data-pdf-name]");
  var pdfRemove = form.querySelector("[data-pdf-remove]");
  var pdfError = form.querySelector("[data-pdf-error]");
  var pdfCta = form.querySelector("[data-pdf-cta]");
  var pdfFile = null;

  function pdfUI(file, error) {
    pdfFile = file || null;
    if (pdfName) pdfName.textContent = file ? file.name + " · " + fmtSize(file.size) : pdfName.getAttribute("data-empty");
    if (pdfDrop) { pdfDrop.classList.toggle("has-file", !!file); pdfDrop.classList.toggle("is-invalid", !!error); }
    if (pdfRemove) pdfRemove.hidden = !file;
    if (pdfCta) pdfCta.textContent = pdfCta.getAttribute(file ? "data-change" : "data-choose");
    if (pdfError) { pdfError.textContent = error || ""; pdfError.hidden = !error; }
    if (pdfInput) {
      if (error) {
        pdfInput.setAttribute("aria-invalid", "true");
        pdfInput.setAttribute("aria-describedby", "f-pdf-help f-pdf-status f-pdf-error");
      } else {
        pdfInput.removeAttribute("aria-invalid");
        pdfInput.setAttribute("aria-describedby", "f-pdf-help f-pdf-status");
      }
    }
  }

  function checkPdf(file) {
    if (!file) return "";
    var isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) return form.getAttribute("data-msg-pdf-type");
    if (file.size > maxMB * 1024 * 1024) return form.getAttribute("data-msg-pdf-size");
    if (file.size === 0) return form.getAttribute("data-msg-pdf-type");
    return "";
  }

  if (pdfInput) {
    pdfInput.addEventListener("change", function () {
      var file = pdfInput.files && pdfInput.files[0];
      var err = checkPdf(file);
      if (err) { pdfInput.value = ""; pdfUI(null, err); }
      else pdfUI(file, "");
    });
    ["dragenter", "dragover"].forEach(function (t) {
      pdfInput.addEventListener(t, function () { if (pdfDrop) pdfDrop.classList.add("is-drag"); });
    });
    ["dragleave", "drop"].forEach(function (t) {
      pdfInput.addEventListener(t, function () { if (pdfDrop) pdfDrop.classList.remove("is-drag"); });
    });
  }
  if (pdfRemove) {
    pdfRemove.addEventListener("click", function () {
      pdfInput.value = "";
      pdfUI(null, "");
      pdfInput.focus();
    });
  }

  function readPdf(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var s = String(r.result || "");
        resolve({ name: file.name, type: "application/pdf", size: file.size, data: s.slice(s.indexOf(",") + 1) });
      };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(file);
    });
  }

  /* ---------- anti-robô (ALTCHA) ---------- */
  // O widget <altcha-widget> (assets/js/vendor/altcha) pede um desafio ao script e o navegador
  // o resolve. Quem não marcou "Eu não sou um robô" antes de enviar não precisa voltar: a
  // verificação roda sozinha no envio. Cada verificação vale para um único envio.
  var altcha = form.querySelector("altcha-widget");

  function altchaValue() {
    var el = form.querySelector('input[name="altcha"]');
    return el && el.value ? el.value : "";
  }

  function altchaToken() {
    if (!altcha) return Promise.resolve("");
    var ready = altchaValue();
    if (ready) return Promise.resolve(ready);
    if (typeof altcha.verify !== "function") return Promise.reject(new Error("captcha"));
    return new Promise(function (resolve, reject) {
      function done(value) { if (value) resolve(value); else reject(new Error("captcha")); }
      if (typeof altcha.getState === "function" && altcha.getState() === "verifying") {
        // A pessoa acabou de marcar a caixa: espera essa verificação terminar.
        var onChange = function (ev) {
          var st = ev.detail && ev.detail.state;
          if (st === "verifying") return;
          altcha.removeEventListener("statechange", onChange);
          done(altchaValue() || (st === "verified" && ev.detail.payload) || "");
        };
        altcha.addEventListener("statechange", onChange);
        return;
      }
      altcha.verify().then(function (res) { done((res && res.payload) || altchaValue()); }, function () { done(""); });
    });
  }

  function altchaReset() {
    if (altcha && typeof altcha.reset === "function") altcha.reset();
  }

  /* ---------- confirmação do e-mail por código ---------- */
  // "Enviar código" (depois do anti-robô) → o script manda 6 dígitos ao endereço → ao digitar
  // o sexto dígito, o site confere e recebe uma confirmação assinada, que vai com a proposta.
  var verifyBox = form.querySelector("[data-verify]");
  var emailInput = form.querySelector("#f-email");
  var codeSend = verifyBox && verifyBox.querySelector("[data-code-send]");
  var codeBox = verifyBox && verifyBox.querySelector("[data-code-box]");
  var codeInput = verifyBox && verifyBox.querySelector("[data-code-input]");
  var codeStatus = verifyBox && verifyBox.querySelector("[data-code-status]");
  var verifyRow = verifyBox && verifyBox.querySelector("[data-verify-row]");
  var verifiedBox = verifyBox && verifyBox.querySelector("[data-verified]");
  var codeEmail = "";     // para onde foi o último código
  var tokenEmail = "";    // e-mail já confirmado
  var emailToken = "";    // confirmação assinada pelo script
  var checking = false;
  var cooldown = null;

  function vmsg(name) { return verifyBox.getAttribute("data-msg-" + name) || ""; }
  function currentEmail() { return (emailInput && emailInput.value || "").trim().toLowerCase(); }
  function codeSay(msg, isError, withEmail) { say(codeStatus, msg, isError, withEmail); }

  function stopCooldown(label) {
    if (cooldown) { clearInterval(cooldown); cooldown = null; }
    if (codeSend) { codeSend.disabled = false; codeSend.textContent = label || vmsg("send"); }
  }

  function startCooldown(seconds) {
    var left = seconds;
    if (cooldown) clearInterval(cooldown);
    codeSend.disabled = true;
    function tick() {
      if (left <= 0) { stopCooldown(vmsg("resend")); return; }
      codeSend.textContent = vmsg("wait").replace("%S%", left);
      left -= 1;
    }
    tick();
    cooldown = setInterval(tick, 1000);
  }

  function showVerified(on) {
    verifyBox.classList.toggle("is-verified", on);
    verifiedBox.hidden = !on;
    verifyRow.hidden = on;
    codeBox.hidden = on || !codeEmail;
    if (on) {
      verifiedBox.querySelector("[data-verified-email]").textContent = tokenEmail;
      codeSay("");
    }
  }

  function resetVerify() {
    codeEmail = ""; tokenEmail = ""; emailToken = "";
    stopCooldown();
    if (codeInput) codeInput.value = "";
    showVerified(false);
    codeSay("");
  }

  function focusVerify() {
    var target = codeBox && !codeBox.hidden ? codeInput : codeSend;
    verifyBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    if (target) target.focus({ preventScroll: true });
  }

  function sendCode() {
    var address = currentEmail();
    if (!address || !emailInput.checkValidity()) {
      emailInput.setAttribute("aria-invalid", "true");
      codeSay(vmsg("email-first"), true);
      emailInput.focus();
      return;
    }
    codeSend.disabled = true;
    codeSay(vmsg("sending"));
    altchaToken()
      .then(function (token) { return post({ action: "code", email: address, altcha: token, site_lang: lang }); })
      .then(function (res) {
        altchaReset();   // cada verificação vale um pedido; um reenvio faz outra
        if (!res || res.ok === false) throw new Error((res && res.error) || "error");
        codeEmail = address;
        codeBox.hidden = false;
        codeInput.value = "";
        codeSay(vmsg("sent").replace("%EMAIL%", address));
        startCooldown(45);
        codeInput.focus();
      })
      .catch(function (err) {
        altchaReset();
        stopCooldown(codeEmail ? vmsg("resend") : vmsg("send"));
        var e = err && err.message;
        if (e === "captcha") codeSay(form.getAttribute("data-msg-captcha"), true, true);
        else if (e === "code-rate") codeSay(vmsg("rate"), true, true);
        else if (e === "invalid") { codeSay(vmsg("email-first"), true); emailInput.focus(); }
        else codeSay(vmsg("error"), true, true);
      });
  }

  function checkCode(code) {
    checking = true;
    codeSay(vmsg("checking"));
    post({ action: "verify", email: codeEmail, code: code })
      .then(function (res) {
        if (res && res.ok && res.token) {
          emailToken = res.token;
          tokenEmail = codeEmail;
          stopCooldown(vmsg("resend"));
          showVerified(true);
          return;
        }
        var e = (res && res.error) || "error";
        if (e === "code-wrong") {
          codeSay(res.left === 1 ? vmsg("wrong-one") : vmsg("wrong").replace("%N%", res.left), true);
          codeInput.select();
        } else if (e === "code-expired" || e === "code-locked") {
          codeInput.value = "";
          if (!cooldown) stopCooldown(vmsg("resend"));
          codeSay(vmsg("expired"), true);
        } else {
          codeSay(vmsg("error"), true, true);
        }
      }, function () { codeSay(vmsg("error"), true, true); })
      .then(function () { checking = false; });
  }

  if (verifyBox) {
    codeSend.addEventListener("click", sendCode);
    codeInput.addEventListener("input", function () {
      var digits = codeInput.value.replace(/\D/g, "");
      if (digits.length === 6 && !checking) checkCode(digits);
    });
    codeInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") e.preventDefault();   // Enter aqui não envia a proposta
    });
    emailInput.addEventListener("input", function () {
      var address = currentEmail();
      if ((tokenEmail || codeEmail) && address !== tokenEmail && address !== codeEmail) resetVerify();
    });
  }

  /* ---------- validação ---------- */
  function validate() {
    var bad = [];
    var controls = form.querySelectorAll("input, select, textarea");
    var seen = {};
    for (var i = 0; i < controls.length; i++) {
      var el = controls[i];
      if (el.name === "website" || el.type === "file" || el.hasAttribute("data-code-input") || (el.closest && el.closest("altcha-widget"))) continue;
      if (el.type === "radio") {
        if (seen[el.name]) continue;
        seen[el.name] = true;
        if (el.required && values(el.name) === "") bad.push(el);
        continue;
      }
      if (el.type !== "checkbox" && el.value && el.value.trim() === "" && el.required) el.value = "";
      if (!el.checkValidity()) bad.push(el);
    }
    return bad;
  }

  /* ---------- painéis de conclusão ---------- */
  function show(which, id) {
    form.hidden = true;
    var panels = card.querySelectorAll("[data-done]");
    for (var i = 0; i < panels.length; i++) panels[i].hidden = panels[i].getAttribute("data-done") !== which;
    var p = card.querySelector('[data-done="' + which + '"]');
    if (!p) return;
    var idBox = p.querySelector("[data-done-id]");
    if (idBox) { idBox.hidden = !id; var v = idBox.querySelector("[data-done-id-value]"); if (v) v.textContent = id || ""; }
    var pdfNote = p.querySelector("[data-mail-pdf]");
    if (pdfNote) pdfNote.hidden = !pdfFile;
    p.focus({ preventScroll: true });
    p.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  var againBtns = card.querySelectorAll("[data-again]");
  for (var a = 0; a < againBtns.length; a++) {
    againBtns[a].addEventListener("click", function () {
      form.reset(); clearAllErrors(); syncRequired(); pdfUI(null, ""); setStatus(""); altchaReset();
      // O e-mail confirmado continua valendo para a próxima proposta (a confirmação dura horas).
      if (verifyBox) { if (tokenEmail) { emailInput.value = tokenEmail; codeInput.value = ""; showVerified(true); } else resetVerify(); }
      var panels = card.querySelectorAll("[data-done]");
      for (var i = 0; i < panels.length; i++) panels[i].hidden = true;
      form.hidden = false; startedAt = Date.now();
      var first = form.querySelector("input:not([type=hidden]), select, textarea");
      if (first) first.focus();
    });
  }

  /* ---------- envio ---------- */
  function collect() {
    var data = {};
    FIELDS.forEach(function (f) { data[f] = values(f); });
    data.site_lang = lang;
    data.submission_id = newId();
    data.website = values("website");
    data.elapsed_ms = Date.now() - startedAt;
    return data;
  }

  function mailto(data) {
    var lines = [];
    var consent = CONSENT_LABELS[lang] || CONSENT_LABELS.pt;
    FIELDS.forEach(function (f) {
      if (!data[f]) return;
      var label = consent[f] || labelFor(f);
      var val = data[f];
      lines.push(val.indexOf("\n") >= 0 || val.length > 90 ? label + ":\n" + val + "\n" : label + ": " + val);
    });
    if (pdfFile) lines.push((lang === "en" ? "PDF (please attach): " : "PDF (anexar): ") + pdfFile.name);
    lines.push("", "(" + (lang === "en" ? "sent from the GeometrIA website" : "enviado pelo site do GeometrIA") + ")");
    var body = lines.join("\n");
    if (body.length > 4000) body = body.slice(0, 4000) + "…\n[" + (lang === "en" ? "text truncated, please paste the rest" : "texto truncado, cole o restante") + "]";
    return "mailto:" + email + "?subject=" + encodeURIComponent(form.getAttribute("data-subject") || "GeometrIA") + "&body=" + encodeURIComponent(body);
  }

  function post(payload) {
    // text/plain evita o preflight CORS; o Apps Script lê e.postData.contents.
    // Só conta como enviado com a confirmação do servidor ({ ok: true, id }). Falha de rede,
    // bloqueio de CORS ou uma implantação fora do ar (página de erro em HTML) mostram o erro,
    // com o e-mail do laboratório — o site nunca diz "recebemos" sem ter recebido.
    return fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), redirect: "follow" })
      .then(function (res) { return res.text(); })
      .then(function (txt) {
        var json = null;
        try { json = JSON.parse(txt); } catch (e) { json = null; }
        if (!json || typeof json !== "object") throw new Error("bad-response");
        return json;
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");
    // Armadilhas simples contra robôs: campo oculto preenchido ou envio instantâneo.
    var hp = form.querySelector('[name="website"]');
    if ((hp && hp.value) || Date.now() - startedAt < 2500) { show("sent", ""); return; }

    var bad = validate();
    if (pdfInput && pdfDrop && pdfDrop.classList.contains("is-invalid")) bad.push(pdfInput);
    if (bad.length) {
      showErrors(bad);
      focusControl(bad[0]);
      return;
    }
    clearAllErrors();

    var data = collect();
    if (!endpoint) {
      window.location.href = mailto(data);
      show("mail");
      return;
    }

    if (verifyBox) {
      if (!emailToken || tokenEmail !== currentEmail()) {
        setStatus(form.getAttribute("data-msg-verify-first"), true);
        focusVerify();
        return;
      }
      data.email_token = emailToken;
    }
    if (wpPass) data.wp_pass = wpPass;

    submit.disabled = true;
    setStatus(form.getAttribute("data-msg-sending"));
    (verifyBox ? Promise.resolve("") : altchaToken())   // com o e-mail confirmado, o anti-robô já foi feito
      .then(function (token) {
        if (token) data.altcha = token;
        return pdfFile ? readPdf(pdfFile) : null;
      })
      .then(function (pdf) {
        if (pdf) data.pdf = pdf;
        return post(data);
      })
      .then(function (res) {
        if (res && res.ok === false && res.error === "invalid" && res.fields && res.fields.length) {
          var els = [];                  // o script recusou campos: mesmos avisos, campo por campo
          res.fields.forEach(function (f) { var c = controlsOf(f)[0]; if (c) els.push(c); });
          if (els.length) { setStatus(""); showErrors(els); focusControl(els[0]); return; }
        }
        if (!res || res.ok === false) throw new Error((res && res.error) || "error");
        setStatus("");
        show("sent", res.id || "");
      })
      .catch(function (err) {
        var e = err && err.message;
        if (!verifyBox) altchaReset();   // a próxima tentativa faz uma verificação nova
        if (verifyBox && e === "email-unverified") {
          resetVerify();                 // a confirmação venceu: pede um código novo
          codeSay(vmsg("again"), true);
          setStatus(form.getAttribute("data-msg-verify-first"), true);
          focusVerify();
          return;
        }
        var key = e === "captcha" ? "data-msg-captcha" : (e === "login" && form.getAttribute("data-msg-login")) ? "data-msg-login" : "data-msg-error";
        setStatus(form.getAttribute(key), true, true);
      })
      .then(function () { submit.disabled = false; });
  });
})();
