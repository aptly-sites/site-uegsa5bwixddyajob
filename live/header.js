// Header behavior for the live-rendered /properties pages. Those pages ship without the
// site's React bundle (it would re-render the stale crawled content over the live
// content), so the two header interactions are reimplemented here: the Login dropdown and
// the mobile menu. Markup for both is emitted into the shell by tools/build-export.mjs.
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var loginButton = header.querySelector('.login-trigger');
  var loginMenu = header.querySelector('.login-menu');
  if (loginButton && loginMenu) {
    var setLogin = function (open) {
      loginMenu.style.display = open ? '' : 'none';
      loginButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    loginButton.addEventListener('click', function () { setLogin(loginButton.getAttribute('aria-expanded') !== 'true'); });
    loginMenu.addEventListener('click', function (event) { if (event.target.closest('a')) setLogin(false); });
  }

  var menuButton = header.querySelector('.mobile-menu-button');
  var mobileNav = header.querySelector('#mobile-nav');
  if (menuButton && mobileNav) {
    var menuIcon = menuButton.innerHTML;
    var closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
    var setMenu = function (open) {
      mobileNav.style.display = open ? '' : 'none';
      menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menuButton.innerHTML = open ? closeIcon : menuIcon;
    };
    menuButton.addEventListener('click', function () { setMenu(menuButton.getAttribute('aria-expanded') !== 'true'); });
    mobileNav.addEventListener('click', function (event) { if (event.target.closest('a')) setMenu(false); });
    window.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
    });
  }
})();
