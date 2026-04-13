// Footer for final Faraday brand deliverables with archive links
(function() {
  const finalPages = [
    { label: 'Brandbook', file: 'brand-identity.html' },
    { label: 'Assets', file: 'assets.html' },
    { label: 'Content redaction', file: 'content-redaction.html' },
  ];

  const archivePages = [
    { label: 'Piste 2', file: 'brand-identity-p2.html' },
    { label: 'Brand Props', file: 'faraday-brand-proposals.html' },
    { label: 'LED Props', file: 'faraday-led-brand-proposals.html' },
    { label: 'LED Props V2', file: 'faraday-led-brand-proposals-v2.html' },
    { label: 'LED Props V3', file: 'faraday-led-brand-proposals-v3.html' },
    { label: 'LED Props V4', file: 'faraday-led-brand-proposals-v4.html' },
    { label: 'Recherche V4', file: 'logo-research-v4.html' },
    { label: 'Recherche V5', file: 'logo-research-v5.html' },
    { label: 'Recherche V6', file: 'logo-research-v6.html' },
    { label: 'Simulateur', file: 'logo-in-context.html' },
    { label: 'Selection', file: 'logo-selection.html' },
    { label: 'Palettes V2', file: 'color-palettes-v2.html' },
    { label: 'Palettes V1', file: 'color-palettes.html' },
    { label: 'Experiments', file: 'logo-experiments.html' },
    { label: 'Logos V3', file: 'logo-proposals-v3.html' },
    { label: 'Logos V2', file: 'logo-proposals-v2.html' },
    { label: 'Logos N&B', file: 'logo-proposals.html' },
    { label: 'Logos Couleur', file: 'logo-proposals-color.html' },
    { label: 'App V3', file: 'app-mockups-v3.html' },
    { label: 'App V2', file: 'app-mockups-v2.html' },
    { label: 'App V1', file: 'app-mockups.html' },
  ];

  const footer = document.createElement('footer');
  footer.innerHTML = `
    <footer style="
      margin-top:56px;
      border-top:1px solid rgba(21,29,42,.08);
      background:#0F1722;
      color:#F6F3EC;
      font-family:'Manrope',system-ui,sans-serif;
    ">
      <div style="
        width:min(1280px,calc(100% - 48px));
        margin:0 auto;
        padding:36px 0 40px;
        display:grid;
        grid-template-columns:1.2fr 1fr 1.4fr;
        gap:28px;
      ">
        <div>
          <div style="font-family:'Sora',system-ui,sans-serif;font-size:26px;font-weight:300;letter-spacing:-.04em;">faraday</div>
          <div style="margin-top:10px;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;opacity:.56;">Disconnect to reconnect</div>
          <p style="margin-top:14px;max-width:320px;font-size:13px;line-height:1.7;color:rgba(246,243,236,.68);">
            Brandbook final, kit social et territoire éditorial. Les anciennes explorations restent accessibles ici en archive.
          </p>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.48;margin-bottom:12px;">Pages finales</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${finalPages.map((page) => `
              <a href="${page.file}" style="color:#F6F3EC;text-decoration:none;font-size:14px;line-height:1.5;opacity:.9;">${page.label}</a>
            `).join('')}
          </div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.48;margin-bottom:12px;">Archive de recherche</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px 10px;">
            ${archivePages.map((page) => `
              <a href="${page.file}" style="
                color:rgba(246,243,236,.72);
                text-decoration:none;
                font-size:12px;
                padding:7px 10px;
                border-radius:999px;
                border:1px solid rgba(246,243,236,.12);
              ">${page.label}</a>
            `).join('')}
          </div>
        </div>
      </div>
    </footer>
  `;

  document.body.appendChild(footer.firstElementChild);
})();
