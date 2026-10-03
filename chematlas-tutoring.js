(() => {
  if (window.__CHEMATLAS_TUTORING_UI__) return;
  window.__CHEMATLAS_TUTORING_UI__ = true;

  const LS = {
    modules: 'chematlas-genchem-completed-v1',
    history: 'chematlas-practice-history-v1',
    current: 'chematlas-genchem-current',
    semester: 'chematlas-genchem-semester',
    tools: 'chematlas-gc-tools-v1'
  };

  const safeJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

  function modules() { return window.CHEM_GENCHEM?.modules || []; }

  function navigate(path) {
    if (!path) return;
    if (location.pathname !== path) history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function currentLearning() {
    const all = modules();
    const completed = safeJson(LS.modules, []);
    let currentId = '';
    try { currentId = localStorage.getItem(LS.current) || ''; } catch (_) {}
    const current = all.find(m => m.id === currentId) || all.find(m => m.id === 'geometry') || all[0];
    const index = Math.max(0, all.findIndex(m => m.id === current?.id));
    const next = all.slice(index + 1).find(m => !completed.includes(m.id)) || all.find(m => !completed.includes(m.id)) || current;
    return {
      all, completed, current, next,
      pct: all.length ? Math.round((completed.length / all.length) * 100) : 0
    };
  }

  function waterSvg() {
    return `
      <svg class="ca-water-svg" viewBox="0 0 380 220" role="img" aria-label="Bent water molecule showing bond dipoles and a net molecular dipole">
        <defs>
          <marker id="ca-arrow-teal" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#2f8c80"/></marker>
          <marker id="ca-arrow-amber" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#c88c36"/></marker>
        </defs>
        <path d="M190 91L114 151M190 91L266 151" stroke="#9bbab0" stroke-width="5" stroke-linecap="round"/>
        <path d="M141 130L174 104" stroke="#2f8c80" stroke-width="2" marker-end="url(#ca-arrow-teal)"/>
        <path d="M239 130L206 104" stroke="#2f8c80" stroke-width="2" marker-end="url(#ca-arrow-teal)"/>
        <path d="M190 166L190 112" stroke="#c88c36" stroke-width="2.3" stroke-dasharray="4 4" marker-end="url(#ca-arrow-amber)"/>
        <path d="M164 112A38 38 0 0 0 216 112" fill="none" stroke="#adc3bb" stroke-width="1.5"/>
        <text x="190" y="132" fill="#66837b" text-anchor="middle" font-size="11">104.5°</text>
        <circle cx="190" cy="84" r="28" fill="#167d77"/>
        <text x="190" y="90" fill="#fff" text-anchor="middle" font-size="17" font-weight="700">O</text>
        <circle cx="107" cy="157" r="21" fill="#eaf2ec" stroke="#8eb2a5" stroke-width="1.5"/>
        <circle cx="273" cy="157" r="21" fill="#eaf2ec" stroke="#8eb2a5" stroke-width="1.5"/>
        <text x="107" y="163" fill="#355a5b" text-anchor="middle" font-size="15" font-weight="700">H</text>
        <text x="273" y="163" fill="#355a5b" text-anchor="middle" font-size="15" font-weight="700">H</text>
        <circle cx="180" cy="41" r="3.5" fill="#607f76"/><circle cx="190" cy="38" r="3.5" fill="#607f76"/>
        <circle cx="190" cy="51" r="3.5" fill="#607f76"/><circle cx="200" cy="48" r="3.5" fill="#607f76"/>
        <text x="190" y="24" fill="#728982" text-anchor="middle" font-size="9">2 lone pairs</text>
        <text x="179" y="77" fill="#e9fffa" text-anchor="end" font-size="9">δ−</text>
        <text x="84" y="158" fill="#a07435" text-anchor="middle" font-size="9">δ+</text>
        <text x="296" y="158" fill="#a07435" text-anchor="middle" font-size="9">δ+</text>
        <text x="190" y="190" fill="#a77935" text-anchor="middle" font-size="9" font-weight="700">net dipole</text>
        <text x="190" y="207" fill="#82938d" text-anchor="middle" font-size="8">bond dipoles do not cancel in a bent shape</text>
      </svg>`;
  }

  function enhanceLanding() {
    const landing = document.getElementById('caLandingView');
    if (!landing || landing.dataset.tutoringLanding === '1') return;
    landing.dataset.tutoringLanding = '1';
    landing.innerHTML = `
      <header class="ca-marketing-nav">
        <button class="ca-marketing-brand" data-route="/"><span>⚛</span><strong>ChemAtlas</strong></button>
        <nav>
          <button data-route="/courses">Courses</button>
          <button data-route="/model-lab">Labs</button>
          <button data-route="/tutor">AI Tutor</button>
          <button class="ca-marketing-profile" data-account-open>Create profile</button>
        </nav>
      </header>

      <section class="ca-marketing-hero">
        <div class="ca-marketing-copy">
          <p class="ca-marketing-kicker">COLLEGE CHEMISTRY · BUILT TO TEACH</p>
          <h1>A chemistry tutor that always knows <em>what comes next.</em></h1>
          <p class="ca-marketing-lede">Learn a concept, manipulate it, practice the reasoning, and get help the moment something stops making sense. ChemAtlas keeps the path through General Chemistry clear without flattening the science.</p>
          <div class="ca-marketing-actions">
            <button class="primary-button" data-start-learning>Start learning</button>
            <button class="secondary-button" data-route="/dashboard">Explore ChemAtlas</button>
          </div>
          <div class="ca-marketing-proof">
            <span><strong>19</strong><small>Gen Chem modules</small></span>
            <span><strong>7</strong><small>practice engines</small></span>
            <span><strong>3D</strong><small>molecular tools</small></span>
            <span><strong>AI</strong><small>course-aware tutor</small></span>
          </div>
        </div>

        <div class="ca-marketing-demo">
          <div class="ca-demo-top"><span>CONTINUE LEARNING</span><strong>General Chemistry I</strong></div>
          <div class="ca-demo-card">
            <div>
              <small>MODULE 10 · IN PROGRESS</small>
              <h2>Molecular Geometry & Polarity</h2>
              <p>Connect electron domains to molecular shape, then use that shape to predict whether bond dipoles cancel.</p>
              <div class="ca-demo-meta"><span>12 min lesson</span><i></i><span>35% complete</span></div>
            </div>
            <div class="ca-demo-molecule">${waterSvg()}</div>
          </div>
          <div class="ca-demo-next">
            <span class="ca-demo-icon">◎</span>
            <span><small>RECOMMENDED NEXT</small><strong>Practice VSEPR shapes</strong></span>
            <b>→</b>
          </div>
          <div class="ca-demo-tutor">
            <span>✦</span>
            <div><small>ASK CHEMATLAS</small><strong>“Why is H₂O polar but CO₂ isn’t?”</strong></div>
          </div>
        </div>
      </section>

      <section class="ca-marketing-flow">
        <div class="ca-flow-heading"><p>ONE LEARNING LOOP</p><h2>Everything points to the next useful action.</h2></div>
        <div class="ca-flow-grid">
          <article><span>01</span><div class="ca-flow-icon">▤</div><h3>Learn</h3><p>Short explanations, worked examples, and real chemistry relationships.</p></article>
          <article><span>02</span><div class="ca-flow-icon">⚛</div><h3>Explore</h3><p>Use models and visualizations when flat diagrams stop being enough.</p></article>
          <article><span>03</span><div class="ca-flow-icon amber">◎</div><h3>Practice</h3><p>Answer focused questions and get immediate feedback on the reasoning.</p></article>
          <article><span>04</span><div class="ca-flow-icon">✦</div><h3>Get help</h3><p>Ask the Tutor with the current lesson and your progress already in context.</p></article>
        </div>
      </section>

      <section class="ca-marketing-path">
        <div><p>YOUR CHEMISTRY PATH</p><h2>Start where you are. Keep the prerequisites visible.</h2></div>
        <div class="ca-path-steps">
          <button data-route="/genchem"><span>01</span><strong>General Chemistry</strong><small>Particles · bonding · energy · equilibrium</small></button>
          <i>→</i>
          <button data-route="/organic"><span>02</span><strong>Organic Chemistry</strong><small>Structure · stereochemistry · mechanisms</small></button>
          <i>→</i>
          <button disabled><span>03</span><strong>Biochemistry</strong><small>Proteins · enzymes · metabolism</small></button>
        </div>
      </section>

      <section class="ca-marketing-bottom">
        <div><p>READY WHEN YOU ARE</p><h2 id="caLandingNext">Start with the foundation.</h2><span id="caLandingNextCopy">Tell ChemAtlas what you are working toward and it will suggest a path.</span></div>
        <button class="primary-button" data-start-learning>Choose my learning goal →</button>
      </section>
    `;
  }

  function harmonizeShellDetails() {
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    if (!sidebar || !topbar) return;

    const secondary = sidebar.querySelector('.ca-sidebar-secondary');
    if (secondary) secondary.remove();

    const sync = document.querySelector('.ca-sync-status');
    if (sync && sync.parentElement !== sidebar) {
      sync.classList.add('ca-student-row');
      sidebar.appendChild(sync);
    }

    const actions = topbar.querySelector('.top-actions');
    if (actions && !actions.querySelector('.ca-help-button')) {
      const help = document.createElement('button');
      help.className = 'ca-help-button';
      help.type = 'button';
      help.setAttribute('aria-label','Open AI Tutor');
      help.textContent = '?';
      help.addEventListener('click', () => navigate('/tutor'));
      actions.prepend(help);
    }

    const titleWrap = topbar.querySelector(':scope > div:first-of-type');
    const title = document.getElementById('pageTitle');
    if (titleWrap && title && !titleWrap.querySelector('.ca-breadcrumb-course')) {
      const course = document.createElement('span');
      course.className = 'ca-breadcrumb-course';
      course.textContent = 'General Chemistry I';
      titleWrap.prepend(course);
    }
  }

  function routeLabel() {
    const p = location.pathname;
    if (p === '/dashboard') return 'Home';
    if (p.startsWith('/genchem')) return 'Learn';
    if (p === '/model-lab') return 'Labs';
    if (p === '/tutor') return 'AI Tutor';
    if (p === '/progress') return 'Progress';
    if (p.startsWith('/organic')) return 'Organic Studio';
    if (p === '/courses') return 'Courses';
    if (p === '/curriculum') return 'Curriculum';
    return 'Home';
  }

  function updateBreadcrumb() {
    const title = document.getElementById('pageTitle');
    const course = document.querySelector('.ca-breadcrumb-course');
    if (course) course.textContent = location.pathname.startsWith('/organic') ? 'Organic Chemistry' : 'General Chemistry I';
    if (title && !document.body.classList.contains('ca-landing-mode')) title.textContent = routeLabel();
  }

  function installShell() {
    const sidebar = document.querySelector('.sidebar');
    const nav = sidebar?.querySelector('.nav-list');
    if (!sidebar || !nav) return;

    const mark = sidebar.querySelector('.brand-mark');
    if (mark) mark.textContent = '⚛';
    const subtitle = sidebar.querySelector('.brand span');
    if (subtitle) subtitle.textContent = 'Chemistry tutor';

    if (!sidebar.querySelector('.ca-course-switcher')) {
      const switcher = document.createElement('div');
      switcher.className = 'ca-course-switcher';
      switcher.innerHTML = `
        <span class="ca-course-switcher-icon">⚗</span>
        <span class="ca-course-switcher-copy"><small>MY COURSE</small><strong>General Chemistry I</strong></span>
        <button type="button" aria-label="Open course library">⌄</button>`;
      sidebar.querySelector('.brand')?.after(switcher);
      switcher.querySelector('button')?.addEventListener('click', () => navigate('/courses'));
    }

    if (!nav.querySelector('.ca-tutoring-nav-group')) {
      const group = document.createElement('div');
      group.className = 'ca-tutoring-nav-group';
      group.innerHTML = `
        <span class="ca-learning-nav-label">LEARNING</span>
        <button class="ca-tutor-nav" data-ca-tutor-route="/dashboard"><span class="icon">⌂</span><span>Home</span></button>
        <button class="ca-tutor-nav" data-ca-tutor-route="/genchem"><span class="icon">▤</span><span>Learn</span></button>
        <button class="ca-tutor-nav" data-ca-tutor-practice><span class="icon">◎</span><span>Practice</span><i class="ca-practice-dot"></i></button>
        <button class="ca-tutor-nav" data-ca-tutor-route="/model-lab"><span class="icon">⚗</span><span>Labs</span></button>
        <button class="ca-tutor-nav" data-ca-tutor-route="/tutor"><span class="icon">✦</span><span>AI Tutor</span></button>
        <button class="ca-tutor-nav" data-ca-tutor-route="/progress"><span class="icon">▥</span><span>Progress</span></button>`;
      nav.prepend(group);
      group.querySelectorAll('[data-ca-tutor-route]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.caTutorRoute)));
      group.querySelector('[data-ca-tutor-practice]')?.addEventListener('click', () => launchPractice());
    }

    if (!sidebar.querySelector('.ca-sidebar-tutor')) {
      const assist = document.createElement('button');
      assist.className = 'ca-sidebar-tutor';
      assist.innerHTML = '<span class="spark">✦</span><span><strong>Need a hand?</strong><small>Ask your chemistry tutor</small></span>';
      assist.addEventListener('click', () => navigate('/tutor'));
      nav.after(assist);

      const secondary = document.createElement('div');
      secondary.className = 'ca-sidebar-secondary';
      secondary.innerHTML = '<button data-route-secondary="/organic">Organic Studio</button><button data-route-secondary="/curriculum">Degree map</button>';
      assist.after(secondary);
      secondary.querySelectorAll('[data-route-secondary]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.routeSecondary)));
    }

    setActiveNav();
  }

  function installSearch() {
    const topbar = document.querySelector('.topbar');
    const actions = topbar?.querySelector('.top-actions');
    if (!topbar || !actions || topbar.querySelector('.ca-top-search')) return;

    const wrap = document.createElement('div');
    wrap.className = 'ca-top-search';
    wrap.innerHTML = `
      <label><span>⌕</span><input type="search" placeholder="Search concepts..." aria-label="Search ChemAtlas"><kbd>⌘ K</kbd></label>
      <div class="ca-search-results" hidden></div>`;
    topbar.insertBefore(wrap, actions);

    const input = wrap.querySelector('input');
    const results = wrap.querySelector('.ca-search-results');

    const search = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.hidden = true; results.innerHTML = ''; return; }
      const matches = modules().filter(m => [m.title,m.subtitle,...(m.vocabulary||[])].join(' ').toLowerCase().includes(q)).slice(0,6);
      results.innerHTML = matches.length
        ? matches.map(m => `<button class="ca-search-result" data-search-module="${esc(m.id)}"><span>⌕</span><span><strong>${esc(m.title)}</strong><small>General Chemistry · Module ${String(m.number).padStart(2,'0')}</small></span></button>`).join('')
        : '<button class="ca-search-result" data-search-tutor><span>✦</span><span><strong>Ask ChemAtlas instead</strong><small>Open the AI Tutor</small></span></button>';
      results.hidden = false;
      results.querySelectorAll('[data-search-module]').forEach(btn => btn.addEventListener('click', () => {
        input.value = ''; results.hidden = true; navigate('/genchem/' + btn.dataset.searchModule);
      }));
      results.querySelector('[data-search-tutor]')?.addEventListener('click', () => {
        input.value = ''; results.hidden = true; navigate('/tutor');
      });
    };

    input.addEventListener('input', search);
    input.addEventListener('focus', search);
    document.addEventListener('click', event => {
      if (!wrap.contains(event.target)) results.hidden = true;
    });
    window.addEventListener('keydown', event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); input.focus();
      }
      if (event.key === 'Escape') { results.hidden = true; input.blur(); }
    });
  }

  function launchPractice(tool) {
    navigate('/genchem');
    let attempts = 70;
    const tick = () => {
      const launch = document.querySelector('.gc-practice-launch');
      const overlay = document.getElementById('gcPracticeOverlay');
      if (launch) launch.click();
      else if (overlay) overlay.classList.add('open');
      else if (attempts-- > 0) return setTimeout(tick, 100);
      else return;
      document.body.style.overflow = 'hidden';
      if (tool) setTimeout(() => document.querySelector(`.gc-tool-tab[data-tool="${CSS.escape(tool)}"]`)?.click(), 100);
    };
    setTimeout(tick, 120);
  }

  function moduleProgress(module, learning) {
    if (!module) return 0;
    if (learning.completed.includes(module.id)) return 100;
    if (module.id === learning.current?.id) return 35;
    const currentIndex = learning.all.findIndex(m => m.id === learning.current?.id);
    const index = learning.all.findIndex(m => m.id === module.id);
    if (index < currentIndex) return 70;
    return 0;
  }

  function recentHtml(history) {
    if (!history.length) return '<div class="ca-recent-item"><i>·</i><span><strong>Your activity will appear here</strong><small>Complete a lesson or practice set to start your history.</small></span></div>';
    return history.slice(0,3).map(item => `
      <div class="ca-recent-item"><i>✓</i><span><strong>${esc(item.label || 'Chemistry activity')}</strong><small>${new Date(item.at || Date.now()).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small></span></div>
    `).join('');
  }

  function renderHome() {
    const home = document.getElementById('homeView');
    if (!home) return;
    let root = home.querySelector('.ca-home');
    if (!root) {
      root = document.createElement('div');
      root.className = 'ca-home';
      home.prepend(root);
    }

    const learning = currentLearning();
    const current = learning.current;
    const next = learning.next;
    const history = safeJson(LS.history, []);
    const renderSignature = [current?.id || '', learning.completed.join(','), history.length, history[0]?.id || history[0]?.at || ''].join('|');
    if (root.dataset.renderSignature === renderSignature) return;
    root.dataset.renderSignature = renderSignature;
    const featured = ['electronic','bonding','stoichiometry','geometry']
      .map(id => learning.all.find(m => m.id === id)).filter(Boolean);
    const pct = Math.max(learning.pct, current && !learning.completed.includes(current.id) ? Math.min(95, learning.pct + 5) : learning.pct);

    root.innerHTML = `
      <header class="ca-home-welcome">
        <div><h2>Welcome back.</h2><p>One concept at a time. Your next chemistry step is ready.</p></div>
        <div class="ca-home-course-label">GENERAL CHEMISTRY · ${learning.completed.length}/${learning.all.length} MODULES MASTERED</div>
      </header>

      <section class="ca-continue">
        <div class="ca-continue-copy">
          <div class="ca-continue-kicker"><i></i> PICK UP WHERE YOU LEFT OFF</div>
          <h3>${esc(current?.title || 'Molecular Geometry & Polarity')}</h3>
          <p class="ca-continue-summary">${esc(current?.subtitle || 'Connect molecular shape to polarity and intermolecular behavior.')}</p>
          <div class="ca-lesson-meta"><span>Module ${String(current?.number || 10).padStart(2,'0')}</span><i></i><span>Guided lesson</span><i></i><span>${pct}% course mastery</span></div>
          <div class="ca-continue-footer">
            <div class="ca-track"><span style="width:${pct}%"></span></div><span class="ca-percent">${pct}%</span>
            <button class="primary-button" data-home-continue>Continue lesson →</button>
          </div>
        </div>
        <div class="ca-continue-visual">${waterSvg()}</div>
      </section>

      <div class="ca-home-grid">
        <section>
          <div class="ca-section-head"><h3>A good next move</h3><button data-home-course>View course →</button></div>
          <div class="ca-recommendations">
            <button class="ca-rec selected" data-home-practice><span class="ca-rec-icon">◎</span><span><strong>Practice a foundation skill</strong><small>Warm up with focused problems before the next concept.</small></span><span class="ca-rec-status">Review recommended</span></button>
            <button class="ca-rec" data-home-current><span class="ca-rec-icon">▤</span><span><strong>${esc(current?.title || 'Current lesson')}</strong><small>Keep your current learning sequence moving.</small></span><span class="ca-rec-status">Continue lesson</span></button>
            <button class="ca-rec" data-home-next><span class="ca-rec-icon">⚛</span><span><strong>${esc(next?.title || 'Next concept')}</strong><small>${esc(next?.subtitle || 'Build on what you just learned.')}</small></span><span class="ca-rec-status">Ready to learn</span></button>
          </div>
          <div class="ca-rec-action"><strong>Why this order?</strong> Practice makes the current model easier to transfer into the next topic.<button data-home-tutor>Ask Tutor about my next step →</button></div>
        </section>

        <div class="ca-home-side">
          <section class="ca-mastery">
            <div class="ca-mastery-top"><h3>Course mastery</h3><strong>${learning.pct}%</strong></div>
            <p>Overall General Chemistry progress</p>
            ${featured.map(m => {
              const amount = moduleProgress(m, learning);
              return `<div class="ca-module-progress"><span>${esc(m.title)}</span><span class="bar"><i style="width:${amount}%"></i></span><b>${amount}%</b></div>`;
            }).join('')}
          </section>
          <section class="ca-recent"><div class="ca-section-head"><h3>Recent activity</h3><button data-home-progress>Progress →</button></div><div class="ca-recent-list">${recentHtml(history)}</div></section>
          <section class="ca-ask-strip"><span class="spark">✦</span><div><strong>Stuck on something?</strong><small>Ask ChemAtlas using your current course context.</small></div><button data-home-tutor>Ask Tutor →</button></section>
        </div>
      </div>
    `;

    root.querySelector('[data-home-continue]')?.addEventListener('click', () => navigate('/genchem/' + (current?.id || 'geometry')));
    root.querySelector('[data-home-current]')?.addEventListener('click', () => navigate('/genchem/' + (current?.id || 'geometry')));
    root.querySelector('[data-home-next]')?.addEventListener('click', () => navigate('/genchem/' + (next?.id || 'imf')));
    root.querySelector('[data-home-course]')?.addEventListener('click', () => navigate('/genchem'));
    root.querySelector('[data-home-progress]')?.addEventListener('click', () => navigate('/progress'));
    root.querySelector('[data-home-practice]')?.addEventListener('click', () => launchPractice());
    root.querySelectorAll('[data-home-tutor]').forEach(btn => btn.addEventListener('click', () => navigate('/tutor')));
  }

  function enhanceGenchem() {
    const view = document.getElementById('genchemView');
    const workspace = view?.querySelector('.gc-workspace');
    const reader = workspace?.querySelector('.gc-reader');
    if (!view || !workspace || !reader || workspace.dataset.tutoringEnhanced === '1') return;
    workspace.dataset.tutoringEnhanced = '1';

    workspace.querySelector('.gc-v2-context')?.remove();
    reader.querySelector('.ca-learning-sequence')?.remove();

    const allModules = modules();
    const completed = safeJson(LS.modules, []);
    const currentId = (() => { try { return localStorage.getItem(LS.current) || ''; } catch (_) { return ''; } })();
    const current = allModules.find(m => m.id === currentId) || allModules[0];
    const semester = Number((() => { try { return localStorage.getItem(LS.semester) || current?.semester || 1; } catch (_) { return current?.semester || 1; } })());
    const semesterModules = allModules.filter(m => m.semester === semester);
    const semesterDone = semesterModules.filter(m => completed.includes(m.id)).length;

    if (!view.querySelector('.ca-learn-summary')) {
      const summary = document.createElement('section');
      summary.className = 'ca-learn-summary';
      summary.innerHTML = `
        <div>
          <p class="ca-learn-overline">GENERAL CHEMISTRY ${semester === 2 ? 'II' : 'I'}</p>
          <h2>Learn one idea at a time.</h2>
          <p>Short explanations, a worked example, then a quick check. Everything else stays available when you need it.</p>
        </div>
        <div class="ca-learn-progress" aria-label="${semesterDone} of ${semesterModules.length} modules mastered">
          <span><b>${semesterDone}</b> / ${semesterModules.length} mastered</span>
          <div><i style="width:${semesterModules.length ? Math.round(semesterDone / semesterModules.length * 100) : 0}%"></i></div>
        </div>
      `;
      view.insertBefore(summary, view.querySelector('.gc-semester-tabs') || workspace);
    }

    const header = reader.querySelector('.gc-module-header');
    if (header) {
      const prereq = header.querySelector('.gc-prereq');
      const objectives = header.querySelector('.gc-objectives');
      if ((prereq || objectives) && !header.querySelector('.ca-lesson-goals')) {
        const details = document.createElement('details');
        details.className = 'ca-lesson-goals';
        details.innerHTML = '<summary>What will I learn?</summary><div class="ca-lesson-goals-body"></div>';
        const body = details.querySelector('.ca-lesson-goals-body');
        if (prereq) body.appendChild(prereq);
        if (objectives) body.appendChild(objectives);
        header.appendChild(details);
      }

      if (!header.querySelector('.ca-inline-tutor')) {
        const tutor = document.createElement('button');
        tutor.className = 'ca-inline-tutor';
        tutor.innerHTML = '✦ Ask Tutor about this lesson';
        tutor.addEventListener('click', () => navigate('/tutor'));
        header.appendChild(tutor);
      }
    }

    const readings = [...reader.querySelectorAll(':scope > .gc-reading')];
    const equations = reader.querySelector(':scope > .gc-equations');
    const example = reader.querySelector(':scope > .gc-example');
    const check = reader.querySelector(':scope > .gc-check');

    const steps = [];
    readings.forEach((el, index) => steps.push({
      el,
      kind: 'Learn',
      label: el.querySelector('h3')?.textContent?.trim() || `Concept ${index + 1}`
    }));
    if (equations) steps.push({ el: equations, kind: 'Reference', label: 'Key relationships' });
    if (example) steps.push({ el: example, kind: 'Example', label: 'Worked example' });
    if (check) steps.push({ el: check, kind: 'Check', label: 'Check your understanding' });

    if (!steps.length) return;

    steps.forEach(({el}) => el.classList.add('ca-focus-panel'));

    const focus = document.createElement('section');
    focus.className = 'ca-focus-shell';
    focus.innerHTML = `
      <header class="ca-focus-head">
        <div>
          <span class="ca-focus-count">STEP <b>1</b> OF ${steps.length}</span>
          <span class="ca-focus-kind">LEARN</span>
          <h3 class="ca-focus-title">${esc(steps[0].label)}</h3>
        </div>
        <div class="ca-focus-meter" aria-label="Lesson progress"><span></span></div>
      </header>
      <nav class="ca-focus-dots" aria-label="Lesson steps">
        ${steps.map((step, index) => `<button type="button" data-focus-index="${index}" aria-label="Step ${index + 1}: ${esc(step.label)}"><span></span></button>`).join('')}
      </nav>
    `;

    steps[0].el.before(focus);

    const footer = document.createElement('nav');
    footer.className = 'ca-focus-footer';
    footer.setAttribute('aria-label','Lesson step navigation');
    footer.innerHTML = `
      <button type="button" class="ca-focus-back">← Back</button>
      <span class="ca-focus-helper">Take your time. You can revisit any step.</span>
      <button type="button" class="ca-focus-next">Continue →</button>
    `;

    const lastStep = steps[steps.length - 1].el;
    lastStep.after(footer);

    const optional = [
      reader.querySelector(':scope > .gc-connections'),
      reader.querySelector(':scope > .gc-tool-launch'),
      reader.querySelector(':scope > .gc-vocab'),
      reader.querySelector(':scope > .gc-scope')
    ].filter(Boolean);

    if (optional.length) {
      const more = document.createElement('details');
      more.className = 'ca-lesson-more';
      more.innerHTML = '<summary>More resources & connections</summary><div class="ca-lesson-more-body"></div>';
      const body = more.querySelector('.ca-lesson-more-body');
      optional.forEach(el => body.appendChild(el));
      footer.after(more);
    }

    const readerNav = reader.querySelector(':scope > .gc-reader-nav');
    if (readerNav) readerNav.classList.add('ca-module-navigation');

    let activeIndex = 0;

    function showStep(index, moveFocus = false) {
      activeIndex = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach((step, i) => {
        step.el.hidden = i !== activeIndex;
        step.el.setAttribute('aria-hidden', i === activeIndex ? 'false' : 'true');
      });

      focus.querySelector('.ca-focus-count b').textContent = String(activeIndex + 1);
      focus.querySelector('.ca-focus-kind').textContent = steps[activeIndex].kind.toUpperCase();
      focus.querySelector('.ca-focus-title').textContent = steps[activeIndex].label;
      focus.querySelector('.ca-focus-meter span').style.width = `${((activeIndex + 1) / steps.length) * 100}%`;

      focus.querySelectorAll('[data-focus-index]').forEach((button, i) => {
        const active = i === activeIndex;
        button.classList.toggle('active', active);
        button.setAttribute('aria-current', active ? 'step' : 'false');
      });

      const back = footer.querySelector('.ca-focus-back');
      const next = footer.querySelector('.ca-focus-next');
      back.disabled = activeIndex === 0;

      if (activeIndex === steps.length - 1) {
        next.hidden = true;
        footer.querySelector('.ca-focus-helper').textContent = 'Complete the check above when you are ready.';
      } else {
        next.hidden = false;
        next.textContent = activeIndex === steps.length - 2 ? 'Continue to quick check →' : 'Continue →';
        footer.querySelector('.ca-focus-helper').textContent = 'Take your time. You can revisit any step.';
      }

      if (moveFocus) {
        const heading = steps[activeIndex].el.querySelector('h2,h3,[role="heading"]') || steps[activeIndex].el;
        heading.setAttribute('tabindex','-1');
        heading.focus({preventScroll:true});
        focus.scrollIntoView({behavior:'smooth',block:'start'});
      }
    }

    focus.querySelectorAll('[data-focus-index]').forEach(button => {
      button.addEventListener('click', () => showStep(Number(button.dataset.focusIndex), true));
    });
    footer.querySelector('.ca-focus-back')?.addEventListener('click', () => showStep(activeIndex - 1, true));
    footer.querySelector('.ca-focus-next')?.addEventListener('click', () => showStep(activeIndex + 1, true));

    showStep(0, false);
  }

  function setActiveNav() {
    const path = location.pathname;
    document.querySelectorAll('.ca-tutor-nav').forEach(btn => btn.classList.remove('active'));
    let selector = '[data-ca-tutor-route="/dashboard"]';
    if (path.startsWith('/genchem')) selector = '[data-ca-tutor-route="/genchem"]';
    else if (path === '/model-lab') selector = '[data-ca-tutor-route="/model-lab"]';
    else if (path === '/tutor') selector = '[data-ca-tutor-route="/tutor"]';
    else if (path === '/progress') selector = '[data-ca-tutor-route="/progress"]';
    document.querySelector('.ca-tutor-nav' + selector)?.classList.add('active');
  }

  function cleanupV2() {
    document.getElementById('caV2Atlas')?.remove();
    document.querySelectorAll('.gc-v2-context').forEach(el => el.remove());
  }

  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      cleanupV2();
      enhanceLanding();
      installShell();
      harmonizeShellDetails();
      installSearch();
      renderHome();
      enhanceGenchem();
      setActiveNav();
      updateBreadcrumb();
    });
  }

  const observer = new MutationObserver(refresh);
  function start() {
    refresh();
    observer.observe(document.body, {childList:true,subtree:true});
    window.addEventListener('popstate', () => setTimeout(refresh, 50));
    window.addEventListener('storage', () => setTimeout(refresh, 50));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();