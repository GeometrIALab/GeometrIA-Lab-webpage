/* GeometrIA — animação da página inicial.
 *
 * Descida de gradiente da energia de Willmore restrita aos toros de revolução.
 * Para um toro com raios R > r e razão c = R/r:
 *     W(c) = ∫ H² dA = π² c² / √(c² − 1),
 * minimizada em c = √2 (o toro de Clifford, W = 2π²).
 * Os pontos são coloridos pela curvatura média H = (κ₁ + κ₂)/2, com
 * κ₁ = 1/r e κ₂ = cos v / (R + r cos v). O "ruído de inicialização" que decai
 * imita uma rede que ainda não aprendeu a superfície.
 */
(function () {
  "use strict";
  var fig = document.querySelector("[data-flow]");
  if (!fig) return;
  var canvas = fig.querySelector("canvas");
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) return;

  var hudE = fig.querySelector("[data-hud-epoch]");
  var hudC = fig.querySelector("[data-hud-c]");
  var hudW = fig.querySelector("[data-hud-w]");
  var epochLabel = fig.getAttribute("data-epoch-label") || "epoch";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PI = Math.PI, SQ2 = Math.SQRT2;
  function W(c) { return PI * PI * c * c / Math.sqrt(c * c - 1); }
  function dW(c) { return PI * PI * c * (c * c - 2) / Math.pow(c * c - 1, 1.5); }

  /* ---- amostra fixa de pontos (u, v) no toro ---- */
  var NU = 78, NV = 30, N = NU * NV;
  var U = new Float32Array(N), V = new Float32Array(N), NZ = new Float32Array(N);
  var JX = new Float32Array(N), JY = new Float32Array(N), JZ = new Float32Array(N);
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var i, j, k;
  for (i = 0, k = 0; i < NU; i++) {
    for (j = 0; j < NV; j++, k++) {
      U[k] = (i + 0.5 + (rnd() - 0.5) * 0.8) / NU * 2 * PI;
      V[k] = (j + 0.5 + (rnd() - 0.5) * 0.8) / NV * 2 * PI;
      NZ[k] = rnd() * 2 - 1;
      var a = rnd() * 2 * PI, b = Math.acos(rnd() * 2 - 1);
      JX[k] = Math.sin(b) * Math.cos(a); JY[k] = Math.sin(b) * Math.sin(a); JZ[k] = Math.cos(b);
    }
  }
  var SX = new Float32Array(N), SY = new Float32Array(N), SZ = new Float32Array(N), SQ = new Uint8Array(N);
  var order = new Uint16Array(N);
  for (k = 0; k < N; k++) order[k] = k;

  /* ---- estado da otimização ---- */
  var starts = [3.1, 1.12, 2.45, 1.2, 2.8, 1.08];
  var si = 0, c, epoch, noise, hold;
  function reseed() { c = starts[si++ % starts.length]; epoch = 0; noise = 1; hold = 0; }
  var ETA = 0.0007, MAXSTEP = 0.03, HOLD = 170;
  function stepFlow() {
    if (hold > 0) { hold--; if (hold === 0) reseed(); return; }
    var dc = -ETA * dW(c);
    if (dc > MAXSTEP) dc = MAXSTEP; else if (dc < -MAXSTEP) dc = -MAXSTEP;
    c += dc;
    if (c < 1.02) c = 1.02;
    noise *= 0.972;
    epoch++;
    if (Math.abs(c - SQ2) < 1e-4 && noise < 0.01) { c = SQ2; noise = 0; hold = HOLD; }
  }

  /* ---- cores do sinal, lidas do CSS para acompanhar o tema ---- */
  var LEVELS = 40, ALPHAS = 6, styles = [];
  function parseColor(s) {
    s = (s || "").trim();
    var m;
    if ((m = s.match(/^#([0-9a-f]{6})$/i))) {
      var n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    if ((m = s.match(/^#([0-9a-f]{3})$/i))) {
      return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
    }
    if ((m = s.match(/rgba?\(([^)]+)\)/))) {
      var p = m[1].split(/[\s,]+/).map(parseFloat);
      return [p[0], p[1], p[2]];
    }
    return [69, 184, 117];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function readPalette() {
    var cs = getComputedStyle(fig);
    var pick = function (a, b) { var v = cs.getPropertyValue(a).trim(); return v || cs.getPropertyValue(b); };
    var c1 = parseColor(pick("--flow-1", "--sig-1"));
    var c2 = parseColor(pick("--flow-2", "--sig-2"));
    var c3 = parseColor(pick("--flow-3", "--sig-3"));
    styles = [];
    for (var q = 0; q < LEVELS; q++) {
      var t = q / (LEVELS - 1);
      var col = t < 0.5 ? mix(c1, c2, t * 2) : mix(c2, c3, (t - 0.5) * 2);
      for (var al = 0; al < ALPHAS; al++) {
        var alpha = 0.22 + al * (0.74 / (ALPHAS - 1));
        styles.push("rgba(" + Math.round(col[0]) + "," + Math.round(col[1]) + "," + Math.round(col[2]) + "," + alpha.toFixed(3) + ")");
      }
    }
  }

  /* ---- tamanho ---- */
  var w = 1, h = 1, dpr = 1;
  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, Math.round(rect.width * dpr));
    h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  /* ---- desenho ---- */
  var t0 = performance.now();
  function draw(time) {
    var r = 1 / (1 + c), R = c * r;        // normaliza: R + r = 1
    var spin = 0.7 + (reduce ? 0 : (time - t0) * 0.00015);
    var tilt = 0.98;
    var cs = Math.cos(spin), sn = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
    var scale = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2 + h * 0.01;
    var f = 3.4;
    var amp = 0.24 * noise;
    for (var k = 0; k < N; k++) {
      var u = U[k], v = V[k];
      var cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
      var rad = R + r * cv;
      var x = rad * cu, y = rad * su, z = r * sv;
      if (amp > 0.0005) {
        var d = amp * r * NZ[k] * 1.7, e = amp * 0.32;
        x += cv * cu * d + JX[k] * e;
        y += cv * su * d + JY[k] * e;
        z += sv * d + JZ[k] * e;
      }
      var x1 = x * cs - y * sn, y1 = x * sn + y * cs;
      var y2 = y1 * ct - z * st, z2 = y1 * st + z * ct;
      var p = f / (f + z2);
      SX[k] = cx + x1 * scale * p;
      SY[k] = cy + y2 * scale * p;
      SZ[k] = z2;
      // curvatura média normalizada: H·r = (1 + cos v /(c + cos v)) / 2
      var hr = (1 + cv / (c + cv)) / 2;
      var t = (hr + 0.8) / 1.55;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      SQ[k] = Math.round(t * (LEVELS - 1));
    }
    order.sort(function (a, b) { return SZ[b] - SZ[a]; });
    ctx.clearRect(0, 0, w, h);
    var base = 1.05 * dpr, extra = 1.45 * dpr, TAU = 2 * PI;
    for (var n = 0; n < N; n++) {
      var q = order[n];
      var near = 1 - (SZ[q] + 1) / 2;      // 0 = fundo, 1 = frente
      if (near < 0) near = 0; else if (near > 1) near = 1;
      var al = Math.round(near * (ALPHAS - 1));
      ctx.fillStyle = styles[SQ[q] * ALPHAS + al];
      ctx.beginPath();
      ctx.arc(SX[q], SY[q], base + extra * near, 0, TAU);
      ctx.fill();
    }
  }

  var frame = 0;
  function hud() {
    if (hudE) hudE.textContent = epochLabel + " " + ("000" + epoch).slice(-4);
    if (hudC) hudC.textContent = "c = " + c.toFixed(4);
    if (hudW) hudW.textContent = "W = " + W(c).toFixed(4);
  }

  /* ---- laço ---- */
  var running = false, visible = true, last = 0, acc = 0, STEP = 1000 / 60;
  function loop(now) {
    if (!running) return;
    if (!last) last = now;
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) { stepFlow(); acc -= STEP; }
    draw(now);
    if ((frame++ & 3) === 0) hud();
    requestAnimationFrame(loop);
  }
  function start() { if (running || reduce) return; running = true; last = 0; requestAnimationFrame(loop); }
  function stop() { running = false; }

  function staticFrame() { c = SQ2; noise = 0; epoch = 1200; resize(); draw(performance.now()); hud(); }

  readPalette();
  resize();
  if (reduce) {
    staticFrame();
  } else {
    reseed();
    draw(performance.now());
    hud();
    start();
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(function () { resize(); if (!running) draw(performance.now()); }).observe(canvas);
  } else {
    window.addEventListener("resize", function () { resize(); });
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }).observe(fig);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else if (visible) start();
  });
  document.addEventListener("geometria:theme", function () {
    // espera a troca de variáveis CSS ser aplicada
    requestAnimationFrame(function () { readPalette(); if (!running) draw(performance.now()); });
  });
})();
