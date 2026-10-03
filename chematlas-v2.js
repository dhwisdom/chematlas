(() => {
  if (window.__CHEMATLAS_V2__) return;
  window.__CHEMATLAS_V2__ = true;

  const conceptData = {
    electronegativity: {
      title: 'Electronegativity',
      copy: 'An atom’s pull on shared electrons becomes a useful starting point for predicting charge distribution.',
      eq: 'Δχ → bond polarity',
      route: '/genchem/periodic'
    },
    bonding: {
      title: 'Bonding',
      copy: 'Electron sharing and transfer determine which atoms connect and how strongly they interact.',
      eq: 'electrons → bonds → structure',
      route: '/genchem/bonding'
    },
    polarity: {
      title: 'Polarity',
      copy: 'Bond dipoles become molecular behavior only after geometry decides whether the vectors reinforce or cancel.',
      eq: 'Σ μ(bond) → molecular dipole',
      route: '/genchem/geometry'
    },
    geometry: {
      title: 'Molecular geometry',
      copy: 'Three-dimensional arrangement changes polarity, steric access, intermolecular forces, and reactivity.',
      eq: 'electron domains → shape',
      route: '/genchem/geometry'
    },
    imf: {
      title: 'Intermolecular forces',
      copy: 'Charge distribution controls how molecules attract one another and therefore how bulk matter behaves.',
      eq: 'polarity → attractions → properties',
      route: '/genchem/imf'
    },
    organic: {
      title: 'Organic reactivity',
      copy: 'Polarity and geometry become electron flow. General Chemistry concepts turn into reaction mechanisms.',
      eq: 'structure → electron flow',
      route: '/organic'
    },
    biochem: {
      title: 'Biochemistry',
      copy: 'Energy, equilibrium, acids, bases, and molecular structure scale into proteins, enzymes, membranes, and metabolism.',
      eq: 'chemistry + organization → life',
      route: '/genchem/acidbase'
    }
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

  function navigate(path) {
    if (!path) return;
    if (location.pathname !== path) history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function currentLearning() {
    const modules = window.CHEM_GENCHEM?.modules || [];
    let currentId = '';
    let completed = [];
    try {
      currentId = localStorage.getItem('chematlas-genchem-current') || '';
      completed = JSON.parse(localStorage.getItem('chematlas-genchem-completed-v1') || '[]');
    } catch (_) {}
    const current = modules.find(m => m.id === currentId) || modules.find(m => m.id === 'geometry') || modules[0];
    return {
      current,
      completed,
      pct: modules.length ? Math.round((completed.length / modules.length) * 100) : 0
    };
  }

  function networkMarkup(includeDetail = true) {
    return `
      <svg viewBox="0 0 1000 520" aria-hidden="true">
        <g stroke="#315064" stroke-width="1.2" fill="none" opacity=".82">
          <line x1="500" y1="275" x2="180" y2="145"/><line x1="500" y1="275" x2="825" y2="135"/>
          <line x1="500" y1="275" x2="870" y2="320"/><line x1="500" y1="275" x2="700" y2="445"/>
          <line x1="500" y1="275" x2="305" y2="440"/><line x1="500" y1="275" x2="135" y2="315"/>
        </g>
        <g fill="#63e6e2" opacity=".8">
          <circle cx="350" cy="214" r="3"/><circle cx="660" cy="205" r="3"/><circle cx="682" cy="294" r="3"/>
          <circle cx="598" cy="365" r="3"/><circle cx="406" cy="360" r="3"/><circle cx="328" cy="299" r="3"/>
        </g>
      </svg>
      <button class="ca-v2-node bonding" data-v2-concept="bonding">Bonding</button>
      <button class="ca-v2-node polarity" data-v2-concept="polarity">Polarity</button>
      <button class="ca-v2-node geometry" data-v2-concept="geometry">Molecular geometry</button>
      <button class="ca-v2-node imf" data-v2-concept="imf">Intermolecular forces</button>
      <button class="ca-v2-node organic" data-v2-concept="organic">Organic reactivity</button>
      <button class="ca-v2-node biochem" data-v2-concept="biochem">Biochemistry</button>
      <button class="ca-v2-node center active" data-v2-concept="electronegativity"><span><strong>Electronegativity</strong><small>anchor concept · χ</small></span></button>
      ${includeDetail ? '<aside class="ca-v2-network-detail"><span>Selected relationship</span><h3 data-v2-title>Electronegativity</h3><p data-v2-copy></p><p style="font-family:Georgia,serif;color:#c9eeee" data-v2-eq></p><button data-v2-open>Open this concept →</button></aside>' : ''}
      <div class="ca-v2-network-caption"><span>FIG. 01 · CONNECTED CHEMISTRY MAP</span><span>tap a concept to follow the relationship</span></div>
    `;
  }

  function bindNetwork(root) {
    if (!root || root.dataset.v2Bound) return;
    root.dataset.v2Bound = '1';
    let selected = 'electronegativity';

    const select = key => {
      const data = conceptData[key];
      if (!data) return;
      selected = key;
      root.querySelectorAll('[data-v2-concept]').forEach(btn => btn.classList.toggle('active', btn.dataset.v2Concept === key));
      const title = root.querySelector('[data-v2-title]');
      const copy = root.querySelector('[data-v2-copy]');
      const eq = root.querySelector('[data-v2-eq]');
      if (title) title.textContent = data.title;
      if (copy) copy.textContent = data.copy;
      if (eq) eq.textContent = data.eq;
    };

    root.querySelectorAll('[data-v2-concept]').forEach(btn => btn.addEventListener('click', () => select(btn.dataset.v2Concept)));
    root.querySelector('[data-v2-open]')?.addEventListener('click', () => navigate(conceptData[selected]?.route));
    select(selected);
  }

  function upgradeLanding() {
    const landing = document.getElementById('caLandingView');
    if (!landing || landing.dataset.v2Upgraded) return;
    landing.dataset.v2Upgraded = '1';

    const scene = landing.querySelector('.ca-orbit-scene');
    if (scene) {
      scene.className = 'ca-v2-network';
      scene.removeAttribute('aria-hidden');
      scene.innerHTML = networkMarkup(true);
      bindNetwork(scene);
    }

    const eyebrow = landing.querySelector('.ca-hero-copy .eyebrow');
    if (eyebrow) eyebrow.textContent = 'A CONNECTED CHEMISTRY ATLAS';
  }

  function upgradeDashboard() {
    const home = document.getElementById('homeView');
    if (!home || home.querySelector('#caV2Atlas')) return;
    const learning = currentLearning();
    const title = learning.current?.title || 'Molecular Geometry & Polarity';
    const number = learning.current?.number ? String(learning.current.number).padStart(2,'0') : '04';

    const shell = document.createElement('section');
    shell.id = 'caV2Atlas';
    shell.innerHTML = `
      <div class="ca-v2-atlas-hero">
        <div>
          <p class="eyebrow">THE CHEMATLAS · CONNECTED CURRICULUM</p>
          <h2>Chemistry is <em>a connected system.</em></h2>
          <p>Trace how one idea becomes bonding, shape, polarity, intermolecular forces, reactivity, energy, and eventually life. The atlas keeps those relationships visible while you learn.</p>
          <div class="hero-actions"><button class="primary-button" data-v2-continue>Continue learning →</button><button class="secondary-button" data-v2-tutor>Ask the Tutor ✦</button></div>
        </div>
        <aside class="ca-v2-current">
          <p class="eyebrow">YOU ARE HERE</p>
          <div class="num">${number}</div>
          <h3>${esc(title)}</h3>
          <p>${learning.completed.length} of ${window.CHEM_GENCHEM?.modules?.length || 19} foundation modules mastered</p>
          <div class="track"><span style="width:${learning.pct}%"></span></div>
          <button class="text-button" data-v2-continue>Resume module →</button>
        </aside>
      </div>
      <div class="ca-v2-atlas-stage">
        <div class="ca-v2-network">${networkMarkup(true)}</div>
        <aside class="ca-v2-atlas-copy">
          <section><p class="eyebrow">HOW TO USE THE ATLAS</p><h3>Begin with a tendency. Keep the connections.</h3><p>Each branch is a question about electrons, structure, energy, or interactions. Follow a relationship when you need context rather than memorizing isolated chapters.</p></section>
          <section><p class="eyebrow">YOUR NEXT STEP</p><h3>${esc(title)}</h3><p>Continue from your current module, or jump through the network when a prerequisite or future connection needs attention.</p></section>
        </aside>
      </div>
    `;
    home.prepend(shell);
    bindNetwork(shell.querySelector('.ca-v2-network'));

    shell.querySelectorAll('[data-v2-continue]').forEach(btn => btn.addEventListener('click', () => {
      const route = learning.current?.id ? `/genchem/${learning.current.id}` : '/genchem';
      navigate(route);
    }));
    shell.querySelector('[data-v2-tutor]')?.addEventListener('click', () => navigate('/tutor'));

    const dashboardNav = document.querySelector('.nav-item[data-view="home"]');
    if (dashboardNav) dashboardNav.innerHTML = '<span>⌘</span> Atlas';
  }

  function broadPath(module) {
    const id = module?.id || '';
    if (['measurement','atoms-moles','formulas'].includes(id)) return ['Particles','Measurement','Structure'];
    if (['stoichiometry','aqueous','thermochemistry'].includes(id)) return ['Reactions','Matter','Energy'];
    if (['electronic','periodic','bonding','geometry'].includes(id)) return ['Electrons','Bonding','Shape','Polarity'];
    if (['gases','imf','solutions'].includes(id)) return ['Structure','Interactions','Bulk matter'];
    if (['kinetics','equilibrium','acidbase','solubility'].includes(id)) return ['Rates','Equilibrium','Acid–base'];
    return ['Energy','Spontaneity','Electrochemistry'];
  }

  function enhanceGenchem() {
    const workspace = document.querySelector('#genchemView .gc-workspace');
    if (!workspace || workspace.querySelector('.gc-v2-context')) return;
    const currentId = (() => { try { return localStorage.getItem('chematlas-genchem-current') || ''; } catch (_) { return ''; } })();
    const module = (window.CHEM_GENCHEM?.modules || []).find(m => m.id === currentId) || window.CHEM_GENCHEM?.modules?.[0];
    const path = broadPath(module);

    const rail = document.createElement('aside');
    rail.className = 'gc-v2-context';
    rail.innerHTML = `
      <section><span>You are here</span><h4>${esc(module?.title || 'General Chemistry')}</h4><div class="gc-v2-mini-path">${path.map((x,i)=>`<i>${i ? '→' : ''}</i><b>${esc(x)}</b>`).join('')}</div></section>
      <section><span>Atlas connection</span><h4>See what this concept changes.</h4><p>Return to the connected map when you need to understand why this module matters outside its chapter.</p><button data-v2-back-atlas>Open Atlas →</button></section>
      <section><span>Need a second explanation?</span><h4>Ask ChemWaypoint.</h4><p>The Tutor can use this module, your progress, and the rest of the curriculum as context.</p><button data-v2-open-tutor>Ask Tutor ✦</button></section>
    `;
    workspace.appendChild(rail);
    rail.querySelector('[data-v2-back-atlas]')?.addEventListener('click', () => navigate('/dashboard'));
    rail.querySelector('[data-v2-open-tutor]')?.addEventListener('click', () => navigate('/tutor'));
  }

  function refresh() {
    upgradeLanding();
    upgradeDashboard();
    enhanceGenchem();
  }

  const observer = new MutationObserver(() => requestAnimationFrame(refresh));
  observer.observe(document.documentElement, { childList:true, subtree:true });

  window.addEventListener('popstate', () => setTimeout(refresh, 60));
  document.addEventListener('click', () => setTimeout(refresh, 80), true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once:true });
  else refresh();
})();
