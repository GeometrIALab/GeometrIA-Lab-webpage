/* GeometrIA — formulário "Colabore".
 *
 * Com `endpoint` preenchido em _data/form.yml, envia a proposta (JSON, com o PDF em
 * base64) para o Google Apps Script em tools/form-backend.gs, que grava a planilha,
 * guarda o PDF no Drive e avisa o laboratório. Sem endpoint, abre um e-mail
 * pré-preenchido para contact_email.
 */
(function () {
  "use strict";
  var form = document.querySelector("[data-form]");
  if (!form) return;

  var endpoint = (form.getAttribute("data-endpoint") || "").trim();
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

  function setStatus(msg, isError, withEmail) {
    status.textContent = msg || "";
    status.classList.toggle("is-error", !!isError);
    if (withEmail) {
      var a = document.createElement("a");
      a.href = "mailto:" + email;
      a.textContent = email;
      status.appendChild(document.createTextNode(" "));
      status.appendChild(a);
      status.appendChild(document.createTextNode("."));
    }
  }

  /* ---------- a pergunta é obrigatória quando há um problema concreto ---------- */
  var needProblem = form.querySelectorAll("[data-need-problem]");
  function syncRequired() {
    var v = values("interest");
    var need = v === "Propor um problema" || v === "Os dois";
    for (var i = 0; i < needProblem.length; i++) {
      var box = needProblem[i];
      var ctl = box.querySelector("textarea, input");
      var mark = box.querySelector("[data-req-mark]");
      if (ctl) { ctl.required = need; if (!need) ctl.removeAttribute("aria-invalid"); }
      if (mark) mark.hidden = !need;
    }
  }

  function clearError(el) {
    if (!el || !el.closest) return;
    var group = el.closest(".choice-group");
    if (group) group.removeAttribute("aria-invalid");
    if (el.getAttribute("aria-invalid")) el.removeAttribute("aria-invalid");
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

  /* ---------- validação ---------- */
  function validate() {
    var bad = [];
    var controls = form.querySelectorAll("input, select, textarea");
    var seen = {};
    for (var i = 0; i < controls.length; i++) {
      var el = controls[i];
      if (el.name === "website" || el.type === "file") continue;
      if (el.type === "radio") {
        if (seen[el.name]) continue;
        seen[el.name] = true;
        if (el.required && values(el.name) === "") {
          var g = el.closest(".choice-group");
          if (g) g.setAttribute("aria-invalid", "true");
          bad.push(el);
        }
        continue;
      }
      if (el.type !== "checkbox" && el.value && el.value.trim() === "" && el.required) el.value = "";
      if (!el.checkValidity()) { el.setAttribute("aria-invalid", "true"); bad.push(el); }
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
      form.reset(); syncRequired(); pdfUI(null, ""); setStatus("");
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
    if (body.length > 4000) body = body.slice(0, 4000) + "…\n[" + (lang === "en" ? "text truncated — please paste the rest" : "texto truncado — cole o restante") + "]";
    return "mailto:" + email + "?subject=" + encodeURIComponent(form.getAttribute("data-subject") || "GeometrIA") + "&body=" + encodeURIComponent(body);
  }

  function post(payload) {
    var body = JSON.stringify(payload);
    // text/plain evita o preflight CORS; o Apps Script lê e.postData.contents.
    return fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body, redirect: "follow" })
      .then(function (res) {
        return res.text().then(function (txt) {
          var json = null;
          try { json = JSON.parse(txt); } catch (e) { json = null; }
          if (!json) throw new Error("bad-response");
          return json;
        });
      }, function () {
        // Resposta ilegível por CORS/rede: reenvia sem ler a resposta.
        // O servidor ignora duplicatas pelo submission_id.
        return fetch(endpoint, { method: "POST", mode: "no-cors", body: body })
          .then(function () { return { ok: true, id: "" }; });
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
      setStatus(form.getAttribute("data-msg-invalid"), true);
      bad[0].focus();
      return;
    }

    var data = collect();
    if (!endpoint) {
      window.location.href = mailto(data);
      show("mail");
      return;
    }

    submit.disabled = true;
    setStatus(form.getAttribute("data-msg-sending"));
    (pdfFile ? readPdf(pdfFile) : Promise.resolve(null))
      .then(function (pdf) {
        if (pdf) data.pdf = pdf;
        return post(data);
      })
      .then(function (res) {
        if (!res || res.ok === false) throw new Error((res && res.error) || "error");
        setStatus("");
        show("sent", res.id || "");
      })
      .catch(function () {
        setStatus(form.getAttribute("data-msg-error"), true, true);
      })
      .then(function () { submit.disabled = false; });
  });
})();
