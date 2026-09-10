const MAX_CONTEXT_CHARS = 18000;

function extractText(payload) {
  if (payload && typeof payload.output_text === 'string') return payload.output_text.trim();
  const pieces = [];
  for (const item of payload?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === 'output_text' && part?.text) pieces.push(part.text);
    }
  }
  return pieces.join('\n').trim();
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required.' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'ChemAtlas Tutor is installed but OPENAI_API_KEY has not been configured in Vercel yet.'
    });
  }

  const question = String(req.body?.question || '').trim().slice(0, 5000);
  const context = String(req.body?.context || '').slice(0, MAX_CONTEXT_CHARS);
  const includeWeb = Boolean(req.body?.includeWeb);
  const learner = req.body?.learner && typeof req.body.learner === 'object' ? req.body.learner : {};
  if (!question) return res.status(400).json({ error: 'Ask a chemistry question first.' });

  const instructions = [
    'You are ChemAtlas Tutor, a rigorous but approachable college chemistry learning assistant.',
    'Teach rather than merely give answers. Start from the learner’s current level, expose the reasoning, and connect concepts across general chemistry, organic chemistry, physical chemistry, analytical chemistry, and biochemistry when useful.',
    'For numerical work: state the governing relationship, show units, preserve significant figures reasonably, and distinguish assumptions from facts.',
    'For chemistry structures and mechanisms: describe electron flow explicitly and do not invent unsupported structures.',
    'Use the supplied ChemAtlas course context as the primary curriculum source. If web search is enabled, use it only for useful current/background information and clearly separate it from the ChemAtlas curriculum.',
    'If the question is ambiguous, make the smallest reasonable assumption and state it.',
    'End with one short check-for-understanding question unless the learner asks for only an answer.'
  ].join(' ');

  const learnerContext = `Learner goal: ${learner.goal || 'not specified'}. Current module: ${learner.currentModule || 'not specified'}. Known mastery: ${learner.masterySummary || 'not available'}.`;
  const input = `${learnerContext}\n\nCHEMATLAS COURSE CONTEXT:\n${context || 'No matching course excerpt was supplied.'}\n\nLEARNER QUESTION:\n${question}`;

  const body = {
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    instructions,
    input,
    reasoning: { effort: 'low' },
    max_output_tokens: 1800
  };
  if (includeWeb) body.tools = [{ type: 'web_search' }];

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || 'OpenAI request failed.';
      return res.status(response.status).json({ error: message });
    }
    const answer = extractText(payload);
    return res.status(200).json({ answer, model: body.model, usedWeb: includeWeb, responseId: payload?.id || null });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Tutor request failed.' });
  }
};
