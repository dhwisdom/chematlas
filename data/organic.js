window.CHEM_ORGANIC = {
  stereoChallenges: [
    {
      id: 'lactic-r',
      name: 'Lactic acid stereocenter',
      formula: 'CH₃–CH(OH)–CO₂H',
      groups: {
        top: { label: 'OH', priority: 1, bond: 'line' },
        right: { label: 'CO₂H', priority: 2, bond: 'line' },
        leftDown: { label: 'CH₃', priority: 3, bond: 'wedge' },
        rightDown: { label: 'H', priority: 4, bond: 'dash' }
      },
      answer: 'R',
      explanation: 'OH > CO₂H > CH₃ > H. Priority 4 points away, and 1 → 2 → 3 runs clockwise, so this center is R.'
    },
    {
      id: 'butanol-s',
      name: '2-Butanol stereocenter',
      formula: 'CH₃–CH(OH)–CH₂CH₃',
      groups: {
        top: { label: 'OH', priority: 1, bond: 'line' },
        right: { label: 'CH₂CH₃', priority: 2, bond: 'line' },
        leftDown: { label: 'CH₃', priority: 3, bond: 'dash' },
        rightDown: { label: 'H', priority: 4, bond: 'wedge' }
      },
      answer: 'S',
      explanation: 'OH > CH₂CH₃ > CH₃ > H. The 1 → 2 → 3 order appears clockwise, but priority 4 points toward you, so invert the result: S.'
    },
    {
      id: 'halomethane-s',
      name: 'Halomethane stereocenter',
      formula: 'CHBrClF',
      groups: {
        top: { label: 'Br', priority: 1, bond: 'line' },
        right: { label: 'F', priority: 3, bond: 'line' },
        leftDown: { label: 'Cl', priority: 2, bond: 'wedge' },
        rightDown: { label: 'H', priority: 4, bond: 'dash' }
      },
      answer: 'S',
      explanation: 'Br > Cl > F > H by atomic number. Priority 4 points away, and 1 → 2 → 3 runs counterclockwise, so this center is S.'
    }
  ],

  newman: {
    molecule: 'Butane viewed down C2–C3',
    frontGroups: [
      { label: 'CH₃', angle: -90 },
      { label: 'H', angle: 30 },
      { label: 'H', angle: 150 }
    ],
    backGroups: [
      { label: 'CH₃', angle: -90 },
      { label: 'H', angle: 30 },
      { label: 'H', angle: 150 }
    ],
    landmarks: [
      { angle: 0, energy: 5.0, name: 'syn-eclipsed', note: 'The two methyl groups eclipse. This is the highest-energy major conformation.' },
      { angle: 60, energy: 0.9, name: 'gauche', note: 'Staggered, but the methyl groups are 60° apart and still experience steric interaction.' },
      { angle: 120, energy: 3.5, name: 'eclipsed', note: 'An eclipsed arrangement with methyl–hydrogen eclipsing interactions.' },
      { angle: 180, energy: 0.0, name: 'anti', note: 'The methyl groups are 180° apart. This is the lowest-energy staggered conformation.' },
      { angle: 240, energy: 3.5, name: 'eclipsed', note: 'Another eclipsed arrangement with methyl–hydrogen eclipsing interactions.' },
      { angle: 300, energy: 0.9, name: 'gauche', note: 'The second equivalent gauche minimum.' },
      { angle: 360, energy: 5.0, name: 'syn-eclipsed', note: 'Equivalent to 0°: the methyl groups eclipse again.' }
    ]
  },

  chairSubstituents: {
    methyl: {
      label: 'Methyl', formula: 'CH₃', aValue: 1.7,
      note: 'Methylcyclohexane strongly favors the equatorial conformer because an axial methyl group experiences two 1,3-diaxial interactions.'
    },
    ethyl: {
      label: 'Ethyl', formula: 'CH₂CH₃', aValue: 1.8,
      note: 'Ethyl is also strongly equatorial-favoring; the axial conformer pays a larger steric penalty.'
    },
    tertButyl: {
      label: 'tert-Butyl', formula: 'C(CH₃)₃', aValue: 5.5,
      note: 'tert-Butyl is so bulky that it is overwhelmingly equatorial and can effectively lock a cyclohexane chair.'
    }
  },

  mechanism: {
    title: 'SN2: hydroxide + bromomethane',
    equation: 'HO⁻ + CH₃Br → CH₃OH + Br⁻',
    prompt: 'Build the two curved arrows for the concerted SN2 step. Remember: every arrow starts at electrons.',
    sources: [
      { id: 'o-lp', label: 'O lone pair', description: 'nonbonding electrons on hydroxide' },
      { id: 'c-br', label: 'C–Br bond', description: 'bonding electron pair between carbon and bromine' },
      { id: 'carbon', label: 'Carbon atom', description: 'an atom is not itself an electron source' }
    ],
    targets: [
      { id: 'carbon', label: 'Electrophilic carbon', description: 'the methyl carbon bearing Br' },
      { id: 'br', label: 'Bromine', description: 'the leaving group atom' },
      { id: 'oxygen', label: 'Oxygen', description: 'the nucleophile atom' }
    ],
    expected: [
      { source: 'o-lp', target: 'carbon', label: 'Form the C–O bond' },
      { source: 'c-br', target: 'br', label: 'Break the C–Br bond' }
    ],
    explanation: 'Both arrows occur in one concerted step: the oxygen lone pair attacks carbon as the C–Br bond electrons move onto bromine. There is no carbocation intermediate in SN2.'
  }
};

// General Chemistry is loaded as an extension so the existing static shell can
// remain GitHub-Pages friendly without introducing a framework or build step.
(() => {
  function installGenChemShell() {
    if (document.querySelector('link[href="genchem.css"]') === null) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'genchem.css';
      document.head.appendChild(link);
    }

    const nav = document.querySelector('.nav-list');
    if (nav && !document.querySelector('.genchem-nav')) {
      const button = document.createElement('button');
      button.className = 'genchem-nav';
      button.setAttribute('data-genchem-open', '');
      button.innerHTML = '<span>Σ</span> Gen Chem Foundations';
      const modelLab = nav.querySelector('[data-view="lab"]');
      nav.insertBefore(button, modelLab || null);
    }

    if (!document.getElementById('genchemView')) {
      const section = document.createElement('section');
      section.id = 'genchemView';
      section.className = 'view';
      section.innerHTML = '<div id="genchemApp" aria-live="polite"></div>';
      const organicView = document.getElementById('organicView');
      if (organicView) organicView.before(section);
      else document.querySelector('.main')?.appendChild(section);
    }

    const heroActions = document.querySelector('#homeView .hero-actions');
    if (heroActions && !heroActions.querySelector('[data-genchem-open]')) {
      const start = document.createElement('button');
      start.className = 'primary-button';
      start.setAttribute('data-genchem-open', '');
      start.textContent = 'Start General Chemistry';
      heroActions.prepend(start);
    }

    const progress = document.querySelector('#homeView .progress-card');
    const next = progress?.querySelector('.next-lesson');
    if (progress && next) {
      progress.querySelector('.eyebrow').textContent = 'FOUNDATION COURSE';
      progress.querySelector('h3').textContent = 'General Chemistry I + II';
      next.removeAttribute('data-jump');
      next.setAttribute('data-genchem-open', '');
      next.setAttribute('data-genchem-module', 'measurement');
      const icon = next.querySelector('.lesson-icon');
      const title = next.querySelector('strong');
      const detail = next.querySelector('small');
      if (icon) icon.textContent = '01';
      if (title) title.textContent = 'Measurement, Units & Chemical Reasoning';
      if (detail) detail.textContent = 'Reading + worked example + mastery check';
    }

    const toolGrid = document.querySelector('#homeView .tool-grid');
    const firstTool = toolGrid?.querySelector('.tool-card');
    if (firstTool && !toolGrid.querySelector('[data-genchem-open]')) {
      firstTool.removeAttribute('data-jump');
      firstTool.setAttribute('data-genchem-open', '');
      firstTool.innerHTML = '<span>Σ</span><strong>Gen Chem Course</strong><small>19 learning modules + practice</small>';
    }

    const dataScript = document.createElement('script');
    dataScript.src = 'data/genchem.js';
    dataScript.onload = () => {
      const appScript = document.createElement('script');
      appScript.src = 'genchem.js';
      document.body.appendChild(appScript);
    };
    document.body.appendChild(dataScript);
  }

  window.addEventListener('load', installGenChemShell, { once: true });
})();
