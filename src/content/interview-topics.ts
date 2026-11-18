import type { ConfessionalTemplate, EventTemplate } from '../domain';

const sharedIdeas: Record<string, string> = {
  'interview-loyal-18': 'death-aftermath',
  'interview-killer': 'death-aftermath',
  'interview-resourceful-46': 'death-aftermath',
  'interview-dramatic-32': 'death-aftermath',
  'interview-loyal-19': 'keeping-your-word',
  'interview-relationship-loyal': 'keeping-your-word',
  'interview-sneaky-26': 'cautious-cooperation',
  'interview-cautious-40': 'cautious-cooperation',
  'interview-revenge': 'revenge-aftermath',
  'interview-relationship-revenge': 'revenge-aftermath',
  'interview-betrayed': 'broken-trust',
  'interview-relationship-betrayed': 'broken-trust',
};

export function groundInterviewTopics(interviews: readonly ConfessionalTemplate[], events: readonly EventTemplate[]): ConfessionalTemplate[] {
  // These lines imply a companion or promise that acquiring supplies/travelling does not establish.
  const retired = new Set(['interview-loyal-14', 'interview-loyal-15']);
  const scenePrefixes: Record<string, string[]> = {
    'interview-agile-3': ['agile-shortcut'],
    'interview-weak-constitution-4': ['weak-constitution-rest'],
    'interview-perceptive-5': ['perceptive-snare', 'perceptive-cache'],
  };
  return interviews.filter(t => !retired.has(t.id)).map(template => {
    const prefixes = scenePrefixes[template.id];
    return { ...template, idea: sharedIdeas[template.id] ?? template.idea ?? template.id,
      ...(prefixes ? { eventIds: events.filter(e => prefixes.some(prefix => e.id === prefix || e.id.startsWith(`${prefix}-`))).map(e => e.id) } : {}) };
  });
}
