/* Tinkro — shared site behaviour */
(function () {
  document.documentElement.classList.remove('no-js');
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.burger');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
    });
  }
  var onScroll = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Scroll reveal
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Waitlist (front-end only)
  // TODO(backend): connect a real form backend here (e.g. Cloudflare Pages Function + KV/D1,
  // Formspree, Buttondown, or a Google Sheet webhook). Replace the localStorage block below with
  // a fetch('/api/waitlist', {method:'POST', body: JSON.stringify({email})}).
  document.querySelectorAll('form[data-waitlist]').forEach(function (f) {
    var msg = f.parentNode.querySelector('.wl-msg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = f.querySelector('input[type=email]');
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { if (msg) msg.textContent = 'Please enter a valid email address.'; input.focus(); return; }
      try {
        var list = JSON.parse(localStorage.getItem('tinkro_waitlist') || '[]');
        if (list.indexOf(email) === -1) list.push(email);
        localStorage.setItem('tinkro_waitlist', JSON.stringify(list));
      } catch (err) {}
      f.reset();
      if (msg) msg.textContent = "Thanks — you're on the list. We'll email you when your workspace is ready.";
    });
  });

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
