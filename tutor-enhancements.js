(() => {
  if (window.__CHEMATLAS_TUTOR_V2__) return;
  window.__CHEMATLAS_TUTOR_V2__ = true;

  const cfg = window.CHEMATLAS_CONFIG || {};
  const THREADS_KEY = 'chematlas-tutor-threads-v2';
  const ACTIVE_KEY = 'chematlas-tutor-active-v2';
  const LEGACY_KEY = 'chematlas-tutor-history-v1';
  const MODULES_KEY = 'chematlas-genchem-completed-v1';
  const TOOLS_KEY = 'chematlas-gc-tools-v1';
  const VSEPR_KEY = 'chematlas-vsepr-score';
  const GOAL_KEY = 'chematlas-learning-goal-v1';
  const CURRENT_MODULE_KEY = 'chematlas-genchem-current';
  const MAX_THREADS = 10;
  const MAX_MESSAGES_PER_THREAD = 50;

  let tutorCloud = null;
  let tutorSession = null;
  let pendingThreadId = null;
  let pendingText = '';
  let cloudInitStarted = false;
  let renderQueued = false;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[ch]));
  const safeJson = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  };
  const uuid = () => (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
  const validHttpUrl = value => {
    try { const url = new URL(String(value || '')); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  };
  const compactText = (value, max = 72) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  };
  const words = text => new Set(String(text || '').toLowerCase().match(/[a-z0-9]+/g)?.filter(token => token.length > 2) || []);

  function goalLabel() {
    const goal = localStorage.getItem(GOAL_KEY) || 'foundations';
    return ({
      foundations: 'Build strong foundations',
      organic: 'Prepare for Organic Chemistry',
      genchem2: 'Strengthen General Chemistry II',
      biochem: 'Prepare for Biochemistry'
    })[goal] || 'Build strong foundations';
  }

  function learnerSnapshot() {
    const masteredIds = safeJson(MODULES_KEY, []);
    const toolIds = safeJson(TOOLS_KEY, []);
    const modules = window.CHEM_GENCHEM?.modules || [];
    const currentId = localStorage.getItem(CURRENT_MODULE_KEY) || '';
    const current = modules.find(module => module.id === currentId);
    const masteredTitles = masteredIds.map(id => modules.find(module => module.id === id)?.title).filter(Boolean);
    const next = modules.find(module => !masteredIds.includes(module.id));
    return {
      goal: goalLabel(),
      currentModule: current?.title || currentId || 'not specified',
      masterySummary: `${masteredIds.length}/${modules.length || 19} General Chemistry modules mastered; ${toolIds.length}/7 practice engines cleared; VSEPR ${Number(localStorage.getItem(VSEPR_KEY) || 0)}/3.`,
      nextStep: next?.title || 'Organic Chemistry Studio',
      recentMastery: masteredTitles.slice(-6).join(' • ') || 'No module mastery recorded yet.'
    };
  }

  function normalizeMessage(message, threadId) {
    if (!message || !['user', 'assistant'].includes(message.role)) return null;
    const metadata = message.metadata && typeof message.metadata === 'object' ? message.metadata : {};
    return {
      id: String(message.id || uuid()), threadId, role: message.role,
      text: String(message.text ?? message.content ?? ''),
      at: message.at || message.created_at || new Date().toISOString(),
      model: message.model || message.model_name || metadata.model || '',
      usedWeb: Boolean(message.usedWeb ?? message.used_web ?? metadata.usedWeb),
      courseSources: Array.isArray(message.courseSources) ? message.courseSources : (metadata.courseSources || []),
      webSources: Array.isArray(message.webSources) ? message.webSources : (metadata.webSources || []),
      citations: Array.isArray(message.citations) ? message.citations : (metadata.citations || []),
      learner: message.learner || metadata.learner || null,
      responseId: message.responseId || metadata.responseId || null
    };
  }

  function normalizeThread(thread) {
    if (!thread || typeof thread !== 'object') return null;
    const id = String(thread.id || uuid());
    const messages = (Array.isArray(thread.messages) ? thread.messages : [])
      .map(message => normalizeMessage(message, id)).filter(Boolean)
      .sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-MAX_MESSAGES_PER_THREAD);
    return {
      id,
      title: compactText(thread.title || messages.find(m => m.role === 'user')?.text || 'New chemistry question'),
      createdAt: thread.createdAt || thread.created_at || messages[0]?.at || new Date().toISOString(),
      updatedAt: thread.updatedAt || thread.updated_at || messages.at(-1)?.at || new Date().toISOString(),
      messages
    };
  }

  function readThreads() {
    let threads = safeJson(THREADS_KEY, []);
    if (!Array.isArray(threads)) threads = [];
    if (!threads.length) {
      const legacy = safeJson(LEGACY_KEY, []);
      if (Array.isArray(legacy) && legacy.some(item => ['user', 'assistant'].includes(item?.role))) {
        const id = uuid();
        const migrated = {
          id,
          title: compactText(legacy.find(item => item?.role === 'user')?.text || 'Earlier Tutor conversation'),
          createdAt: legacy[0]?.at || new Date().toISOString(),
          updatedAt: legacy.at(-1)?.at || new Date().toISOString(),
          messages: legacy.map(item => normalizeMessage(item, id)).filter(Boolean)
        };
        threads = [migrated];
        localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
        localStorage.setItem(ACTIVE_KEY, id);
      }
    }
    return threads.map(normalizeThread).filter(Boolean)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, MAX_THREADS);
  }

  function saveThreads(threads) {
    const normalized = (Array.isArray(threads) ? threads : []).map(normalizeThread).filter(Boolean)
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, MAX_THREADS);
    try { localStorage.setItem(THREADS_KEY, JSON.stringify(normalized)); } catch (_) {}
    return normalized;
  }

  function activeThread(threads = readThreads()) {
    const id = localStorage.getItem(ACTIVE_KEY);
    return threads.find(thread => thread.id === id) || threads[0] || null;
  }
  function setActiveThread(id) {
    if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY);
    renderTutorV2();
  }
  function makeThread() {
    const thread = { id: uuid(), title: 'New chemistry question', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] };
    const threads = saveThreads([thread, ...readThreads()]);
    localStorage.setItem(ACTIVE_KEY, thread.id);
    renderTutorV2();
    document.getElementById('caTutorInput')?.focus();
    return threads.find(item => item.id === thread.id) || thread;
  }

  function buildContext(question) {
    const queryWords = words(question);
    const scored = [];
    for (const module of window.CHEM_GENCHEM?.modules || []) {
      const fullText = [module.title, module.subtitle, ...(module.outcomes || []), ...(module.vocabulary || []),
        ...(module.sections || []).flatMap(section => [section.title, ...(section.body || [])]),
        ...(module.equations || []).flatMap(eq => [eq.label, eq.expression]), module.example?.prompt,
        ...(module.example?.steps || []), module.example?.answer, module.bridge?.text, module.lab].filter(Boolean).join(' ');
      const moduleWords = words(fullText);
      let score = 0;
      queryWords.forEach(word => { if (moduleWords.has(word)) score += 1; });
      if (module.title.toLowerCase().split(/\W+/).some(word => queryWords.has(word))) score += 2;
      scored.push({ score, module, fullText });
    }
    scored.sort((a, b) => b.score - a.score || a.module.number - b.module.number);
    const chosen = scored.filter(item => item.score > 0).slice(0, 4);
    if (!chosen.length) chosen.push(...scored.slice(0, 3));
    const sources = chosen.map(item => ({ type: 'course', id: item.module.id, title: item.module.title, subtitle: item.module.subtitle || '', route: `/genchem/${item.module.id}` }));
    let context = chosen.map(item => `MODULE: ${item.module.title}\n${item.fullText}`).join('\n\n');
    if (window.CHEM_ORGANIC && [...queryWords].some(word => /stereo|chir|sn2|mechan|organic|cip|newman|chair|conform/.test(word))) {
      const organic = window.CHEM_ORGANIC;
      context += `\n\nORGANIC STUDIO CONTEXT: ${(organic.stereoChallenges || []).map(item => item.explanation).join(' ')} ${organic.mechanism?.explanation || ''}`;
      sources.push({ type: 'studio', id: 'organic-studio', title: 'Organic Chemistry Studio', subtitle: 'Stereochemistry, conformations, chairs, and mechanism practice', route: '/organic' });
    }
    return { context: context.slice(0, 17000), sources };
  }

  function formatPlainSegment(value) {
    let html = esc(value);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return html.replace(/\n/g, '<br>');
  }

  function renderRichText(text, citations = []) {
    const raw = String(text || '');
    const valid = (Array.isArray(citations) ? citations : []).map(item => ({
      start: Number(item.startIndex ?? item.start_index), end: Number(item.endIndex ?? item.end_index),
      url: validHttpUrl(item.url), title: item.title || 'Web source'
    })).filter(item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start && item.url)
      .sort((a, b) => a.start - b.start);
    if (!valid.length) return formatPlainSegment(raw);
    let cursor = 0; let html = '';
    for (const citation of valid) {
      if (citation.start < cursor || citation.start > raw.length) continue;
      html += formatPlainSegment(raw.slice(cursor, citation.start));
      const linked = raw.slice(citation.start, Math.min(citation.end, raw.length));
      html += `<a class="ca-inline-citation" href="${esc(citation.url)}" target="_blank" rel="noopener noreferrer" title="${esc(citation.title)}">${formatPlainSegment(linked)}</a>`;
      cursor = Math.min(citation.end, raw.length);
    }
    html += formatPlainSegment(raw.slice(cursor));
    return html;
  }

  function messageMeta(message) {
    if (message.role !== 'assistant') return '';
    const courseSources = Array.isArray(message.courseSources) ? message.courseSources : [];
    const webSources = Array.isArray(message.webSources) ? message.webSources : [];
    const model = message.model ? `<span class="ca-meta-pill">${esc(message.model)}</span>` : '';
    const course = courseSources.length ? `<span class="ca-meta-pill course">ChemAtlas • ${courseSources.length} source${courseSources.length === 1 ? '' : 's'}</span>` : '';
    const web = message.usedWeb ? `<span class="ca-meta-pill web">Web • ${webSources.length || 'checked'}</span>` : '';
    const details = (courseSources.length || webSources.length) ? `<details class="ca-context-details"><summary>Context used</summary><div class="ca-context-list">
      ${courseSources.map(source => `<button data-route="${esc(source.route || '/courses')}"><span>COURSE</span><strong>${esc(source.title)}</strong><small>${esc(source.subtitle || '')}</small></button>`).join('')}
      ${webSources.map(source => { const url = validHttpUrl(source.url); return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>WEB</span><strong>${esc(source.title || new URL(url).hostname)}</strong><small>${esc(new URL(url).hostname)}</small></a>` : ''; }).join('')}
    </div></details>` : '';
    return `<div class="ca-message-meta">${course}${web}${model}${details}</div>`;
  }

  function renderMessage(message) {
    const assistant = message.role === 'assistant';
    return `<div class="ca-message ${assistant ? 'assistant' : 'user'}" data-message-id="${esc(message.id)}"><span>${assistant ? 'C' : 'YOU'}</span><div class="ca-message-body"><div class="ca-message-copy">${renderRichText(message.text, message.citations)}</div>${messageMeta(message)}</div></div>`;
  }

  function threadListHtml(threads, activeId) {
    if (!threads.length) return '<p class="ca-thread-empty">Your Tutor conversations will appear here.</p>';
    return threads.map(thread => {
      const userCount = thread.messages.filter(message => message.role === 'user').length;
      return `<button class="ca-thread-item ${thread.id === activeId ? 'active' : ''}" data-tutor-thread="${esc(thread.id)}"><span>✦</span><div><strong>${esc(thread.title)}</strong><small>${userCount} question${userCount === 1 ? '' : 's'} • ${new Date(thread.updatedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small></div></button>`;
    }).join('');
  }

  function learnerPanelHtml(snapshot) {
    const mastered = safeJson(MODULES_KEY, []).length;
    const tools = safeJson(TOOLS_KEY, []).length;
    return `<article class="panel ca-memory-card"><div class="ca-memory-head"><div><p class="eyebrow">LEARNER CONTEXT MEMORY</p><h3>What the Tutor knows</h3></div><span class="ca-memory-on"><i></i> ON</span></div><div class="ca-memory-grid"><div><span>Goal</span><strong>${esc(snapshot.goal)}</strong></div><div><span>Current module</span><strong>${esc(snapshot.currentModule)}</strong></div><div><span>Gen Chem</span><strong>${mastered}/${window.CHEM_GENCHEM?.modules?.length || 19} mastered</strong></div><div><span>Practice</span><strong>${tools}/7 cleared</strong></div></div><p class="ca-memory-note">Each question carries your current goal, mastery snapshot, recommended next step, and recent turns in this conversation.</p></article>`;
  }

  function renderTutorV2() {
    const root = document.getElementById('caTutorView'); if (!root) return;
    const threads = readThreads();
    let thread = activeThread(threads); if (!thread && threads.length) thread = threads[0];
    if (thread && localStorage.getItem(ACTIVE_KEY) !== thread.id) localStorage.setItem(ACTIVE_KEY, thread.id);
    const activeId = thread?.id || ''; const messages = thread?.messages || []; const snapshot = learnerSnapshot();
    const cloudLabel = tutorSession ? 'Cloud history' : 'Local history';
    root.innerHTML = `<div id="caTutorV2" class="ca-tutor-v2"><aside class="ca-thread-rail panel"><div class="ca-thread-head"><div><p class="eyebrow">CONVERSATIONS</p><h3>AI Tutor history</h3></div><button class="ca-new-thread" data-tutor-new title="New conversation">＋</button></div><button class="ca-new-chat" data-tutor-new><span>✦</span> New chemistry chat</button><div class="ca-thread-list">${threadListHtml(threads, activeId)}</div><div class="ca-thread-sync"><i class="${tutorSession ? 'online' : ''}"></i><span><strong>${cloudLabel}</strong><small>${tutorSession ? 'synced with your profile' : 'sign in to sync across devices'}</small></span></div></aside>
      <section class="ca-tutor-main ca-tutor-main-v2"><div class="ca-page-head ca-tutor-head-v2"><div><p class="eyebrow">COURSE-GROUNDED AI • CONTEXT-AWARE</p><h2>${esc(thread?.title || 'Ask ChemAtlas')}</h2><p>Follow-up questions remember this conversation. Equations render as mathematics, and every answer shows which ChemAtlas or web context it used.</p></div><span class="ca-ai-status ready"><i></i> Tutor live</span></div><div class="ca-chat panel ca-chat-v2" id="caChat">${messages.length ? messages.map(renderMessage).join('') : `<div class="ca-tutor-empty"><span>✦</span><h3>Start with a concept, not a magic answer.</h3><p>Ask for an explanation, a worked problem, a comparison, or help finding the gap in your reasoning.</p><div><button data-tutor-v2-prompt="Why does molecular geometry affect polarity?">Geometry → polarity</button><button data-tutor-v2-prompt="Walk me through a limiting-reagent problem without skipping units.">Stoichiometry</button><button data-tutor-v2-prompt="How do acid-base concepts from Gen Chem show up in organic chemistry?">Bridge to Organic</button></div></div>`}${pendingThreadId === activeId ? `<div class="ca-message assistant ca-thinking"><span>C</span><div class="ca-message-body"><div class="ca-message-copy">${esc(pendingText || 'Thinking through the chemistry…')}</div></div></div>` : ''}</div><form class="ca-tutor-form ca-tutor-form-v2" id="caTutorForm"><textarea id="caTutorInput" rows="3" placeholder="Ask a chemistry question or follow up on this conversation…"></textarea><div><label><input id="caTutorWeb" type="checkbox" checked> Allow web context when useful</label><button class="primary-button" type="submit" ${pendingThreadId ? 'disabled' : ''}>${pendingThreadId ? 'Thinking…' : 'Ask Tutor ✦'}</button></div></form></section>
      <aside class="ca-tutor-side ca-tutor-side-v2">${learnerPanelHtml(snapshot)}<article class="panel"><p class="eyebrow">HOW IT ANSWERS</p><ol><li>Retrieves relevant ChemAtlas modules.</li><li>Uses this thread’s recent turns.</li><li>Shows governing chemistry and units.</li><li>Renders equations and chemical notation.</li><li>Surfaces the context and sources used.</li></ol></article><article class="panel ca-tutor-guardrail"><p class="eyebrow">LEARNING GUARDRAIL</p><p>The Tutor is assistive. Safety-critical lab decisions and externally sourced claims should still be checked against authoritative course or laboratory sources.</p></article></aside></div>`;
    requestAnimationFrame(() => { const chat = document.getElementById('caChat'); if (chat) chat.scrollTop = chat.scrollHeight; renderMath(root); });
  }

  async function askTutorV2(form) {
    const input = form.querySelector('#caTutorInput'); const question = input?.value.trim();
    if (!question || pendingThreadId) return;
    let threads = readThreads(); let thread = activeThread(threads);
    if (!thread) { thread = { id: uuid(), title: compactText(question), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] }; threads.unshift(thread); localStorage.setItem(ACTIVE_KEY, thread.id); }
    const priorConversation = thread.messages.slice(-10).map(message => ({ role: message.role, content: message.text }));
    const learner = learnerSnapshot(); const contextPack = buildContext(question);
    const userMessage = { id: uuid(), threadId: thread.id, role: 'user', text: question, at: new Date().toISOString(), learner };
    thread.messages.push(userMessage);
    if (!thread.messages.slice(0, -1).some(message => message.role === 'user')) thread.title = compactText(question);
    thread.updatedAt = userMessage.at;
    threads = saveThreads(threads.map(item => item.id === thread.id ? thread : item));
    pendingThreadId = thread.id; pendingText = 'Retrieving course context and working through the chemistry…';
    renderTutorV2(); syncThreadToCloud(thread).catch(() => {});
    try {
      const response = await fetch(cfg.tutorEndpoint || '/api/tutor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, context: contextPack.context, includeWeb: Boolean(form.querySelector('#caTutorWeb')?.checked), conversation: priorConversation, learner }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Tutor request failed');
      const assistantMessage = { id: uuid(), threadId: thread.id, role: 'assistant', text: data.answer || 'No response returned.', at: new Date().toISOString(), model: data.model || '', usedWeb: Boolean(data.usedWeb), courseSources: contextPack.sources, webSources: data.webSources || [], citations: data.citations || [], learner, responseId: data.responseId || null };
      thread.messages.push(assistantMessage); thread.updatedAt = assistantMessage.at;
      saveThreads(readThreads().map(item => item.id === thread.id ? thread : item)); await syncThreadToCloud(thread);
    } catch (error) {
      const assistantMessage = { id: uuid(), threadId: thread.id, role: 'assistant', text: `Tutor connection note: ${error?.message || 'The request failed.'}`, at: new Date().toISOString(), courseSources: contextPack.sources, learner };
      thread.messages.push(assistantMessage); thread.updatedAt = assistantMessage.at;
      saveThreads(readThreads().map(item => item.id === thread.id ? thread : item)); await syncThreadToCloud(thread).catch(() => {});
    } finally { pendingThreadId = null; pendingText = ''; renderTutorV2(); }
  }

  function addStylesheet(href) { if (document.querySelector(`link[href="${href}"]`)) return; const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link); }
  function loadScript(src) { return new Promise((resolve, reject) => { const existing = document.querySelector(`script[src="${src}"]`); if (existing) { if (existing.dataset.loaded === '1' || (src.includes('katex.min.js') && window.katex) || (src.includes('auto-render') && window.renderMathInElement)) return resolve(); existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); return; } const script = document.createElement('script'); script.src = src; script.defer = true; script.onload = () => { script.dataset.loaded = '1'; resolve(); }; script.onerror = () => reject(new Error(`Could not load ${src}`)); document.head.appendChild(script); }); }

  let mathReadyPromise = null;
  function ensureMathRenderer() {
    if (window.renderMathInElement && window.katex) return Promise.resolve();
    if (mathReadyPromise) return mathReadyPromise;
    const base = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist';
    addStylesheet(`${base}/katex.min.css`);
    mathReadyPromise = loadScript(`${base}/katex.min.js`).then(() => loadScript(`${base}/contrib/mhchem.min.js`)).then(() => loadScript(`${base}/contrib/auto-render.min.js`)).catch(error => console.warn('ChemAtlas math renderer:', error.message));
    return mathReadyPromise;
  }
  async function renderMath(root) {
    await ensureMathRenderer(); if (!window.renderMathInElement || !root) return;
    try { window.renderMathInElement(root, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }], throwOnError: false, strict: 'ignore', ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] }); }
    catch (error) { console.warn('ChemAtlas math render:', error.message); }
  }

  async function waitForSupabaseLibrary(timeout = 12000) { const started = Date.now(); while (!window.supabase?.createClient && Date.now() - started < timeout) await new Promise(resolve => setTimeout(resolve, 150)); return Boolean(window.supabase?.createClient); }
  async function initTutorCloud() {
    if (cloudInitStarted || !cfg.supabaseUrl || !cfg.supabasePublishableKey) return;
    cloudInitStarted = true;
    try {
      if (!(await waitForSupabaseLibrary())) return;
      tutorCloud = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data } = await tutorCloud.auth.getSession(); tutorSession = data.session;
      tutorCloud.auth.onAuthStateChange((_event, nextSession) => { tutorSession = nextSession; if (nextSession) mergeCloudThreads().catch(error => console.warn('ChemAtlas tutor cloud merge:', error.message)); renderTutorV2(); });
      if (tutorSession) await mergeCloudThreads(); renderTutorV2();
    } catch (error) { console.warn('ChemAtlas tutor cloud:', error.message); }
  }

  async function syncThreadToCloud(thread) {
    if (!tutorCloud || !tutorSession || !thread) return;
    const userId = tutorSession.user.id;
    const threadRow = { id: thread.id, user_id: userId, title: thread.title, course_context: goalLabel(), created_at: thread.createdAt, updated_at: thread.updatedAt };
    const { error: threadError } = await tutorCloud.from('tutor_threads').upsert(threadRow, { onConflict: 'id' }); if (threadError) throw threadError;
    const rows = thread.messages.map(message => ({ id: message.id, thread_id: thread.id, user_id: userId, role: message.role, content: message.text, model_name: message.model || null, used_web: Boolean(message.usedWeb), created_at: message.at, metadata: { courseSources: message.courseSources || [], webSources: message.webSources || [], citations: message.citations || [], learner: message.learner || null, responseId: message.responseId || null } }));
    if (rows.length) { const { error: messageError } = await tutorCloud.from('tutor_messages').upsert(rows, { onConflict: 'id' }); if (messageError) throw messageError; }
  }

  async function mergeCloudThreads() {
    if (!tutorCloud || !tutorSession) return;
    const userId = tutorSession.user.id;
    const { data: remoteThreads, error: threadError } = await tutorCloud.from('tutor_threads').select('id,title,course_context,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(MAX_THREADS);
    if (threadError) throw threadError;
    const threadIds = (remoteThreads || []).map(row => row.id); let remoteMessages = [];
    if (threadIds.length) { const { data, error } = await tutorCloud.from('tutor_messages').select('id,thread_id,role,content,model_name,used_web,created_at,metadata').eq('user_id', userId).in('thread_id', threadIds).order('created_at', { ascending: true }); if (error) throw error; remoteMessages = data || []; }
    const localThreads = readThreads(); const map = new Map(localThreads.map(thread => [thread.id, thread]));
    for (const row of remoteThreads || []) {
      const remoteThread = normalizeThread({ id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at, messages: remoteMessages.filter(message => message.thread_id === row.id) });
      const local = map.get(row.id);
      if (!local) map.set(row.id, remoteThread);
      else {
        const messages = new Map(local.messages.map(message => [message.id, message]));
        remoteThread.messages.forEach(message => messages.set(message.id, { ...messages.get(message.id), ...message }));
        map.set(row.id, normalizeThread({ ...local, title: remoteThread.title || local.title, createdAt: local.createdAt < remoteThread.createdAt ? local.createdAt : remoteThread.createdAt, updatedAt: local.updatedAt > remoteThread.updatedAt ? local.updatedAt : remoteThread.updatedAt, messages: [...messages.values()] }));
      }
    }
    const merged = saveThreads([...map.values()]); if (!localStorage.getItem(ACTIVE_KEY) && merged[0]) localStorage.setItem(ACTIVE_KEY, merged[0].id);
    for (const thread of merged) await syncThreadToCloud(thread);
    renderTutorV2();
  }

  document.addEventListener('submit', event => { if (event.target?.id !== 'caTutorForm' || !document.getElementById('caTutorV2')) return; event.preventDefault(); event.stopImmediatePropagation(); askTutorV2(event.target); }, true);
  document.addEventListener('click', event => {
    const newThread = event.target.closest('[data-tutor-new]'); if (newThread) { event.preventDefault(); makeThread(); return; }
    const threadButton = event.target.closest('[data-tutor-thread]'); if (threadButton) { event.preventDefault(); setActiveThread(threadButton.dataset.tutorThread); return; }
    const prompt = event.target.closest('[data-tutor-v2-prompt]'); if (prompt) { event.preventDefault(); const input = document.getElementById('caTutorInput'); if (input) { input.value = prompt.dataset.tutorV2Prompt || ''; input.focus(); } }
  }, true);

  function queueRender() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; const root = document.getElementById('caTutorView'); if (root && !root.querySelector('#caTutorV2')) renderTutorV2(); }); }
  const observer = new MutationObserver(queueRender); observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', () => setTimeout(queueRender, 0));
  window.addEventListener('storage', event => { if ([THREADS_KEY, ACTIVE_KEY, MODULES_KEY, TOOLS_KEY, VSEPR_KEY, GOAL_KEY, CURRENT_MODULE_KEY].includes(event.key)) renderTutorV2(); });

  ensureMathRenderer(); queueRender(); initTutorCloud();
  window.ChemAtlasTutor = { newThread: makeThread, refresh: renderTutorV2, getThreads: readThreads };
})();
