(function () {
  'use strict';
  var btn = document.querySelector('.menu-btn');
  var sidebar = document.querySelector('#sidebar');
  if (!btn || !sidebar) return;

  function setOpen(open) {
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('nav-open'));
  });

  sidebar.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();
