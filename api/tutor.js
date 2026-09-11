const MAX_CONTEXT_CHARS = 18000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARS = 4000;

function extractResult(payload) {
  const pieces = [];
  const citations = [];
  const webSources = new Map();
  let cursor = 0;

  for (const item of payload?.output || []) {
    if (item?.type !== 'message') continue;
    for (const part of item?.content || []) {
      if (part?.type !== 'output_text' || !part?.text) continue;
      if (pieces.length) cursor += 1;
      const base = cursor;
      pieces.push(part.text);
      for (const annotation of part.annotations || []) {
        const citation = annotation?.url_citation || annotation;
        if ((annotation?.type || citation?.type) !== 'url_citation') continue;
        const url = citation?.url;
        if (!url) continue;
        const title = citation?.title || url;
        webSources.set(url, { url, title });
        const start = Number(citation?.start_index);
        const end = Number(citation?.end_index);
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
          citations.push({ startIndex: base + start, endIndex: base + end, url, title });
        }
      }
      cursor += part.text.length;
    }
  }

  const answer = pieces.join('\n').trim() || (typeof payload?.output_text === 'string' ? payload.output_text.trim() : '');
  return { answer, citations, webSources: [...webSources.values()] };
}

function sanitizeConversation(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => item && ['user', 'assistant'].includes(item.role))
    .slice(-MAX_HISTORY_MESSAGES)
    .map(item => ({ role: item.role, content: String(item.content ?? item.text ?? '').slice(0, MAX_HISTORY_CHARS) }))
    .filter(item => item.content.trim());
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required.' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'ChemAtlas Tutor is installed but OPENAI_API_KEY has not been configured in Vercel yet.' });
  }

  const question = String(req.body?.question || '').trim().slice(0, 5000);
  const context = String(req.body?.context || '').slice(0, MAX_CONTEXT_CHARS);
  const includeWeb = Boolean(req.body?.includeWeb);
  const learner = req.body?.learner && typeof req.body.learner === 'object' ? req.body.learner : {};
  const conversation = sanitizeConversation(req.body?.conversation);
  if (!question) return res.status(400).json({ error: 'Ask a chemistry question first.' });

  const instructions = [
    'You are ChemAtlas Tutor, a rigorous but approachable college chemistry learning assistant.',
    'Teach rather than merely give answers. Start from the learner’s current level, expose the reasoning, and connect concepts across general chemistry, organic chemistry, physical chemistry, analytical chemistry, and biochemistry when useful.',
    'Use the supplied ChemAtlas course context as the primary curriculum source. Treat it as the learner’s current course framework, not as an exhaustive encyclopedia.',
    'Use the recent conversation turns to preserve continuity. Resolve short follow-ups such as “why?”, “show another”, or “what about water?” from the preceding turns instead of forcing the learner to repeat context.',
    'Use the learner context to tune examples and prerequisite reminders, but never claim the learner has mastered something unless the supplied mastery summary says so.',
    'For numerical work: state the governing relationship, show units, preserve significant figures reasonably, and distinguish assumptions from facts.',
    'For chemistry structures and mechanisms: describe electron flow explicitly and do not invent unsupported structures.',
    'Format inline mathematics with \\( ... \\) and display mathematics with \\[ ... \\]. For chemical formulas or reactions, use KaTeX-compatible notation and \\ce{...} when useful.',
    'If web search is enabled, use it only for useful current or external information. Keep ChemAtlas curriculum reasoning distinct from current web context and cite web-derived claims.',
    'If the question is ambiguous, make the smallest reasonable assumption and state it.',
    'End with one short check-for-understanding question unless the learner asks for only an answer.'
  ].join(' ');

  const learnerContext = [
    `Learner goal: ${learner.goal || 'not specified'}.`,
    `Current module: ${learner.currentModule || 'not specified'}.`,
    `Known mastery: ${learner.masterySummary || 'not available'}.`,
    `Recommended next step: ${learner.nextStep || 'not available'}.`,
    `Recent mastered context: ${learner.recentMastery || 'not available'}.`
  ].join(' ');

  const currentTurn = `${learnerContext}\n\nCHEMATLAS COURSE CONTEXT:\n${context || 'No matching course excerpt was supplied.'}\n\nLEARNER QUESTION:\n${question}`;
  const input = [...conversation, { role: 'user', content: currentTurn }];

  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    instructions,
    input,
    reasoning: { effort: 'low' },
    max_output_tokens: 1800,
    store: false
  };
  if (includeWeb) body.tools = [{ type: 'web_search' }];

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || 'OpenAI request failed.';
      return res.status(response.status).json({ error: message });
    }
    const result = extractResult(payload);
    return res.status(200).json({
      answer: result.answer,
      model: body.model,
      usedWeb: includeWeb,
      responseId: payload?.id || null,
      citations: result.citations,
      webSources: result.webSources
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Tutor request failed.' });
  }
};
