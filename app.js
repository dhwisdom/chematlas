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
        <p class="course-availability">${c.id.startsWith('genchem')?'Lessons available':c.id==='organic1'?'4 interactive tools available':'Course outline only · lessons not yet available'}</p>
        <details class="course-modules"><summary>${c.id.startsWith('genchem')?'View course modules':'View planned topics'}</summary><div class="module-list">${c.modules.map(m => `<span>${m.title}</span>`).join('')}</div></details>
        <div class="course-actions"><small>${c.id.startsWith('genchem')?c.modules.length+' modules':'Planned course topics'}</small>${c.id === 'genchem1' ? '<button class="text-button open-lab">Open VSEPR lab →</button>' : c.id === 'organic1' ? '<button class="text-button open-organic">Open Organic Studio →</button>' : c.id.startsWith('genchem')?'':'<span class="pill">Not yet available</span>'}</div>
      </article>`).join('');
    const openCourseTool=name=>{
      // Use the existing navigation adapter so the URL and active view agree.
      document.querySelector(`.nav-item[data-view="${name}"]`)?.click();
      const heading=document.querySelector('.view.active-view h2');
      heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
    };
    root.querySelector('.open-lab')?.addEventListener('click', () => openCourseTool('lab'));
    root.querySelector('.open-organic')?.addEventListener('click', () => openCourseTool('organic'));
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

  function project(p, w, h, scale) {
    const camera=7.5;
    const perspective=camera/(camera-p.z);
    const base=scale*zoom;
    return { ...p, sx:w/2+p.x*base*perspective, sy:h/2-p.y*base*perspective, perspective };
  }

  function drawAtom(a,outline) {
    const baseRadius = currentStyle === 'sphere' ? (sphereRadii[a.element]||.42)*42 : 11;
    const r=Math.max(6,baseRadius*a.perspective*zoom);
    const color=atomColors[a.element]||'#b8c8d3';
    const g=ctx.createRadialGradient(a.sx-r*.35,a.sy-r*.4,r*.08,a.sx,a.sy,r);
    g.addColorStop(0,'#ffffff'); g.addColorStop(.17,color); g.addColorStop(1,'#14212b');
    ctx.beginPath(); ctx.arc(a.sx,a.sy,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.lineWidth=1; ctx.strokeStyle=outline; ctx.stroke();
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
    const palette=getComputedStyle(canvas);
    const bondRgb=palette.getPropertyValue('--model-bond-rgb').trim()||'183,202,214';
    const atomOutline=palette.getPropertyValue('--model-atom-outline').trim()||'rgba(255,255,255,.16)';
    ctx.clearRect(0,0,w,h);

    const halo=ctx.createRadialGradient(w/2,h/2,20,w/2,h/2,Math.min(w,h)*.46);
    halo.addColorStop(0,'rgba(98,230,207,.035)'); halo.addColorStop(1,'rgba(98,230,207,0)');
    ctx.fillStyle=halo; ctx.fillRect(0,0,w,h);

    const points=atoms.map(rotatePoint);
    // Fit the projected molecule to the viewer, reserving room for atom radii.
    // Coordinates, bond inference and scientific geometry remain unchanged.
    const extent=axis=>Math.max(.1,...points.map(p=>Math.abs(p[axis]*7.5/(7.5-p.z))));
    const scale=Math.min(w*.34/extent('x'),h*.34/extent('y'));
    const rotated=points.map(a=>project(a,w,h,scale));
    bonds.slice().sort((A,B)=>((rotated[A[0]].z+rotated[A[1]].z)-(rotated[B[0]].z+rotated[B[1]].z))).forEach(([i,j])=>{
      const a=rotated[i], b=rotated[j];
      const z=(a.z+b.z)/2;
      const alpha=Math.max(.32,Math.min(.88,.58+z*.06));
      ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy);
      ctx.lineCap='round'; ctx.lineWidth=(currentStyle==='sphere'?7:9)*((a.perspective+b.perspective)/2)*zoom;
      ctx.strokeStyle=`rgba(${bondRgb},${alpha})`; ctx.stroke();
      if(currentStyle==='stick'){
        ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy); ctx.lineWidth=Math.max(1,ctx.lineWidth*.24); ctx.strokeStyle='rgba(255,255,255,.36)'; ctx.stroke();
      }
    });
    rotated.slice().sort((a,b)=>a.z-b.z).forEach(a=>drawAtom(a,atomOutline));
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
      result.textContent = score === quiz.length ? '3/3 — Correct. You are ready to connect geometry to polarity and reactivity.' : `${score}/3 — Review the 3D models, then try again.`;
      try { localStorage.setItem('chematlas-vsepr-score', String(score)); } catch (_) {}
      window.dispatchEvent(new CustomEvent('chematlas:practice-completed',{detail:{kind:'vsepr',score}}));
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
    document.querySelectorAll('.seg').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    renderMolecule();
  }));
  document.querySelectorAll('.seg').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
  document.querySelectorAll('[data-model-control]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.modelControl;
    if(action==='left')yaw-=.25;
    if(action==='right')yaw+=.25;
    if(action==='up')pitch=Math.min(1.45,pitch+.2);
    if(action==='down')pitch=Math.max(-1.45,pitch-.2);
    if(action==='in')zoom=Math.min(2.2,zoom*1.15);
    if(action==='out')zoom=Math.max(.55,zoom/1.15);
    if(action==='reset'){yaw=-.55;pitch=.35;zoom=1;}
    document.getElementById('modelViewStatus').textContent=action==='reset'?'Default view':`${button.textContent.trim()} · ${Math.round(zoom*100)}%`;
    renderCanvas();
  }));
  const menu = document.getElementById('mobileMenu');
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main');
  const closeMenu = document.getElementById('mobileMenuClose');
  const backdrop = document.getElementById('mobileMenuBackdrop');
  const mobile = matchMedia('(max-width:820px)');
  const navigationOpen = () => mobile.matches && sidebar.classList.contains('open');
  const navigationControls = () => [...sidebar.querySelectorAll('button,a[href],select,input,textarea,summary,[tabindex]')]
    .filter(el => el.tabIndex >= 0 && !el.disabled && !el.closest('[inert]') && el.checkVisibility());
  function syncNavigation() {
    const open = navigationOpen();
    menu.setAttribute('aria-expanded', String(open));
    backdrop.hidden = !open;
    main.inert = open;
    document.body.classList.toggle('ca-nav-open', open);
    if (open) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
    }
    // Inert also excludes controls injected into the sidebar after startup.
    const sidebarInert = mobile.matches && !open;
    // Move focus before native inert can reset activeElement to the document body.
    if (sidebarInert && sidebar.contains(document.activeElement)) menu.focus();
    sidebar.inert = sidebarInert;
  }
  function dismissNavigation(restoreFocus = true) {
    sidebar.classList.remove('open');
    syncNavigation();
    if (restoreFocus && mobile.matches) menu.focus();
  }
  menu.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    syncNavigation();
    if (navigationOpen()) navigationControls()[0]?.focus();
  });
  closeMenu.addEventListener('click', () => dismissNavigation());
  backdrop.addEventListener('click', () => dismissNavigation());
  // Close before opening a sibling account overlay or native reference dialog.
  sidebar.addEventListener('click', event => {
    if (event.target.closest('[data-account-open],[data-periodic-open]') && navigationOpen()) dismissNavigation(false);
  }, true);
  document.addEventListener('keydown', event => {
    if (!navigationOpen() || document.querySelector('dialog:modal')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      dismissNavigation();
    } else if (event.key === 'Tab') {
      const controls = navigationControls(), first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  // Existing route handlers close the drawer by removing its open class.
  new MutationObserver(syncNavigation).observe(sidebar, {attributes:true, attributeFilter:['class']});
  window.addEventListener('popstate', () => dismissNavigation(false));
  mobile.addEventListener('change', () => {
    const needsDesktopFocus = !mobile.matches && [menu, closeMenu].includes(document.activeElement);
    dismissNavigation(false);
    if (needsDesktopFocus) {
      // The menu controls disappear on desktop. Keep focus in visible navigation,
      // avoiding search because its separate breakpoint handler moves it next.
      const controls = navigationControls().filter(el => !el.closest('.ca-top-search'));
      (controls.find(el => el.classList.contains('active')) || controls[0])?.focus();
    }
  });
  syncNavigation();

  renderDegreeMap();
  renderCourseCards();
  renderQuiz();
  window.addEventListener('chematlas:learner-state-changed',()=>{quizState.fill(null);renderQuiz();document.getElementById('quizResult').textContent='';});
  resizeCanvas();
})();
