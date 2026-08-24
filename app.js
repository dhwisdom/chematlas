(() => {
  const data = window.CHEM_CURRICULUM;
  const views = { home: 'homeView', curriculum: 'curriculumView', courses: 'coursesView', lab: 'labView', organic: 'organicView' };
  const titles = { home: 'Your chemistry roadmap', curriculum: 'Curriculum map', courses: 'Course library', lab: 'Interactive model lab', organic: 'Organic Chemistry Studio' };
  let currentStyle = 'stick';

  // Lightweight self-contained 3D renderer. It uses the XYZ coordinates in the
  // curriculum data, rotates them in 3D, then perspective-projects onto canvas.
  const canvas = document.getElementById('moleculeCanvas');
  const ctx = canvas.getContext('2d');
  let yaw = -0.55, pitch = 0.35, zoom = 1;
  let dragging = false, lastX = 0, lastY = 0;

  const atomColors = {
    H:'#f4f8fb', C:'#4c5c68', N:'#5b78ff', O:'#ff5e68', B:'#efad8f', F:'#72d58d',
    P:'#ff9f57', S:'#f2d45c', Cl:'#62d47e'
  };
  const covalent = { H:.31, C:.76, N:.71, O:.66, B:.85, F:.57, P:1.07, S:1.05, Cl:1.02 };
  const sphereRadii = { H:.28, C:.42, N:.42, O:.41, B:.43, F:.39, P:.48, S:.48, Cl:.48 };

  function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(views[name]).classList.add('active-view');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
    document.getElementById('pageTitle').textContent = titles[name];
    document.querySelector('.sidebar')?.classList.remove('open');
    if (name === 'lab') setTimeout(() => { resizeCanvas(); renderMolecule(); }, 30);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderDegreeMap() {
    const root = document.getElementById('degreeMap');
    root.innerHTML = data.years.map(y => `
      <article class="year-column">
        <span>YEAR ${y.year}</span><h3>${y.label}</h3>
        ${y.semesters.map(s => `<div class="semester"><strong>${s.term}</strong>${s.courses.map(c => `
          <div class="degree-course ${c.track}"><small>${c.code}</small><strong>${c.name}</strong></div>`).join('')}</div>`).join('')}
      </article>`).join('');
  }

  function renderCourseCards() {
    const root = document.getElementById('courseCards');
    root.innerHTML = data.courses.map(c => `
      <article class="course-card ${c.id === 'genchem1' ? 'featured' : ''}">
        <span class="course-code">${c.code}</span><h3>${c.name}</h3><p>${c.description}</p>
        <div class="module-list">${c.modules.slice(0,7).map(m => `<span>${m.title}</span>`).join('')}</div>
        <div class="course-actions"><small>${c.modules.length} modules • ${c.completion}% complete</small>${c.id === 'genchem1' ? '<button class="text-button open-lab">Open VSEPR lab →</button>' : c.id === 'organic1' ? '<button class="text-button open-organic">Open Organic Studio →</button>' : '<span class="pill">Scaffolded</span>'}</div>
      </article>`).join('');
    root.querySelector('.open-lab')?.addEventListener('click', () => showView('lab'));
    root.querySelector('.open-organic')?.addEventListener('click', () => showView('organic'));
  }

  function parseXYZ(xyz) {
    const lines = xyz.trim().split(/\r?\n/).slice(2);
    return lines.map((line, index) => {
      const [element, xs, ys, zs] = line.trim().split(/\s+/);
      return { index, element, x:+xs, y:+ys, z:+zs };
    });
  }

  function inferBonds(atoms) {
    const bonds = [];
    for (let i=0; i<atoms.length; i++) for (let j=i+1; j<atoms.length; j++) {
      const a=atoms[i], b=atoms[j];
      const dx=a.x-b.x, dy=a.y-b.y, dz=a.z-b.z;
      const d=Math.hypot(dx,dy,dz);
      const cutoff=((covalent[a.element]||.75)+(covalent[b.element]||.75))*1.28;
      if (d <= cutoff && d > .2) bonds.push([i,j]);
    }
    return bonds;
  }

  function rotatePoint(p) {
    const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    const x1=p.x*cy - p.z*sy;
    const z1=p.x*sy + p.z*cy;
    const y2=p.y*cp - z1*sp;
    const z2=p.y*sp + z1*cp;
    return { ...p, x:x1, y:y2, z:z2 };
  }

  function project(p, w, h) {
    const camera=7.5;
    const perspective=camera/(camera-p.z);
    const base=Math.min(w,h)*0.17*zoom;
    return { ...p, sx:w/2+p.x*base*perspective, sy:h/2-p.y*base*perspective, perspective };
  }

  function drawAtom(a) {
    const baseRadius = currentStyle === 'sphere' ? (sphereRadii[a.element]||.42)*42 : 11;
    const r=Math.max(6,baseRadius*a.perspective*zoom);
    const color=atomColors[a.element]||'#b8c8d3';
    const g=ctx.createRadialGradient(a.sx-r*.35,a.sy-r*.4,r*.08,a.sx,a.sy,r);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.17,color); g.addColorStop(1,'#14212b');
    ctx.beginPath(); ctx.arc(a.sx,a.sy,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.lineWidth=1; ctx.strokeStyle='rgba(255,255,255,.16)'; ctx.stroke();
    if (currentStyle === 'stick' && r > 9) {
      ctx.fillStyle = a.element === 'C' ? '#f1f5f7' : '#07111a';
      ctx.font = `700 ${Math.max(8,r*.72)}px system-ui`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(a.element,a.sx,a.sy+.5);
    }
  }

  function renderCanvas() {
    if (!canvas.width || !canvas.height) return;
    const key=document.getElementById('moleculeSelect').value;
    const mol=data.molecules[key];
    const atoms=parseXYZ(mol.xyz);
    const bonds=inferBonds(atoms);
    const w=canvas.clientWidth, h=canvas.clientHeight;
    ctx.clearRect(0,0,w,h);

    const halo=ctx.createRadialGradient(w/2,h/2,20,w/2,h/2,Math.min(w,h)*.46);
    halo.addColorStop(0,'rgba(98,230,207,.035)'); halo.addColorStop(1,'rgba(98,230,207,0)');
    ctx.fillStyle=halo; ctx.fillRect(0,0,w,h);

    const rotated=atoms.map(rotatePoint).map(a=>project(a,w,h));
    bonds.slice().sort((A,B)=>((rotated[A[0]].z+rotated[A[1]].z)-(rotated[B[0]].z+rotated[B[1]].z))).forEach(([i,j])=>{
      const a=rotated[i], b=rotated[j];
      const z=(a.z+b.z)/2;
      const alpha=Math.max(.32,Math.min(.88,.58+z*.06));
      ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy);
      ctx.lineCap='round'; ctx.lineWidth=(currentStyle==='sphere'?7:9)*((a.perspective+b.perspective)/2)*zoom;
      ctx.strokeStyle=`rgba(183,202,214,${alpha})`; ctx.stroke();
      if(currentStyle==='stick'){
        ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy); ctx.lineWidth=Math.max(1,ctx.lineWidth*.24); ctx.strokeStyle='rgba(255,255,255,.36)'; ctx.stroke();
      }
    });
    rotated.slice().sort((a,b)=>a.z-b.z).forEach(drawAtom);
  }

  function resizeCanvas() {
    const rect=canvas.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(rect.width*dpr));
    canvas.height=Math.max(1,Math.round(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    renderCanvas();
  }

  function renderMolecule() {
    const key = document.getElementById('moleculeSelect').value;
    const mol = data.molecules[key];
    document.getElementById('molName').textContent = mol.name;
    document.getElementById('molFormula').textContent = mol.formula;
    document.getElementById('domains').textContent = mol.domains;
    document.getElementById('geometry').textContent = mol.geometry;
    document.getElementById('angle').textContent = mol.angle;
    document.getElementById('hybridization').textContent = mol.hybridization;
    document.getElementById('whyText').textContent = mol.why;
    const badge = document.getElementById('polarityBadge');
    badge.textContent = mol.polarity;
    badge.classList.toggle('polar', mol.polarity === 'Polar');
    renderCanvas();
  }

  const quiz = [
    { q: 'Which molecule is expected to be bent?', options: ['CO₂', 'BF₃', 'H₂O', 'CH₄'], answer: 2 },
    { q: 'A central atom with four electron domains and one lone pair has which molecular geometry?', options: ['Tetrahedral', 'Trigonal pyramidal', 'Trigonal planar', 'Linear'], answer: 1 },
    { q: 'Why is CO₂ nonpolar even though each C=O bond is polar?', options: ['Carbon has no electronegativity', 'The bond dipoles cancel by symmetry', 'Double bonds are nonpolar', 'Oxygen has lone pairs'], answer: 1 }
  ];
  const quizState = new Array(quiz.length).fill(null);

  function renderQuiz() {
    const root = document.getElementById('quizArea');
    root.innerHTML = quiz.map((q, i) => `<div class="question" data-q="${i}"><p><strong>${i + 1}.</strong> ${q.q}</p><div class="answers">${q.options.map((o, j) => `<button class="answer" data-a="${j}">${o}</button>`).join('')}</div></div>`).join('') + '<button id="submitQuiz" class="primary-button quiz-submit">Check answers</button>';
    root.querySelectorAll('.question').forEach(block => {
      const qi = Number(block.dataset.q);
      block.querySelectorAll('.answer').forEach(btn => btn.addEventListener('click', () => {
        quizState[qi] = Number(btn.dataset.a);
        block.querySelectorAll('.answer').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      }));
    });
    document.getElementById('submitQuiz').addEventListener('click', () => {
      const answered = quizState.filter(v => v !== null).length;
      const result = document.getElementById('quizResult');
      if (answered < quiz.length) { result.className='quiz-result bad'; result.textContent='Answer all three questions first.'; return; }
      const score = quiz.reduce((s, q, i) => s + (quizState[i] === q.answer ? 1 : 0), 0);
      result.className = 'quiz-result ' + (score === quiz.length ? 'good' : 'bad');
      result.textContent = score === quiz.length ? '3/3 — Mastered. You are ready to connect geometry to polarity and reactivity.' : `${score}/3 — Review the 3D models, then try again.`;
      try { localStorage.setItem('chematlas-vsepr-score', String(score)); } catch (_) {}
    });
  }

  canvas.addEventListener('pointerdown', e => { dragging=true; lastX=e.clientX; lastY=e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if(!dragging)return; const dx=e.clientX-lastX,dy=e.clientY-lastY; lastX=e.clientX;lastY=e.clientY;yaw+=dx*.012;pitch=Math.max(-1.45,Math.min(1.45,pitch+dy*.012));renderCanvas(); });
  canvas.addEventListener('pointerup', e => { dragging=false; try{canvas.releasePointerCapture(e.pointerId)}catch(_){} });
  canvas.addEventListener('pointercancel', ()=>dragging=false);
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom=Math.max(.55,Math.min(2.2,zoom*(e.deltaY<0?1.08:.92)));renderCanvas(); }, {passive:false});
  window.addEventListener('resize', resizeCanvas);

  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  document.querySelectorAll('[data-view-target]').forEach(b => b.addEventListener('click', () => showView(b.dataset.viewTarget)));
  document.querySelectorAll('[data-jump="lesson"]').forEach(b => b.addEventListener('click', () => showView('lab')));
  document.getElementById('moleculeSelect').addEventListener('change', () => { yaw=-.55; pitch=.35; zoom=1; renderMolecule(); });
  document.querySelectorAll('.seg').forEach(b => b.addEventListener('click', () => {
    currentStyle = b.dataset.style;
    document.querySelectorAll('.seg').forEach(x => x.classList.toggle('active', x === b));
    renderMolecule();
  }));
  document.getElementById('mobileMenu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));

  renderDegreeMap();
  renderCourseCards();
  renderQuiz();
  resizeCanvas();
})();
