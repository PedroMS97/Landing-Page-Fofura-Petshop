/* ===========================================================
   Fofuras Petshop — interactions
   =========================================================== */
(function () {
  'use strict';

  /* ---- Header scroll state ---- */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile drawer ---- */
  var drawer = document.getElementById('drawer');
  var openBtn = document.getElementById('hamburger');
  var closeBtn = document.getElementById('drawerClose');
  function openDrawer() { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { drawer.classList.remove('open'); document.body.style.overflow = ''; }
  if (openBtn) openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  drawer.addEventListener('click', function (e) { if (e.target === drawer) closeDrawer(); });
  drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeDrawer); });

  /* ---- Scroll reveal (default visible; hide only off-screen, then animate in) ---- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var docEl = document.documentElement;
  function inView(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || docEl.clientHeight;
    return r.top < vh * 0.9 && r.bottom > 0;
  }
  // Hide off-screen elements WITHOUT animating the hide (transitions disabled during arm).
  docEl.classList.add('no-anim');
  reveals.forEach(function (el) { if (!inView(el)) el.classList.add('pre'); });
  void document.body.offsetWidth; // force reflow so .pre is applied instantly
  docEl.classList.remove('no-anim');

  function reveal(el) { el.classList.remove('pre'); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { if (el.classList.contains('pre')) io.observe(el); });
  } else {
    reveals.forEach(reveal);
  }
  // Safety net: if the observer never fires (frozen/offscreen contexts), force-show
  // anything that's actually in view, instantly (no transition to stall on).
  setTimeout(function () {
    reveals.forEach(function (el) {
      if (el.classList.contains('pre') && inView(el)) { el.style.transition = 'none'; reveal(el); }
    });
  }, 1600);

  /* ---- Hero parallax ---- */
  var heroFrame = document.getElementById('heroFrame');
  if (heroFrame && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y < 900) heroFrame.style.transform = 'translateY(' + (y * 0.06) + 'px)';
    }, { passive: true });
  }

  /* ---- CountUp stats ---- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || '';
    var dur = 1900, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.floor(eased * target);
      el.textContent = val.toLocaleString('pt-BR') + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('pt-BR') + suffix;
    }
    requestAnimationFrame(step);
  }
  var statsIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { animateCount(en.target); statsIO.unobserve(en.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { statsIO.observe(el); });

  /* ---- Gallery lightbox ---- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var gItems = Array.prototype.slice.call(document.querySelectorAll('.g-item'));
  var lbIndex = 0;
  function srcOf(item) {
    var slot = item.querySelector('image-slot');
    // image-slot stores the filled image as a background or img; try common spots
    if (slot) {
      var inner = slot.shadowRoot && slot.shadowRoot.querySelector('img');
      if (inner && inner.src) return inner.src;
      var attr = slot.getAttribute('src');
      if (attr) return attr;
    }
    return null;
  }
  function openLB(i) {
    lbIndex = (i + gItems.length) % gItems.length;
    var s = srcOf(gItems[lbIndex]);
    if (!s) {
      // nothing dropped yet — show a friendly note state
      lbImg.removeAttribute('src');
      lbImg.alt = 'Adicione uma foto arrastando-a sobre o espaço da galeria';
      lb.classList.add('open', 'empty');
    } else {
      lbImg.src = s;
      lb.classList.add('open');
      lb.classList.remove('empty');
    }
    document.body.style.overflow = 'hidden';
  }
  function closeLB() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  gItems.forEach(function (item, i) { item.addEventListener('click', function () { openLB(i); }); });
  document.getElementById('lbClose').addEventListener('click', closeLB);
  document.getElementById('lbPrev').addEventListener('click', function () { openLB(lbIndex - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { openLB(lbIndex + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') openLB(lbIndex - 1);
    if (e.key === 'ArrowRight') openLB(lbIndex + 1);
  });

  /* ---- Testimonials carousel ---- */
  var track = document.getElementById('testiTrack');
  var cards = track ? track.children : [];
  var dotsWrap = document.getElementById('testiDots');
  var idx = 0;
  function perView() {
    if (window.innerWidth <= 620) return 1;
    if (window.innerWidth <= 980) return 2;
    return 3;
  }
  function maxIdx() { return Math.max(0, cards.length - perView()); }
  function buildDots() {
    dotsWrap.innerHTML = '';
    var pages = maxIdx() + 1;
    for (var i = 0; i < pages; i++) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Ir para depoimento ' + (i + 1));
      (function (n) { b.addEventListener('click', function () { idx = n; update(); }); })(i);
      dotsWrap.appendChild(b);
    }
  }
  function update() {
    idx = Math.min(idx, maxIdx());
    var card = cards[0];
    if (!card) return;
    var gap = 26;
    var step = card.getBoundingClientRect().width + gap;
    track.style.transform = 'translateX(' + (-idx * step) + 'px)';
    Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
      d.classList.toggle('active', i === idx);
    });
  }
  if (track) {
    document.getElementById('testiPrev').addEventListener('click', function () { idx = Math.max(0, idx - 1); update(); });
    document.getElementById('testiNext').addEventListener('click', function () { idx = Math.min(maxIdx(), idx + 1); update(); });
    buildDots(); update();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { buildDots(); update(); }, 150); });
    // autoplay
    setInterval(function () {
      if (document.hidden) return;
      idx = idx >= maxIdx() ? 0 : idx + 1;
      update();
    }, 5500);
  }

  /* ---- Contact form validation (Zod-style rules, vanilla) ---- */
  var form = document.getElementById('contactForm');
  function setErr(field, on, message) {
    field.classList.toggle('err', on);
    if (message) { var m = field.querySelector('.msg'); if (m) m.textContent = message; }
  }
  function validateField(input) {
    var field = input.closest('.field');
    var v = (input.value || '').trim();
    var name = input.name;
    var ok = true, msg = '';
    if (name === 'nome') { ok = v.length >= 2; msg = 'Informe seu nome completo.'; }
    else if (name === 'telefone') { ok = /^[()\d\s-]{8,}$/.test(v) && v.replace(/\D/g, '').length >= 10; msg = 'Telefone inválido.'; }
    else if (name === 'email') { ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); msg = 'E-mail inválido.'; }
    else if (name === 'servico') { ok = v !== ''; msg = 'Selecione um serviço.'; }
    else if (name === 'mensagem') { ok = v.length >= 5; msg = 'Conte um pouco mais (mín. 5 caracteres).'; }
    setErr(field, !ok, msg);
    return ok;
  }
  if (form) {
    form.querySelectorAll('input, select, textarea').forEach(function (inp) {
      inp.addEventListener('blur', function () { validateField(inp); });
      inp.addEventListener('input', function () { if (inp.closest('.field').classList.contains('err')) validateField(inp); });
    });
    // phone mask
    var tel = form.querySelector('[name="telefone"]');
    if (tel) tel.addEventListener('input', function () {
      var d = tel.value.replace(/\D/g, '').slice(0, 11);
      var out = d;
      if (d.length > 6) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length > 10 ? 7 : 6) + '-' + d.slice(d.length > 10 ? 7 : 6);
      else if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      else if (d.length > 0) out = '(' + d;
      tel.value = out;
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = form.querySelectorAll('input, select, textarea');
      var allOk = true;
      inputs.forEach(function (inp) { if (!validateField(inp)) allOk = false; });
      if (!allOk) return;
      document.getElementById('formOk').classList.add('show');
      form.reset();
      setTimeout(function () { document.getElementById('formOk').classList.remove('show'); }, 6000);
    });
  }

  /* ---- Year ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
