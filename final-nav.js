// Minimal navigation for final Faraday brand deliverables
(function() {
  const pages = [
    { label: 'Brandbook', file: 'brand-identity.html' },
    { label: 'Social assets', file: 'social-banners.html' },
    { label: 'Content redaction', file: 'content-redaction.html' },
  ];

  const current = window.location.pathname.split('/').pop() || 'brand-identity.html';

  const nav = document.createElement('header');
  nav.innerHTML = `
    <div style="
      position:relative;
      z-index:30;
      width:100%;
      border-bottom:1px solid rgba(21,29,42,.08);
      background:rgba(246,243,236,.92);
      backdrop-filter:saturate(140%) blur(10px);
    ">
      <div style="
        width:min(1280px,calc(100% - 48px));
        margin:0 auto;
        padding:18px 0;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:16px;
        flex-wrap:wrap;
        font-family:'Manrope',system-ui,sans-serif;
      ">
        <a href="brand-identity.html" style="
          font-family:'Sora',system-ui,sans-serif;
          font-size:18px;
          font-weight:300;
          letter-spacing:-.03em;
          color:#151D2A;
          text-decoration:none;
        ">faraday</a>
        <nav style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          ${pages.map((page) => `
            <a href="${page.file}" style="
              padding:9px 12px;
              border-radius:999px;
              font-size:12px;
              font-weight:700;
              letter-spacing:.04em;
              text-decoration:none;
              transition:all .15s ease;
              ${current === page.file
                ? 'background:#151D2A;color:#F6F3EC;border:1px solid #151D2A;'
                : 'background:transparent;color:#4A5560;border:1px solid rgba(21,29,42,.12);'
              }
            ">${page.label}</a>
          `).join('')}
        </nav>
      </div>
    </div>
  `;

  document.body.insertBefore(nav.firstElementChild, document.body.firstChild);
})();
