(() => {
  const course = window.CHEM_GENCHEM;
  if (!course) return;

  const root = document.getElementById('genchemApp');
  const view = document.getElementById('genchemView');
  if (!root || !view) return;

  const storageKey = 'chematlas-genchem-completed-v1';
  let completed = new Set();
  try { completed = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch (_) {}

  let semester = 1;
  let currentId = course.modules.find(m => m.semester === semester)?.id;
  try {
    semester = Number(localStorage.getItem('chematlas-genchem-semester') || 1);
    currentId = localStorage.getItem('chematlas-genchem-current') || course.modules.find(m => m.semester === semester)?.id;
  } catch (_) {}
  let selectedAnswer = null;
  let query = '';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const byId = id => document.getElementById(id);
  const modulesForSemester = n => course.modules.filter(m => m.semester === n);
  const currentModule = () => course.modules.find(m => m.id === currentId) || modulesForSemester(semester)[0];

  function saveProgress() {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...completed]));
      localStorage.setItem('chematlas-genchem-semester', String(semester));
      localStorage.setItem('chematlas-genchem-current', currentId);
    } catch (_) {}
  }

  function progressForSemester(n) {
    const mods = modulesForSemester(n);
    const done = mods.filter(m => completed.has(m.id)).length;
    return { done, total: mods.length, pct: mods.length ? Math.round(done / mods.length * 100) : 0 };
  }

  function openGenchem(moduleId) {
    if (moduleId && course.modules.some(m => m.id === moduleId)) {
      currentId = moduleId;
      semester = currentModule().semester;
    }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    view.classList.add('active-view');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.genchem-nav').forEach(n => n.classList.add('active'));
    const title = byId('pageTitle');
    if (title) title.textContent = 'General Chemistry Foundations';
    document.querySelector('.sidebar')?.classList.remove('open');
    saveProgress();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    const m = currentModule();
    if (!m || m.semester !== semester) currentId = modulesForSemester(semester)[0].id;
    const p1 = progressForSemester(1), p2 = progressForSemester(2);
    const active = currentModule();

    root.innerHTML = `
      <section class="gc-hero">
        <div class="gc-hero-copy">
          <p class="eyebrow">FOUNDATION COURSE • TWO-SEMESTER SEQUENCE</p>
          <h2>${esc(course.meta.title)}</h2>
          <p>${esc(course.meta.subtitle)}</p>
          <div class="gc-route" aria-label="General chemistry concept route">
            <span>measure</span><i>→</i><span>particles</span><i>→</i><span>reactions</span><i>→</i><span>energy</span><i>→</i><span>structure</span><i>→</i><span>equilibrium</span>
          </div>
        </div>
        <aside class="gc-progress-card">
          <div><span>Gen Chem I</span><strong>${p1.done}/${p1.total}</strong><small>modules mastered</small></div>
          <div class="gc-mini-track"><span style="width:${p1.pct}%"></span></div>
          <div><span>Gen Chem II</span><strong>${p2.done}/${p2.total}</strong><small>modules mastered</small></div>
          <div class="gc-mini-track"><span style="width:${p2.pct}%"></span></div>
        </aside>
      </section>

      <div class="gc-semester-tabs" role="tablist" aria-label="General chemistry semester">
        ${course.semesters.map(s => `<button class="gc-semester-tab ${semester===s.number?'active':''}" data-semester="${s.number}">
          <span>SEMESTER ${s.number}</span><strong>${esc(s.title)}</strong><small>${esc(s.focus)}</small>
        </button>`).join('')}
      </div>

      <section class="gc-workspace">
        <aside class="gc-syllabus panel">
          <div class="gc-syllabus-head">
            <div><p class="eyebrow">COURSE MAP</p><h3>${semester === 1 ? 'General Chemistry I' : 'General Chemistry II'}</h3></div>
            <span class="gc-count">${modulesForSemester(semester).length} modules</span>
          </div>
          <label class="gc-search"><span>⌕</span><input id="gcSearch" type="search" value="${esc(query)}" placeholder="Find a concept…" aria-label="Find a concept"></label>
          <nav class="gc-module-nav" aria-label="General chemistry modules">
            ${moduleNavHtml()}
          </nav>
        </aside>

        <main class="gc-reader" id="gcReader">
          ${moduleHtml(active)}
        </main>
      </section>
    `;

    bindShell();
  }

  function moduleNavHtml() {
    const q = query.trim().toLowerCase();
    const mods = modulesForSemester(semester).filter(m => !q || [m.title,m.subtitle,...m.outcomes,...m.vocabulary].join(' ').toLowerCase().includes(q));
    if (!mods.length) return '<p class="gc-empty">No modules match that search.</p>';
    return mods.map(m => `
      <button class="gc-module-link ${m.id===currentId?'active':''} ${completed.has(m.id)?'complete':''}" data-module="${m.id}">
        <span class="gc-module-number">${completed.has(m.id)?'✓':String(m.number).padStart(2,'0')}</span>
        <span><strong>${esc(m.title)}</strong><small>${esc(m.subtitle)}</small></span>
      </button>`).join('');
  }

  function moduleHtml(m) {
    selectedAnswer = null;
    const semModules = modulesForSemester(m.semester);
    const idx = semModules.findIndex(x => x.id === m.id);
    const prev = semModules[idx-1], next = semModules[idx+1];
    const status = completed.has(m.id) ? '<span class="gc-status complete">✓ Mastered</span>' : '<span class="gc-status">In progress</span>';

    return `
      <article class="gc-module-header panel">
        <div class="gc-module-kicker"><span>MODULE ${String(m.number).padStart(2,'0')}</span>${status}</div>
        <h2>${esc(m.title)}</h2>
        <p>${esc(m.subtitle)}</p>
        <div class="gc-prereq"><strong>Builds on:</strong> ${esc(m.prerequisite)}</div>
        <div class="gc-objectives">
          <p class="eyebrow">BY THE END, YOU SHOULD BE ABLE TO</p>
          <ul>${m.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
        </div>
      </article>

      ${m.sections.map((s,i) => `
        <article class="gc-reading panel">
          <div class="gc-section-label">${String(i+1).padStart(2,'0')}</div>
          <div><h3>${esc(s.title)}</h3>${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
        </article>`).join('')}

      ${m.equations?.length ? `
        <article class="gc-equations panel">
          <div><p class="eyebrow">CORE RELATIONSHIPS</p><h3>Equations to understand, not just memorize</h3></div>
          <div class="gc-equation-grid">${m.equations.map(e => `<div><span>${esc(e.label)}</span><strong>${esc(e.expression)}</strong></div>`).join('')}</div>
        </article>` : ''}

      <article class="gc-example panel">
        <div class="gc-example-title"><span>WORKED EXAMPLE</span><h3>${esc(m.example.prompt)}</h3></div>
        <ol>${m.example.steps.map((s,i) => `<li><span>${i+1}</span><p>${esc(s)}</p></li>`).join('')}</ol>
        <div class="gc-example-answer"><span>Answer</span><strong>${esc(m.example.answer)}</strong></div>
      </article>

      <article class="gc-check panel">
        <div class="gc-check-head"><div><p class="eyebrow">QUICK CHECK</p><h3>${esc(m.check.question)}</h3></div><span>1 question</span></div>
        <div class="gc-check-options">${m.check.choices.map((c,i) => `<button class="gc-check-choice" data-choice="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(c)}</button>`).join('')}</div>
        <div class="gc-check-actions"><button id="gcCheckAnswer" class="primary-button" disabled>Check answer</button><div id="gcFeedback" class="gc-feedback" aria-live="polite"></div></div>
      </article>

      <div class="gc-connections">
        ${m.lab ? `<article class="panel gc-connection"><span class="gc-connection-icon">⚗</span><div><p class="eyebrow">LAB CONNECTION</p><p>${esc(m.lab)}</p></div></article>` : ''}
        <article class="panel gc-connection bridge"><span class="gc-connection-icon">↗</span><div><p class="eyebrow">WHY THIS MATTERS LATER • ${esc(m.bridge.course).toUpperCase()}</p><p>${esc(m.bridge.text)}</p></div></article>
      </div>

      ${m.tool ? `<button class="gc-tool-launch" data-gc-tool="${esc(m.tool.action)}"><span>INTERACTIVE TOOL</span><strong>${esc(m.tool.label)}</strong><b>→</b></button>` : ''}

      <article class="gc-vocab panel">
        <p class="eyebrow">KEY LANGUAGE</p>
        <div>${m.vocabulary.map(v => `<span>${esc(v)}</span>`).join('')}</div>
      </article>

      <nav class="gc-reader-nav" aria-label="Module navigation">
        <button ${prev?'':'disabled'} data-module-nav="${prev?.id || ''}">← <span>${prev ? esc(prev.title) : 'Start of semester'}</span></button>
        <button ${next?'':'disabled'} data-module-nav="${next?.id || ''}"><span>${next ? esc(next.title) : 'End of semester'}</span> →</button>
      </nav>

      <details class="gc-scope panel">
        <summary>Curriculum scope & sources</summary>
        <p>${esc(course.meta.scope)}</p>
        <div>${course.meta.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}</div>
      </details>
    `;
  }

  function bindShell() {
    root.querySelectorAll('[data-semester]').forEach(btn => btn.addEventListener('click', () => {
      semester = Number(btn.dataset.semester);
      const firstIncomplete = modulesForSemester(semester).find(m => !completed.has(m.id));
      currentId = (firstIncomplete || modulesForSemester(semester)[0]).id;
      query = '';
      saveProgress();
      render();
    }));

    root.querySelectorAll('[data-module]').forEach(btn => btn.addEventListener('click', () => selectModule(btn.dataset.module)));
    root.querySelectorAll('[data-module-nav]').forEach(btn => btn.addEventListener('click', () => { if (btn.dataset.moduleNav) selectModule(btn.dataset.moduleNav); }));

    const search = byId('gcSearch');
    search?.addEventListener('input', () => {
      query = search.value;
      const nav = root.querySelector('.gc-module-nav');
      if (nav) {
        nav.innerHTML = moduleNavHtml();
        nav.querySelectorAll('[data-module]').forEach(btn => btn.addEventListener('click', () => selectModule(btn.dataset.module)));
      }
    });

    bindModuleInteractions();
  }

  function selectModule(id) {
    const m = course.modules.find(x => x.id === id);
    if (!m) return;
    currentId = id;
    semester = m.semester;
    query = '';
    saveProgress();
    render();
    requestAnimationFrame(() => byId('gcReader')?.scrollIntoView({ behavior:'smooth', block:'start' }));
  }

  function bindModuleInteractions() {
    const m = currentModule();
    const checkBtn = byId('gcCheckAnswer');
    root.querySelectorAll('.gc-check-choice').forEach(btn => btn.addEventListener('click', () => {
      selectedAnswer = Number(btn.dataset.choice);
      root.querySelectorAll('.gc-check-choice').forEach(b => b.classList.toggle('selected', b === btn));
      if (checkBtn) checkBtn.disabled = false;
      const feedback = byId('gcFeedback');
      if (feedback) { feedback.className='gc-feedback'; feedback.textContent=''; }
    }));

    checkBtn?.addEventListener('click', () => {
      const feedback = byId('gcFeedback');
      const correct = selectedAnswer === m.check.answer;
      root.querySelectorAll('.gc-check-choice').forEach(btn => {
        const idx = Number(btn.dataset.choice);
        btn.classList.toggle('correct', idx === m.check.answer);
        btn.classList.toggle('wrong', idx === selectedAnswer && !correct);
      });
      if (correct) {
        completed.add(m.id);
        saveProgress();
        updateHomeProgress();
        updateCourseCards();
        feedback.className='gc-feedback good';
        feedback.textContent='Correct — ' + m.check.explanation;
        setTimeout(() => {
          const card = root.querySelector('.gc-progress-card');
          if (card) {
            root.querySelector('.gc-status')?.classList.add('complete');
            if (root.querySelector('.gc-status')) root.querySelector('.gc-status').textContent='✓ Mastered';
          }
          root.querySelector(`.gc-module-link[data-module="${m.id}"]`)?.classList.add('complete');
        }, 80);
      } else {
        feedback.className='gc-feedback bad';
        feedback.textContent='Not quite. ' + m.check.explanation;
      }
    });

    root.querySelectorAll('[data-gc-tool="lab"]').forEach(btn => btn.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="lab"]')?.click();
    }));
  }

  function updateCourseCards() {
    document.querySelectorAll('.course-card').forEach(card => {
      const name = card.querySelector('h3')?.textContent?.trim();
      const sem = name === 'General Chemistry I' ? 1 : name === 'General Chemistry II' ? 2 : null;
      if (!sem) return;
      const mods = modulesForSemester(sem);
      const p = progressForSemester(sem);
      const list = card.querySelector('.module-list');
      if (list) list.innerHTML = mods.map(m => `<span>${esc(m.title)}</span>`).join('');
      const actions = card.querySelector('.course-actions');
      if (actions) {
        actions.innerHTML = `<small>${mods.length} modules • ${p.done}/${p.total} mastered</small><button class="text-button gc-card-open" data-gc-sem="${sem}">Open full course →</button>`;
        actions.querySelector('.gc-card-open')?.addEventListener('click', () => {
          semester = sem;
          currentId = (mods.find(m => !completed.has(m.id)) || mods[0]).id;
          openGenchem();
        });
      }
    });
  }

  function updateHomeProgress() {
    const card = document.querySelector('#homeView .progress-card');
    if (!card) return;
    const done = course.modules.filter(m => completed.has(m.id)).length;
    const total = course.modules.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const pill = card.querySelector('.pill');
    const track = card.querySelector('.progress-track span');
    if (pill) pill.textContent = `${done}/${total} mastered`;
    if (track) track.style.width = `${pct}%`;
    const next = course.modules.find(m => !completed.has(m.id)) || course.modules[0];
    const btn = card.querySelector('[data-genchem-open]');
    if (btn && next) {
      btn.dataset.genchemModule = next.id;
      const title = btn.querySelector('strong');
      const small = btn.querySelector('small');
      const icon = btn.querySelector('.lesson-icon');
      if (title) title.textContent = next.title;
      if (small) small.textContent = completed.size === total ? 'Review any module' : 'Reading + worked example + mastery check';
      if (icon) icon.textContent = String(next.number).padStart(2, '0');
    }
  }

  function setupEntryPoints() {
    document.querySelectorAll('[data-genchem-open]').forEach(btn => btn.addEventListener('click', (event) => {
      event.preventDefault();
      openGenchem(btn.dataset.genchemModule || undefined);
    }));

    document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.genchem-nav').forEach(n => n.classList.remove('active'));
    }));

    updateCourseCards();
  }

  setupEntryPoints();
  updateHomeProgress();
  render();

  // Load the interactive General Chemistry Practice Lab after the reader is ready.
  if (!document.querySelector('link[href="genchem-tools.css"]')) {
    const practiceStyle = document.createElement('link');
    practiceStyle.rel = 'stylesheet';
    practiceStyle.href = 'genchem-tools.css';
    document.head.appendChild(practiceStyle);
  }
  if (!document.querySelector('script[src="genchem-tools.js"]')) {
    const practiceScript = document.createElement('script');
    practiceScript.src = 'genchem-tools.js';
    document.body.appendChild(practiceScript);
  }
})();
