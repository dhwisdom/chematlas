# ChemAtlas Product Architecture

## North Star

Help a chemistry learner build durable conceptual mastery, see how ideas connect across courses, and know what to practice next.

ChemAtlas is not designed as a collection of chemistry widgets. Every feature should support at least one learner capability and produce a measurable learning outcome.

## Learner problem

College chemistry is commonly experienced as disconnected chapters and courses. Students can often complete a calculation or memorize a rule without understanding how atomic structure, bonding, energy, equilibrium, mechanisms, and metabolism depend on one another. Static resources also provide weak feedback about what the learner has actually mastered or should review next.

## Product capabilities

1. **Learn** — structured, original course material with objectives, equations, worked examples, vocabulary, and prerequisite links.
2. **Visualize** — spatial and dynamic models that expose structures and relationships that are hard to understand in static diagrams.
3. **Practice** — reasoning-first problems, virtual labs, and immediate feedback.
4. **Measure** — mastery records and practice history rather than simple page completion.
5. **Adapt** — recommend the next lesson or review target from learner state and goals.
6. **Tutor** — course-grounded AI assistance that teaches from ChemAtlas content first and can optionally use current web context.
7. **Transfer** — explicitly connect General Chemistry concepts forward into Organic, Analytical, Physical Chemistry, and Biochemistry.

## Experience principles

- Start with the learner's problem and goal, not a technology demo.
- Reduce cognitive load: obvious navigation, progressive disclosure, visible next actions, and minimal decorative complexity.
- Design before adding complexity. New tools should be prototyped around a clear learning task before they become permanent navigation items.
- AI should enhance a defined workflow; it should not become the workflow by default.
- Keep guest mode useful. Accounts add continuity, not basic access.
- Preserve source boundaries. Course material, externally sourced information, and AI-generated explanation should be distinguishable.
- Prefer evidence of mastery over engagement vanity metrics.

## Data foundation

The canonical learner state is intentionally small and portable:

- learner goal and preferences
- module mastery
- practice-tool mastery
- assessment scores
- practice attempt history
- current/recommended concept
- tutor conversation history

Guest users store this state locally. Authenticated users synchronize the same state to Supabase so the learner can continue across devices.

## AI architecture

The ChemAtlas Tutor follows a retrieval-first pattern:

1. Receive the learner's question and current learning context.
2. Retrieve the most relevant ChemAtlas lesson excerpts in the browser.
3. Send only the relevant context to the server-side tutor endpoint.
4. Ask the model to teach from course context first.
5. Optionally enable web search for current/external context.
6. Store the conversation only when the learner chooses to keep a profile.

The OpenAI API key is server-side only and must never be committed to the repository or exposed in browser code.

## Governance and risk

- Supabase Row Level Security must isolate each learner's records.
- Publishable browser keys are allowed; service-role and OpenAI secrets are not.
- AI responses are assistive, not authoritative laboratory-safety instructions.
- Chemistry calculations and claims should be checkable against equations, units, and source material.
- The tutor should distinguish ChemAtlas course context from web-derived information.
- Learning analytics should collect only what is useful for the learner experience.

## Outcomes to measure

- module mastery rate
- practice accuracy and repeat attempts
- time between first exposure and mastery
- retention/review performance
- successful prerequisite transfer into later courses
- tutor helpfulness and follow-up success
- percentage of learners who can identify a productive next step without external guidance

## Delivery sequence

**Now:** learner-first landing page, clean URLs, goal onboarding, progress center, practice history, adaptive next-step recommendations, account/sync architecture, AI Tutor UI and server endpoint.

**Next:** live Supabase project, authentication, cross-device synchronization, tutor API key/environment configuration, deeper assessment event capture.

**Then:** cumulative exams, spaced review queue, concept-level mastery estimation, instructor/content-author views, and the Biochemistry systems layer.
