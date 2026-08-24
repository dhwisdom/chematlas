(() => {
  const organic = window.CHEM_ORGANIC;
  if (!organic) return;

  const byId = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // ---------- Stereochemistry trainer ----------
  let stereoIndex = 0;
  let showPriorities = true;

  const stereoPositions = {
    top: { x: 200, y: 58, tx: 200, ty: 36 },
    right: { x: 343, y: 177, tx: 366, ty: 181 },
    leftDown: { x: 70, y: 314, tx: 48, ty: 335 },
    rightDown: { x: 327, y: 314, tx: 351, ty: 337 }
  };

  function bondMarkup(group, key) {
    const p = stereoPositions[key];
    const cx = 200, cy = 190;
    if (group.bond === 'wedge') {
      const dx = p.x - cx, dy = p.y - cy;
      const len = Math.max(1, Math.hypot(dx, dy));
      const px = -dy / len * 10, py = dx / len * 10;
      return `<polygon class="stereo-wedge" points="${cx},${cy} ${p.x + px},${p.y + py} ${p.x - px},${p.y - py}" />`;
    }
    if (group.bond === 'dash') {
      const parts = [];
      for (let i = 1; i <= 7; i++) {
        const t = i / 8;
        const x = cx + (p.x - cx) * t;
        const y = cy + (p.y - cy) * t;
        const dx = p.x - cx, dy = p.y - cy;
        const len = Math.max(1, Math.hypot(dx, dy));
        const half = (2 + i * .8);
        const px = -dy / len * half, py = dx / len * half;
        parts.push(`<line class="stereo-dash" x1="${x-px}" y1="${y-py}" x2="${x+px}" y2="${y+py}" />`);
      }
      return parts.join('');
    }
    return `<line class="stereo-line" x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" />`;
  }

  function renderStereo() {
    const challenge = organic.stereoChallenges[stereoIndex];
    byId('stereoName').textContent = challenge.name;
    byId('stereoFormula').textContent = challenge.formula;
    byId('stereoFeedback').className = 'organic-feedback';
    byId('stereoFeedback').textContent = 'Choose R or S, then check your reasoning.';
    byId('stereoCounter').textContent = `${stereoIndex + 1} / ${organic.stereoChallenges.length}`;
    document.querySelectorAll('[data-stereo-answer]').forEach(btn => btn.classList.remove('selected','correct','wrong'));

    const entries = Object.entries(challenge.groups);
    byId('stereoSvg').innerHTML = `
      <defs>
        <filter id="centerGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="200" cy="190" r="22" class="stereo-center" filter="url(#centerGlow)" />
      <text x="200" y="196" text-anchor="middle" class="stereo-center-label">C*</text>
      ${entries.map(([key, group]) => bondMarkup(group, key)).join('')}
      ${entries.map(([key, group]) => {
        const p = stereoPositions[key];
        return `<g>
          <text x="${p.tx}" y="${p.ty}" text-anchor="middle" class="stereo-group-label">${group.label}</text>
          ${showPriorities ? `<circle cx="${p.tx + (key==='right' || key==='rightDown' ? -31 : 31)}" cy="${p.ty-4}" r="10" class="priority-dot"/><text x="${p.tx + (key==='right' || key==='rightDown' ? -31 : 31)}" y="${p.ty}" text-anchor="middle" class="priority-label">${group.priority}</text>` : ''}
        </g>`;
      }).join('')}
      <text x="16" y="378" class="stereo-legend">solid wedge = toward you • hashed wedge = away</text>`;
  }

  byId('toggleCip')?.addEventListener('click', () => {
    showPriorities = !showPriorities;
    byId('toggleCip').textContent = showPriorities ? 'Hide CIP priorities' : 'Show CIP priorities';
    renderStereo();
  });

  document.querySelectorAll('[data-stereo-answer]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-stereo-answer]').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }));

  byId('checkStereo')?.addEventListener('click', () => {
    const chosen = document.querySelector('[data-stereo-answer].selected');
    const feedback = byId('stereoFeedback');
    if (!chosen) {
      feedback.className = 'organic-feedback bad';
      feedback.textContent = 'Choose R or S first.';
      return;
    }
    const challenge = organic.stereoChallenges[stereoIndex];
    const correct = chosen.dataset.stereoAnswer === challenge.answer;
    document.querySelectorAll('[data-stereo-answer]').forEach(b => {
      b.classList.toggle('correct', b.dataset.stereoAnswer === challenge.answer);
      b.classList.toggle('wrong', b === chosen && !correct);
    });
    feedback.className = `organic-feedback ${correct ? 'good' : 'bad'}`;
    feedback.textContent = `${correct ? 'Correct. ' : 'Not quite. '}${challenge.explanation}`;
    try { localStorage.setItem('chematlas-organic-stereo', String(Number(correct))); } catch (_) {}
  });

  byId('nextStereo')?.addEventListener('click', () => {
    stereoIndex = (stereoIndex + 1) % organic.stereoChallenges.length;
    renderStereo();
  });

  // ---------- Newman projection ----------
  let dihedral = 180;
  const deg = a => a * Math.PI / 180;
  const polar = (cx, cy, r, angle) => ({ x: cx + Math.cos(deg(angle)) * r, y: cy + Math.sin(deg(angle)) * r });

  function interpolatedEnergy(angle) {
    const a = clamp(Number(angle), 0, 360);
    const marks = organic.newman.landmarks;
    for (let i = 0; i < marks.length - 1; i++) {
      if (a >= marks[i].angle && a <= marks[i+1].angle) {
        const span = marks[i+1].angle - marks[i].angle;
        const t = span ? (a - marks[i].angle) / span : 0;
        return marks[i].energy + (marks[i+1].energy - marks[i].energy) * t;
      }
    }
    return marks[0].energy;
  }

  function nearestLandmark(angle) {
    const a = clamp(Number(angle), 0, 360);
    return organic.newman.landmarks.reduce((best, mark) => Math.abs(mark.angle-a) < Math.abs(best.angle-a) ? mark : best, organic.newman.landmarks[0]);
  }

  function groupSvg(group, angle, layer) {
    const cx = 210, cy = 190;
    const startR = layer === 'back' ? 34 : 7;
    const endR = 102;
    const labelR = 126;
    const s = polar(cx, cy, startR, angle);
    const e = polar(cx, cy, endR, angle);
    const l = polar(cx, cy, labelR, angle);
    return `<line x1="${s.x}" y1="${s.y}" x2="${e.x}" y2="${e.y}" class="newman-bond ${layer}" />
      <text x="${l.x}" y="${l.y + 5}" text-anchor="middle" class="newman-label ${group.label==='CH₃' ? 'major' : ''}">${group.label}</text>`;
  }

  function renderNewman() {
    const slider = byId('dihedralSlider');
    if (slider) slider.value = dihedral;
    byId('dihedralValue').textContent = `${Math.round(dihedral)}°`;
    const nearest = nearestLandmark(dihedral);
    const energy = interpolatedEnergy(dihedral);
    byId('newmanConformation').textContent = nearest.name;
    byId('newmanEnergy').textContent = `${energy.toFixed(1)} kcal/mol`;
    byId('newmanNote').textContent = nearest.note;

    const front = organic.newman.frontGroups.map(g => groupSvg(g, g.angle, 'front')).join('');
    const back = organic.newman.backGroups.map(g => groupSvg(g, g.angle + dihedral, 'back')).join('');
    byId('newmanSvg').innerHTML = `
      ${back}
      <circle cx="210" cy="190" r="34" class="newman-back-carbon" />
      ${front}
      <circle cx="210" cy="190" r="7" class="newman-front-carbon" />
      <text x="20" y="28" class="newman-view-label">view down C2 → C3</text>`;
  }

  byId('dihedralSlider')?.addEventListener('input', e => {
    dihedral = Number(e.target.value);
    renderNewman();
  });
  document.querySelectorAll('[data-dihedral]').forEach(btn => btn.addEventListener('click', () => {
    dihedral = Number(btn.dataset.dihedral);
    renderNewman();
  }));

  // ---------- Cyclohexane chair ----------
  let chairFlipped = false;
  let chairSubstituent = 'methyl';
  let showDiaxial = true;

  function renderChair() {
    const sub = organic.chairSubstituents[chairSubstituent];
    const axial = !chairFlipped;
    byId('chairState').textContent = axial ? `${sub.label} axial up` : `${sub.label} equatorial up`;
    byId('chairPenalty').textContent = axial ? `+${sub.aValue.toFixed(1)} kcal/mol` : '0.0 kcal/mol reference';
    byId('chairPreference').textContent = axial ? `Less stable: axial ${sub.formula} experiences 1,3-diaxial strain.` : `More stable: equatorial ${sub.formula} avoids the major 1,3-diaxial contacts.`;
    byId('chairNote').textContent = sub.note;

    const chairA = chairFlipped
      ? [[55,235],[130,175],[220,198],[300,132],[385,160],[455,105]]
      : [[55,150],[130,205],[220,182],[300,248],[385,220],[455,275]];
    const pts = chairA.map(p => p.join(',')).join(' ');
    const c1 = chairA[0];
    const bondEnd = axial ? [c1[0], c1[1]-95] : [c1[0]-78, c1[1]-50];
    const diaxial = showDiaxial && axial ? `
      <line x1="220" y1="${chairA[2][1]}" x2="220" y2="${chairA[2][1]-75}" class="diaxial-line"/>
      <line x1="385" y1="${chairA[4][1]}" x2="385" y2="${chairA[4][1]-75}" class="diaxial-line"/>
      <text x="220" y="${chairA[2][1]-84}" text-anchor="middle" class="diaxial-label">H</text>
      <text x="385" y="${chairA[4][1]-84}" text-anchor="middle" class="diaxial-label">H</text>` : '';

    byId('chairSvg').innerHTML = `
      <polyline points="${pts}" class="chair-ring" />
      ${chairA.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="6" class="chair-carbon"/><text x="${p[0]}" y="${p[1]+25}" text-anchor="middle" class="chair-number">C${i+1}</text>`).join('')}
      ${diaxial}
      <line x1="${c1[0]}" y1="${c1[1]}" x2="${bondEnd[0]}" y2="${bondEnd[1]}" class="chair-sub-bond" />
      <text x="${bondEnd[0]}" y="${bondEnd[1]-10}" text-anchor="middle" class="chair-sub-label">${sub.formula}</text>
      <text x="25" y="35" class="chair-orientation">${axial ? 'AXIAL' : 'EQUATORIAL'} • UP</text>`;
  }

  byId('chairFlip')?.addEventListener('click', () => { chairFlipped = !chairFlipped; renderChair(); });
  byId('chairSubstituent')?.addEventListener('change', e => { chairSubstituent = e.target.value; renderChair(); });
  byId('toggleDiaxial')?.addEventListener('click', () => {
    showDiaxial = !showDiaxial;
    byId('toggleDiaxial').textContent = showDiaxial ? 'Hide 1,3-diaxial contacts' : 'Show 1,3-diaxial contacts';
    renderChair();
  });

  // ---------- Curved-arrow mechanism practice ----------
  let selectedSource = null;
  let selectedTarget = null;
  let builtArrows = [];

  function renderMechanismControls() {
    const mech = organic.mechanism;
    byId('mechanismTitle').textContent = mech.title;
    byId('mechanismEquation').textContent = mech.equation;
    byId('mechanismPrompt').textContent = mech.prompt;
    byId('sourceChoices').innerHTML = mech.sources.map(s => `<button class="mech-choice" data-mech-source="${s.id}"><strong>${s.label}</strong><small>${s.description}</small></button>`).join('');
    byId('targetChoices').innerHTML = mech.targets.map(t => `<button class="mech-choice" data-mech-target="${t.id}"><strong>${t.label}</strong><small>${t.description}</small></button>`).join('');
    document.querySelectorAll('[data-mech-source]').forEach(btn => btn.addEventListener('click', () => {
      selectedSource = btn.dataset.mechSource;
      document.querySelectorAll('[data-mech-source]').forEach(b => b.classList.toggle('selected', b === btn));
      updateMechanismSelection();
    }));
    document.querySelectorAll('[data-mech-target]').forEach(btn => btn.addEventListener('click', () => {
      selectedTarget = btn.dataset.mechTarget;
      document.querySelectorAll('[data-mech-target]').forEach(b => b.classList.toggle('selected', b === btn));
      updateMechanismSelection();
    }));
    renderMechanismSvg();
  }

  function updateMechanismSelection() {
    const source = organic.mechanism.sources.find(s => s.id === selectedSource);
    const target = organic.mechanism.targets.find(t => t.id === selectedTarget);
    byId('mechanismSelection').textContent = source && target ? `${source.label} → ${target.label}` : 'Select an electron source and a destination.';
  }

  function arrowPath(source, target) {
    const map = {
      'o-lp': {x:102,y:153}, 'c-br': {x:330,y:190}, 'carbon': {x:285,y:190},
      'br': {x:390,y:190}, 'oxygen': {x:105,y:190}
    };
    const a = map[source], b = map[target];
    if (!a || !b) return '';
    const mx=(a.x+b.x)/2, my=Math.min(a.y,b.y)-65;
    return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  }

  function renderMechanismSvg() {
    const arrowMarkup = builtArrows.map(pair => `<path d="${arrowPath(pair.source,pair.target)}" class="curved-arrow" marker-end="url(#arrowHead)"/>`).join('');
    byId('mechanismSvg').innerHTML = `
      <defs><marker id="arrowHead" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L8,3 z" class="arrow-head"/></marker></defs>
      <text x="48" y="198" class="chem-big">H–O</text><text x="110" y="158" class="lone-pair">••</text><text x="133" y="165" class="charge">−</text>
      <text x="190" y="198" class="plus-sign">+</text>
      <text x="260" y="198" class="chem-big">H₃C—Br</text>
      <circle cx="285" cy="190" r="22" class="mech-hotspot carbon"/><circle cx="390" cy="190" r="22" class="mech-hotspot br"/>
      ${arrowMarkup}
      <text x="220" y="292" class="mechanism-caption">SN2 is concerted: bond formation and bond breaking happen in the same elementary step.</text>`;
  }

  byId('addMechanismArrow')?.addEventListener('click', () => {
    const feedback = byId('mechanismFeedback');
    if (!selectedSource || !selectedTarget) {
      feedback.className = 'organic-feedback bad';
      feedback.textContent = 'Choose both an electron source and a destination.';
      return;
    }
    const pair = { source: selectedSource, target: selectedTarget };
    const expected = organic.mechanism.expected.some(e => e.source === pair.source && e.target === pair.target);
    const duplicate = builtArrows.some(a => a.source === pair.source && a.target === pair.target);
    if (!expected) {
      feedback.className = 'organic-feedback bad';
      feedback.textContent = 'That arrow does not follow electron flow for this SN2 step. Curved arrows must begin at an electron pair or bond.';
      return;
    }
    if (!duplicate) builtArrows.push(pair);
    renderMechanismSvg();
    const complete = organic.mechanism.expected.every(e => builtArrows.some(a => a.source === e.source && a.target === e.target));
    feedback.className = `organic-feedback ${complete ? 'good' : ''}`;
    feedback.textContent = complete ? `Mechanism complete. ${organic.mechanism.explanation}` : 'Good first arrow. Add the second electron-flow arrow for the concerted step.';
    if (complete) {
      try { localStorage.setItem('chematlas-organic-sn2', '1'); } catch (_) {}
    }
  });

  byId('mechanismHint')?.addEventListener('click', () => {
    const feedback = byId('mechanismFeedback');
    feedback.className = 'organic-feedback';
    feedback.textContent = builtArrows.length === 0 ? 'Hint: start with the nucleophile. Which electrons on hydroxide can form a new bond?' : 'Hint: when the new C–O bond forms, carbon cannot keep five bonds. Where should the C–Br bond electrons go?';
  });

  byId('resetMechanism')?.addEventListener('click', () => {
    selectedSource = null; selectedTarget = null; builtArrows = [];
    document.querySelectorAll('.mech-choice').forEach(b => b.classList.remove('selected'));
    byId('mechanismFeedback').className = 'organic-feedback';
    byId('mechanismFeedback').textContent = 'Build the mechanism one electron-flow arrow at a time.';
    updateMechanismSelection();
    renderMechanismSvg();
  });

  // ---------- Organic studio tabs ----------
  document.querySelectorAll('[data-organic-tool]').forEach(button => button.addEventListener('click', () => {
    const target = button.dataset.organicTool;
    document.querySelectorAll('.organic-tab').forEach(b => b.classList.toggle('active', b.dataset.organicTool === target));
    document.querySelectorAll('.organic-tool-panel').forEach(panel => panel.classList.toggle('active', panel.id === `${target}Panel`));
  }));

  renderStereo();
  renderNewman();
  renderChair();
  renderMechanismControls();
  updateMechanismSelection();
})();
