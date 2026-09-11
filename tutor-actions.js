(() => {
  if (window.__CHEMATLAS_TUTOR_ACTIONS__) return;
  window.__CHEMATLAS_TUTOR_ACTIONS__ = true;

  const ACTION_LIMIT = 3;
  const MOLECULES = [
    { id: 'h2o', label: 'H₂O', aliases: ['h2o', 'water'] },
    { id: 'co2', label: 'CO₂', aliases: ['co2', 'carbon dioxide'] },
    { id: 'ch4', label: 'CH₄', aliases: ['ch4', 'methane'] },
    { id: 'nh3', label: 'NH₃', aliases: ['nh3', 'ammonia'] },
    { id: 'bf3', label: 'BF₃', aliases: ['bf3', 'boron trifluoride'] },
    { id: 'pcl5', label: 'PCl₅', aliases: ['pcl5', 'phosphorus pentachloride'] },
    { id: 'sf6', label: 'SF₆', aliases: ['sf6', 'sulfur hexafluoride'] }
  ];

  const PRACTICE_RULES = [
    { tool: 'acid', label: 'Practice acid/base', test: /\b(acid|base|buffer|ph|pka|pkb|henderson|titration|protonat|deprotonat)\b/ },
    { tool: 'stoich', label: 'Practice stoichiometry', test: /\b(stoich|mole|moles|molar mass|limiting reagent|theoretical yield|percent yield|mole ratio)\b/ },
    { tool: 'balance', label: 'Practice balancing', test: /\b(balance|balanced equation|coefficient|atom accounting)\b/ },
    { tool: 'lewis', label: 'Practice Lewis structures', test: /\b(lewis|formal charge|resonance|lone pair|electron dot|octet)\b/ },
    { tool: 'equilibrium', label: 'Practice equilibrium', test: /\b(equilibrium|reaction quotient|q vs|ice table|le chatelier|kc|kp)\b/ },
    { tool: 'calorimetry', label: 'Open calorimetry lab', test: /\b(calorim|q\s*=\s*mc|specific heat|heat capacity|temperature change|enthalpy)\b/ },
    { tool: 'periodic', label: 'Practice periodic trends', test: /\b(periodic trend|electronegativity|ionization energy|atomic radius|effective nuclear charge)\b/ }
  ];

  const GEOMETRY_RE = /\b(vsepr|molecular geometry|molecular shape|bond angle|dipole|polarity|polar|nonpolar|linear|bent|tetrahedral|trigonal|octahedral|hybridization)\b/;
  const ORGANIC_RE = /\b(organic|stereo|stereochem|chirality|chiral|cip|newman|chair|cyclohexane|sn2|sn1|e1|e2|mechanism|curved arrow)\b/;
  const SUBSCRIPTS = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

  function normalize(value) {
    return String(value || '')
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, ch => SUBSCRIPTS[ch] || ch)
      .replace(/[−–—]/g, '-')
      .toLowerCase();
  }

  function previousUserText(message) {
    let node = message?.previousElementSibling;
    while (node) {
      if (node.matches?.('.ca-message.user')) return node.querySelector('.ca-message-copy')?.textContent || node.textContent || '';
      node = node.previousElementSibling;
    }
    return '';
  }

  function findMolecule(primaryText, fallbackText) {
    const primary = normalize(primaryText);
    const fallback = normalize(fallbackText);
    for (const molecule of MOLECULES) {
      if (molecule.aliases.some(alias => primary.includes(alias))) return molecule;
    }
    for (const molecule of MOLECULES) {
      if (molecule.aliases.some(alias => fallback.includes(alias))) return molecule;
    }
    return null;
  }

  function firstCourseSource(message) {
    const buttons = [...message.querySelectorAll('.ca-context-list button[data-route]')];
    const button = buttons.find(item => String(item.dataset.route || '').startsWith('/genchem/')) || buttons[0];
    if (!button) return null;
    return {
      route: button.dataset.route || '/courses',
      title: button.querySelector('strong')?.textContent?.trim() || 'course module'
    };
  }

  function suggestedActions(message) {
    const answer = message.querySelector('.ca-message-copy')?.textContent || '';
    if (!answer || /tutor connection note/i.test(answer)) return [];
    const question = previousUserText(message);
    const combined = normalize(`${question}\n${answer}`);
    const actions = [];
    const seen = new Set();
    const add = action => {
      const key = `${action.type}:${action.value || action.route || ''}`;
      if (seen.has(key) || actions.length >= ACTION_LIMIT) return;
      seen.add(key); actions.push(action);
    };

    const molecule = findMolecule(question, answer);
    if (molecule && GEOMETRY_RE.test(combined)) {
      add({ type: 'vsepr', value: molecule.id, label: `Open ${molecule.label} in VSEPR`, icon: '◈' });
    }

    const practice = PRACTICE_RULES.find(rule => rule.test.test(combined));
    if (practice) add({ type: 'practice', value: practice.tool, label: practice.label, icon: '⚗' });

    if (ORGANIC_RE.test(combined)) {
      add({ type: 'route', route: '/organic', label: 'Open Organic Studio', icon: '⌬' });
    }

    const source = firstCourseSource(message);
    if (source) {
      const short = source.title.length > 34 ? `${source.title.slice(0, 31)}…` : source.title;
      add({ type: 'route', route: source.route, label: `Open ${short}`, icon: '↗' });
    }

    if (!actions.length) add({ type: 'route', route: '/progress', label: 'See my next step', icon: '→' });
    return actions;
  }

  function actionHtml(action) {
    const attrs = action.type === 'route'
      ? `data-ca-copilot="route" data-route-value="${esc(action.route)}"`
      : `data-ca-copilot="${esc(action.type)}" data-action-value="${esc(action.value)}"`;
    return `<button class="ca-copilot-action ${esc(action.type)}" ${attrs}><span>${esc(action.icon || '→')}</span>${esc(action.label)}</button>`;
  }

  function decorateMessage(message) {
    if (!message?.matches?.('.ca-message.assistant') || message.dataset.caActionsReady === '1') return;
    if (message.classList.contains('ca-thinking')) return;
    const body = message.querySelector('.ca-message-body');
    if (!body) return;
    const actions = suggestedActions(message);
    message.dataset.caActionsReady = '1';
    if (!actions.length) return;
    const panel = document.createElement('div');
    panel.className = 'ca-copilot-actions';
    panel.innerHTML = `<div class="ca-copilot-label"><span>✦</span><b>DO NEXT</b><small>Launch a ChemAtlas learning activity</small></div><div class="ca-copilot-buttons">${actions.map(actionHtml).join('')}</div>`;
    body.appendChild(panel);
  }

  function scan() {
    document.querySelectorAll('#caTutorView .ca-message.assistant').forEach(decorateMessage);
  }

  function navigate(path) {
    if (!path) return;
    if (location.pathname !== path) history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function waitFor(selector, callback, attempts = 60, delay = 100) {
    const found = document.querySelector(selector);
    if (found) { callback(found); return; }
    if (attempts <= 0) return;
    setTimeout(() => waitFor(selector, callback, attempts - 1, delay), delay);
  }

  function pulse(element) {
    if (!element) return;
    element.classList.remove('ca-copilot-pulse');
    void element.offsetWidth;
    element.classList.add('ca-copilot-pulse');
    setTimeout(() => element.classList.remove('ca-copilot-pulse'), 1800);
  }

  function launchVsepr(moleculeId) {
    navigate('/model-lab');
    waitFor('#moleculeSelect', select => {
      if ([...select.options].some(option => option.value === moleculeId)) {
        select.value = moleculeId;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      select.scrollIntoView({ behavior: 'smooth', block: 'center' });
      pulse(select.closest('.model-card,.model-panel,.panel') || select);
    });
  }

  function launchPractice(tool) {
    navigate('/genchem');
    const openPractice = () => {
      const existing = document.getElementById('gcPracticeOverlay');
      const launch = document.querySelector('.gc-practice-launch');
      if (launch) launch.click();
      else if (existing) existing.classList.add('open');
      else return false;
      document.body.style.overflow = 'hidden';
      return true;
    };
    let attempts = 70;
    const tick = () => {
      if (!openPractice() && attempts-- > 0) return setTimeout(tick, 100);
      waitFor(`.gc-tool-tab[data-tool="${CSS.escape(tool)}"]`, tab => {
        tab.click();
        pulse(document.getElementById('gcToolStage') || tab);
      });
    };
    setTimeout(tick, 100);
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-ca-copilot]');
    if (!button) return;
    event.preventDefault();
    const type = button.dataset.caCopilot;
    if (type === 'route') navigate(button.dataset.routeValue);
    if (type === 'vsepr') launchVsepr(button.dataset.actionValue);
    if (type === 'practice') launchPractice(button.dataset.actionValue);
  });

  const observer = new MutationObserver(() => scan());
  function start() {
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
