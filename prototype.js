(() => {
  const stylesheets = ['prototype-polish.css', 'prototype-desktop-polish.css'];
  stylesheets.forEach(href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });
})();

(() => {
  const pages = [...document.querySelectorAll('.page')];
  const navButtons = [...document.querySelectorAll('[data-page]')];

  function showPage(id) {
    pages.forEach(p => p.classList.toggle('active', p.id === id));
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
  document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.go)));

  const conceptData = {
    electronegativity: {
      title: 'Electronegativity',
      copy: 'A measure of an atom’s pull on shared electrons. Start here to predict how matter behaves.',
      eq: 'χ(F) − χ(H) → δ− / δ+',
      note: 'The difference in electronegativity predicts the distribution of charge.'
    },
    bonding: {
      title: 'Bonding',
      copy: 'Electron sharing and transfer determine which atoms can connect and how strongly they interact.',
      eq: 'Δχ → bond character',
      note: 'Bond type is better understood as a continuum than a set of rigid boxes.'
    },
    polarity: {
      title: 'Polarity',
      copy: 'Bond dipoles become molecular behavior only after geometry decides whether those vectors reinforce or cancel.',
      eq: 'Σ μ(bond) → molecular dipole',
      note: 'The same polar bond can produce a polar or nonpolar molecule depending on shape.'
    },
    shape: {
      title: 'Molecular geometry',
      copy: 'Three-dimensional arrangement changes polarity, steric access, intermolecular forces, and reactivity.',
      eq: 'electron domains → shape',
      note: 'Geometry is the bridge from Lewis structures to spatial chemistry.'
    },
    imf: {
      title: 'Intermolecular forces',
      copy: 'Charge distribution determines how molecules attract one another and therefore how bulk matter behaves.',
      eq: 'polarity → attractions → properties',
      note: 'Boiling point, solubility, and phase behavior emerge from molecular interactions.'
    },
    organic: {
      title: 'Organic reactivity',
      copy: 'Polarity and geometry become electron flow. Nucleophiles and electrophiles are consequences of earlier ideas.',
      eq: 'structure → electron flow',
      note: 'Mechanisms reuse the same concepts introduced in General Chemistry.'
    },
    biochem: {
      title: 'Biochemistry',
      copy: 'The same energetic, structural, and acid–base rules scale into proteins, membranes, enzymes, and metabolism.',
      eq: 'chemistry + organization → life',
      note: 'Biochemistry is not separate chemistry; it is chemistry under biological constraints.'
    }
  };

  const relationshipTitle = document.querySelector('#relationshipTitle');
  const relationshipCopy = document.querySelector('#relationshipCopy');
  const relationshipEq = document.querySelector('#relationshipEq');
  const relationshipNote = document.querySelector('#relationshipNote');
  const nodeButtons = [...document.querySelectorAll('.map-node[data-concept]')];

  function selectConcept(key) {
    const data = conceptData[key];
    if (!data) return;
    nodeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.concept === key));
    relationshipTitle.textContent = data.title;
    relationshipCopy.textContent = data.copy;
    relationshipEq.textContent = data.eq;
    relationshipNote.textContent = data.note;
  }
  nodeButtons.forEach(btn => btn.addEventListener('click', () => selectConcept(btn.dataset.concept)));

  const lessonToc = [...document.querySelectorAll('.lesson-toc [data-scroll]')];
  lessonToc.forEach(btn => btn.addEventListener('click', () => {
    document.querySelector(`#${btn.dataset.scroll}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    lessonToc.forEach(x => x.classList.toggle('active', x === btn));
  }));

  document.querySelectorAll('.choices button').forEach(choice => choice.addEventListener('click', () => {
    const group = choice.closest('.choices');
    group.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    choice.classList.add('selected');
    const feedback = document.querySelector('#quickFeedback');
    if (feedback) feedback.textContent = choice.dataset.correct === 'true'
      ? 'Correct — the two equal C=O bond dipoles point in opposite directions and cancel in linear CO₂.'
      : 'Not quite. Think about both bond polarity and molecular geometry before deciding.';
  }));

  const temp = document.querySelector('#temp');
  const acidity = document.querySelector('#acidity');
  const tempVal = document.querySelector('#tempVal');
  const acidVal = document.querySelector('#acidVal');
  const absorbance = document.querySelector('#absorbance');
  const lambda = document.querySelector('#lambda');
  const lambdaMetric = document.querySelector('#lambdaMetric');
  const curve = document.querySelector('#spectrumCurve');
  const marker = document.querySelector('#spectrumMarker');
  const markerLabel = document.querySelector('#markerLabel');

  function updateLab() {
    const t = Number(temp?.value || 26);
    const pH = Number(acidity?.value || 6.4);
    if (tempVal) tempVal.textContent = `${t} °C`;
    if (acidVal) acidVal.textContent = `pH ${pH.toFixed(1)}`;
    const lm = Math.round(410 + (7.2 - pH) * 12);
    const abs = 0.19 + ((t - 10) / 40) * 0.07 + ((7.2 - pH) / 10) * 0.025;
    if (lambda) lambda.textContent = `${lm} nm`;
    if (lambdaMetric) lambdaMetric.textContent = `${lm} nm`;
    if (absorbance) absorbance.textContent = abs.toFixed(3);
    const x = 120 + ((lm - 380) / 520) * 700;
    if (marker) {
      marker.setAttribute('x1', x);
      marker.setAttribute('x2', x);
    }
    if (markerLabel) {
      markerLabel.setAttribute('x', x + 10);
      markerLabel.textContent = `λmax ${lm} nm`;
    }
    if (curve) {
      const pts = [];
      for (let px = 0; px <= 820; px += 8) {
        const wavelength = 380 + (px / 820) * 520;
        const peak = Math.exp(-Math.pow((wavelength - lm) / 22, 2));
        const minor = 0.2 * Math.exp(-Math.pow((wavelength - 445) / 18, 2));
        const y = 250 - (peak * (110 + (t - 10) * 1.2) + minor * 50 + Math.sin(px / 47) * 3);
        pts.push(`${px + 45},${y}`);
      }
      curve.setAttribute('points', pts.join(' '));
    }
  }
  temp?.addEventListener('input', updateLab);
  acidity?.addEventListener('input', updateLab);
  document.querySelectorAll('.solvents button').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.solvents button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }));
  document.querySelector('#runSample')?.addEventListener('click', () => {
    const light = document.querySelector('#liveDot');
    light?.animate([{ opacity: .25 }, { opacity: 1 }, { opacity: .25 }], { duration: 850, iterations: 2 });
    updateLab();
  });

  const lessonEq = document.querySelector('.equation-panel strong');
  if (lessonEq) lessonEq.textContent = 'μ(molecule) = Σ μ(bond)';

  const recordFormula = document.querySelector('.formula');
  if (recordFormula) recordFormula.textContent = 'A = εbc  →  ΔE = hν';

  selectConcept('electronegativity');
  updateLab();
})();
