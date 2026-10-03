'use strict';

const assessment = require('../assessment.js');
const course = require('../data/genchem.js');
const { validateModule } = require('../content-store.js');
const COMPLETED = 'chematlas-genchem-completed-v1';
const ORIGIN = 'https://www.chemwaypoint.com';

function buildSummary(rows, published = [], now = Date.now()) {
  const states = new Map(rows.map(row => [row.state_key, row.state_value]));
  const legacy = states.get(COMPLETED) || [];
  const events = assessment.merge(states.get(assessment.KEY)).filter(event => event.at <= now);
  const modules = new Map(course.modules.map(module => [module.id, module]));
  for (const row of published) {
    if (row.key === 'module:' + row.payload?.id && !validateModule(row.payload)) {
      modules.set(row.payload.id, row.payload);
    }
  }
  const since = now - 7 * assessment.DAY;
  const lessons = [...modules.values()]
    .sort((a, b) => a.semester - b.semester || a.number - b.number || a.id.localeCompare(b.id))
    .map(module => {
      const state = assessment.summarize(module.id, events, legacy, now);
      const runs = new Map(events.filter(e => e.moduleId === module.id && e.type === 'start').map(e => [e.id, e]));
      // A legacy completion has no reliable date. Only a recorded first-pass finish dates completion.
      const firstFinish = events.find(e => e.moduleId === module.id && e.type === 'finish' && runs.get(e.run)?.mode === 'lesson');
      const url = ORIGIN + '/genchem/' + module.id;
      return {
        id: module.id, title: module.title, url,
        completed: state.complete, mastered: state.mastered, status: state.label,
        spacedReviewWins: state.reviewWins, reviewDue: state.due,
        reviewDueAt: state.dueAt == null ? null : new Date(state.dueAt).toISOString(),
        completedAt: firstFinish ? new Date(firstFinish.at).toISOString() : null,
        completedInPeriod: Boolean(firstFinish && firstFinish.at >= since),
        reviewUrl: url + '?review=1'
      };
    });
  const completed = lessons.filter(lesson => lesson.completed);
  const completedInPeriod = lessons.filter(lesson => lesson.completedInPeriod);
  const mastered = lessons.filter(lesson => lesson.mastered);
  const reviewsDue = lessons.filter(lesson => lesson.reviewDue).sort((a, b) => a.reviewDueAt.localeCompare(b.reviewDueAt));
  const nextLesson = lessons.find(lesson => !lesson.completed);
  const nextStep = reviewsDue.length
    ? { type: 'review', title: reviewsDue[0].title, url: reviewsDue[0].reviewUrl }
    : nextLesson ? { type: 'lesson', title: nextLesson.title, url: nextLesson.url }
      : { type: 'progress', title: 'View your progress', url: ORIGIN + '/progress' };
  const syncTimes = rows.map(row => Date.parse(row.updated_at)).filter(Number.isFinite);
  const lastSyncedAt = syncTimes.length ? new Date(Math.max(...syncTimes)).toISOString() : null;
  const hasSyncedProgress = rows.length > 0;
  const warnings = [];
  if (!hasSyncedProgress) warnings.push('No cloud-synced progress found. Sign in to ChemWaypoint and let your progress sync.');
  else if (lastSyncedAt && Date.parse(lastSyncedAt) < since) warnings.push('Saved progress was last synced more than seven days ago. Recent browser-only activity may be missing.');
  const names = list => list.length ? list.map(lesson => lesson.title).join(', ') : 'None yet';
  const text = [
    'Your ChemWaypoint learning summary — last 7 days',
    'Lessons completed in this period: ' + names(completedInPeriod),
    'Total lessons completed: ' + completed.length + ' of ' + lessons.length,
    'Mastery currently demonstrated: ' + names(mastered),
    'Reviews due: ' + (reviewsDue.length ? reviewsDue.map(lesson => lesson.title + ' — ' + lesson.reviewUrl).join('\n') : 'None right now'),
    'Next step: ' + nextStep.title + ' — ' + nextStep.url,
    'Last progress sync: ' + (lastSyncedAt || 'No synced record'),
    ...warnings,
    'Completion and mastery are separate. Mastery uses the same spaced-review evidence as your Progress page.'
  ].join('\n\n');
  return {
    schemaVersion: 1, generatedAt: new Date(now).toISOString(),
    period: { from: new Date(since).toISOString(), to: new Date(now).toISOString(), days: 7 },
    hasSyncedProgress, lastSyncedAt, warnings,
    counts: { totalLessons: lessons.length, completed: completed.length, completedInPeriod: completedInPeriod.length, mastered: mastered.length, reviewsDue: reviewsDue.length },
    completedInPeriod, mastered, reviewsDue, nextStep, lessons,
    email: { subject: 'Your ChemWaypoint learning summary', text }
  };
}

module.exports = { buildSummary, stateKeys: [assessment.KEY, COMPLETED] };
