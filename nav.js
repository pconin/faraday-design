// Shared navigation bar for all Faraday design pages
(function() {
  const pages = [
    { label: 'Simulateur', file: 'logo-in-context.html', icon: '&#9654;' },
    { label: 'Palettes', file: 'color-palettes.html', icon: '&#9673;' },
    { label: 'Recherche V6', file: 'logo-research-v6.html', icon: '&#9733;' },
    { label: 'Recherche V5', file: 'logo-research-v5.html', icon: '&#9733;' },
    { label: 'Recherche V4', file: 'logo-research-v4.html', icon: '&#9733;' },
    { label: 'Experiments', file: 'logo-experiments.html', icon: '&#9672;' },
    { label: 'Logos V3', file: 'logo-proposals-v3.html', icon: '&#9650;' },
    { label: 'Logos V2', file: 'logo-proposals-v2.html', icon: '&#9651;' },
    { label: 'Logos N&B', file: 'logo-proposals.html', icon: '&#9671;' },
    { label: 'Logos Couleur', file: 'logo-proposals-color.html', icon: '&#9670;' },
    { label: 'App V3', file: 'app-mockups-v3.html', icon: '&#9632;' },
    { label: 'App V2', file: 'app-mockups-v2.html', icon: '&#9633;' },
    { label: 'App V1', file: 'app-mockups.html', icon: '&#9634;' },
  ];

  const current = window.location.pathname.split('/').pop();

  const nav = document.createElement('div');
  nav.innerHTML = `
    <div style="
      position:sticky;top:0;z-index:9999;
      background:#111;
      padding:10px 16px;
      display:flex;gap:6px;align-items:center;flex-wrap:wrap;
      border-bottom:2px solid #222;
      font-family:'Inter',system-ui,sans-serif;
    ">
      <a href="logo-in-context.html" style="
        font-size:13px;font-weight:700;color:#c8845a;text-decoration:none;
        letter-spacing:.02em;margin-right:12px;
      ">FARADAY</a>
      ${pages.map(p => `
        <a href="${p.file}" style="
          padding:5px 10px;border-radius:6px;font-size:10px;font-weight:500;
          text-decoration:none;transition:all .15s;
          ${current === p.file
            ? 'background:rgba(200,132,90,.15);color:#c8845a;border:1px solid rgba(200,132,90,.3);'
            : 'color:#777;border:1px solid #333;'
          }
        " onmouseover="if('${current}'!=='${p.file}')this.style.borderColor='#555';this.style.color='#bbb';"
           onmouseout="if('${current}'!=='${p.file}'){this.style.borderColor='#333';this.style.color='#777';}"
        >${p.label}</a>
      `).join('')}
    </div>
  `;

  document.body.insertBefore(nav.firstElementChild, document.body.firstChild);
})();
