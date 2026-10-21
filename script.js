(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = matchMedia('(hover: none)').matches;
  var G = [196, 196, 196], D = [19, 174, 205];
  var dpr = function () { return Math.min(window.devicePixelRatio || 1, 2); };

  function dot(c, x, y, r, g, a) {
    var k = function (i) { return Math.round(G[i] + (D[i] - G[i]) * g); };
    c.globalAlpha = a; c.fillStyle = 'rgb(' + k(0) + ',' + k(1) + ',' + k(2) + ')';
    c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
  }

  var toggle = $('.nav__toggle'), menu = $('#menu');
  function setMenu(o) { menu.classList.toggle('open', o); toggle.setAttribute('aria-expanded', String(o)); }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    all('.section .head, .cards .card, .b, .carousel, .steps, .bootcamp').forEach(function (el) {
      el.classList.add('reveal'); io.observe(el);
    });
  }

  function field(canvas, host, textEl, frame) {
    var f = { ctx: canvas.getContext('2d'), w: 0, h: 0, fade: null, vis: true }, run = false, raf = 0, rt;
    f.fadeAt = function (x, y) {
      var a = f.fade; if (!a) return 1;
      var dx = Math.max(a.l - x, 0, x - a.r), dy = Math.max(a.t - y, 0, y - a.b);
      return 0.12 + 0.88 * Math.min(Math.sqrt(dx * dx + dy * dy) / 90, 1);
    };
    function loop(t) {
      if (!run) return;
      if (frame(f, t) === false) { run = false; return; }
      raf = requestAnimationFrame(loop);
    }
    function halt() { run = false; cancelAnimationFrame(raf); }
    f.wake = function () { if (reduced || run || !f.vis || document.hidden) return; run = true; raf = requestAnimationFrame(loop); };
    f.size = function () {
      var d = dpr(), hr = host.getBoundingClientRect(), c = textEl.getBoundingClientRect();
      f.w = host.clientWidth; f.h = host.clientHeight;
      canvas.width = f.w * d; canvas.height = f.h * d; f.ctx.setTransform(d, 0, 0, d, 0, 0);
      f.fade = { l: c.left - hr.left, t: c.top - hr.top, r: c.right - hr.left, b: c.bottom - hr.top };
      frame(f, performance.now());
    };
    new IntersectionObserver(function (e) { f.vis = e[0].isIntersecting; f.vis ? f.wake() : halt(); }).observe(host);
    document.addEventListener('visibilitychange', function () { document.hidden ? halt() : f.wake(); });
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(f.size, 120); });
    f.size();
    return f;
  }

  var hero = $('.hero'), hp = { x: -9999, y: -9999, tx: -9999, ty: -9999, on: false }, GAP = 28, R = 140;
  var hf = field($('#dots'), hero, $('.hero__copy'), function (f, t) {
    var c = f.ctx, s = reduced ? 0 : t * 0.001, cols = Math.ceil(f.w / GAP) + 1, rows = Math.ceil(f.h / GAP) + 1, i, j;
    c.clearRect(0, 0, f.w, f.h);
    if (touch && !reduced) { hp.x = f.w * (0.5 + 0.4 * Math.sin(s * 0.35)); hp.y = f.h * (0.5 + 0.3 * Math.sin(s * 0.5 + 1)); }
    else { hp.x += (hp.tx - hp.x) * 0.12; hp.y += (hp.ty - hp.y) * 0.12; }
    for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
      var bx = i * GAP, by = j * GAP, x = bx + Math.cos(j * 0.35 + s * 0.7) * 2, y = by + Math.sin(i * 0.35 + s * 0.8) * 3 + Math.cos(j * 0.3 + s * 0.6) * 2;
      var n = 0, dx = x - hp.x, dy = y - hp.y, d = Math.sqrt(dx * dx + dy * dy);
      if (!reduced && d < R) { n = 1 - d / R; n = n * n * (3 - 2 * n); x += dx / (d || 1) * n * 14; y += dy / (d || 1) * n * 14; }
      dot(c, x, y, 1.4 + n * 1.8, n > 0.35 ? (n - 0.35) / 0.65 : 0, f.fadeAt(bx, by));
    }
    c.globalAlpha = 1;
  });
  hero.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = hero.getBoundingClientRect(); hp.tx = e.clientX - r.left; hp.ty = e.clientY - r.top;
    if (!hp.on) { hp.x = hp.tx; hp.y = hp.ty; hp.on = true; }
  });
  hero.addEventListener('pointerleave', function () { hp.tx = hp.ty = -9999; hp.on = false; });

  var foot = $('.footer'), rip = [], last = { x: -999, y: -999 };
  var ff = field($('#ripples'), foot, $('.footer__in'), function (f, t) {
    var c = f.ctx, S = 24, cols = Math.ceil(f.w / S) + 1, rows = Math.ceil(f.h / S) + 1, i, j, q;
    c.clearRect(0, 0, f.w, f.h);
    rip = rip.filter(function (r) { return t - r.t < 3200; });
    for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
      var x = i * S, y = j * S, k = 0, ox = 0, oy = 0;
      for (q = 0; q < rip.length; q++) {
        var r = rip[q], age = (t - r.t) / 1000, dx = x - r.x, dy = y - r.y, d = Math.sqrt(dx * dx + dy * dy) || 1, off = d - age * 240;
        var e = Math.exp(-off * off / 1800) * r.a * Math.max(0, 1 - age / 3);
        k += e; ox += dx / d * e * 7; oy += dy / d * e * 7;
      }
      k = Math.min(k, 1);
      dot(c, x + ox, y + oy, 1.4 + 2.4 * k, k > 0.3 ? (k - 0.3) / 0.7 : 0, f.fadeAt(x, y));
    }
    c.globalAlpha = 1;
    return rip.length > 0;
  });
  function spawn(x, y, a) {
    if (reduced) return;
    rip.push({ x: x, y: y, t: performance.now(), a: a }); if (rip.length > 8) rip.shift(); ff.wake();
  }
  function local(e) { var r = foot.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  foot.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var p = local(e), dx = p.x - last.x, dy = p.y - last.y;
    if (dx * dx + dy * dy > 4900) { last = p; spawn(p.x, p.y, 0.7); }
  });
  foot.addEventListener('pointerdown', function (e) { var p = local(e); spawn(p.x, p.y, 1.1); });
  if (touch && !reduced) setInterval(function () { if (ff.vis) spawn(Math.random() * ff.w, Math.random() * ff.h, 0.8); }, 2800);

  var prog = $('.progress span'), pend = false;
  var bridges = all('.bridge').map(function (el) {
    var cv = el.firstElementChild; return { el: el, cv: cv, c: cv.getContext('2d'), w: 0, h: 0, vis: false };
  });
  function bsize(b) {
    var d = dpr(); b.w = b.el.clientWidth; b.h = b.el.clientHeight;
    b.cv.width = b.w * d; b.cv.height = b.h * d; b.c.setTransform(d, 0, 0, d, 0, 0);
  }
  function bdraw(b) {
    var r = b.el.getBoundingClientRect(), vh = window.innerHeight, i;
    var p = Math.min(Math.max((vh - r.top) / (vh + r.height), 0), 1), px = reduced ? -9999 : p * b.w;
    b.c.clearRect(0, 0, b.w, b.h);
    for (i = 0; i * 16 < b.w + 16; i++) {
      var x = i * 16 + 8, dx = x - px, g = Math.exp(-dx * dx / 24200);
      dot(b.c, x, b.h / 2 - g * 8, 1.2 + 2.6 * g, g > 0.25 ? (g - 0.25) / 0.75 : 0, 1);
    }
    b.c.globalAlpha = 1;
  }
  function sched() {
    if (pend) return; pend = true;
    requestAnimationFrame(function () {
      pend = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      bridges.forEach(function (b) { if (b.vis) bdraw(b); });
    });
  }
  var bio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { bridges.forEach(function (b) { if (b.el === e.target) b.vis = e.isIntersecting; }); });
    sched();
  }, { rootMargin: '100px' });
  bridges.forEach(function (b) { bsize(b); bio.observe(b.el); });
  window.addEventListener('scroll', sched, { passive: true });
  window.addEventListener('resize', function () { bridges.forEach(bsize); sched(); });
  sched();

  var tr = $('#track'), prev = $('#prev'), next = $('#next'), cur = $('#cur'), pg = $('#prog'), total = tr.children.length;
  function step() {
    var gap = parseFloat(getComputedStyle(tr).columnGap) || 0;
    return tr.children[0].getBoundingClientRect().width + gap;
  }
  function upd() {
    var s = step(), vis = Math.max(1, Math.round(tr.clientWidth / s));
    var first = Math.min(Math.round(tr.scrollLeft / s) + 1, total - vis + 1), lastN = first + vis - 1;
    cur.textContent = vis > 1 ? first + ' to ' + lastN + ' of ' + total : first + ' of ' + total;
    pg.style.transform = 'scaleX(' + lastN / total + ')';
    prev.disabled = tr.scrollLeft < 4;
    next.disabled = tr.scrollLeft > tr.scrollWidth - tr.clientWidth - 4;
  }
  function go(dir) { tr.scrollBy({ left: dir * step(), behavior: reduced ? 'auto' : 'smooth' }); }
  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
  tr.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  tr.addEventListener('scroll', upd, { passive: true });
  window.addEventListener('resize', upd);
  upd();
})();
