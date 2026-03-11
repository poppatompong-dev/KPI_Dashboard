/* =============================================
   Shared Navigation System
   Municipal KPI Platform
   =============================================
   Floating bottom-nav on mobile, consistent
   top-bar across all pages.
   ============================================= */

const Nav = (() => {

  const PAGES = [
    { id: 'home',      href: 'index.html',      icon: '🏠', label: 'หน้าหลัก',     short: 'หลัก' },
    { id: 'executive', href: 'executive.html',   icon: '📊', label: 'ผู้บริหาร',     short: 'ผู้บริหาร' },
    { id: 'director',  href: 'director.html',    icon: '🏢', label: 'ผู้อำนวยการ',   short: 'ผอ.' },
    { id: 'reports',   href: 'reports.html',     icon: '📄', label: 'รายงาน',       short: 'รายงาน' },
    { id: 'admin',     href: 'admin.html',       icon: '📝', label: 'บันทึกผล',     short: 'บันทึก' },
    { id: 'backoffice',href: 'login.html',       icon: '⚙️', label: 'Admin',        short: 'Admin' },
  ];

  function getCurrentPage() {
    const path = window.location.pathname.split('/').pop().replace('.html', '');
    if (path === 'index' || path === '') return 'home';
    return path;
  }

  /**
   * Inject mobile bottom navigation bar into the page
   */
  function injectMobileNav() {
    if (document.getElementById('mobileBottomNav')) return;

    const current = getCurrentPage();
    const nav = document.createElement('nav');
    nav.id = 'mobileBottomNav';
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');

    nav.innerHTML = PAGES.map(p => {
      const active = p.id === current ? ' mobile-bottom-nav__item--active' : '';
      return `<a href="${p.href}" class="mobile-bottom-nav__item${active}" aria-label="${p.label}">
        <span class="mobile-bottom-nav__icon">${p.icon}</span>
        <span class="mobile-bottom-nav__label">${p.short}</span>
      </a>`;
    }).join('');

    document.body.appendChild(nav);
  }

  /**
   * Inject breadcrumb trail into top header
   */
  function injectBreadcrumb(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const current = getCurrentPage();
    const currentPage = PAGES.find(p => p.id === current);

    el.innerHTML = `
      <div class="breadcrumb">
        <a href="index.html" class="breadcrumb__item">🏠 หน้าหลัก</a>
        ${currentPage && currentPage.id !== 'home' ? `<span class="breadcrumb__sep">›</span><span class="breadcrumb__item breadcrumb__item--current">${currentPage.icon} ${currentPage.label}</span>` : ''}
      </div>`;
  }

  /**
   * Setup sidebar toggle for all pages
   */
  function setupSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('sidebar--open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('sidebar--open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('sidebar--open');
      }
    });
  }

  /**
   * Initialize navigation on page load
   */
  function init() {
    injectMobileNav();
    setupSidebar();
  }

  return { init, injectBreadcrumb, getCurrentPage, PAGES };
})();

document.addEventListener('DOMContentLoaded', Nav.init);
