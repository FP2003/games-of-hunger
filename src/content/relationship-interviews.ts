import type { ConfessionalTemplate } from '../domain';

const interview = (id: string, triggers: ConfessionalTemplate['triggers'], speaker: ConfessionalTemplate['speaker'], variants: string[], extra: Partial<ConfessionalTemplate> = {}): ConfessionalTemplate => ({
  id: `interview-relationship-${id}`, triggers, speaker, variants, traits: [], tones: ['dramatic', 'absurd', 'mixed'], cooldown: 16, ...extra,
});

// Reactions are grounded in their triggering fact. Strong relationship claims
// additionally require the speaker's directed opinion of that fact's counterpart.
export const relationshipInterviews: ConfessionalTemplate[] = [
  interview('helping', ['assistance'], 'actor', [
    'I had something useful to offer. It seemed a waste to stand there calculating.',
    'Helping someone leaves you with a very inconvenient interest in what happens to them.',
    'I could explain that as strategy. I would be making some of it up.',
    'For a moment there was a problem I could actually do something about.',
    'The camera was waiting for a speech. I was busy.',
    'I hope that bought us a little breathing room. I have no idea what the exchange rate is.',
  ]),
  interview('accepting-help', ['assistance'], 'target', [
    'Being helped is awkward when you have spent all morning trying to look capable.',
    'I keep rehearsing a better thank you. The first one was mostly breathing.',
    'There is a particular relief in discovering the next task is not yours alone.',
    'I am trying to accept the help without immediately turning it into a debt.',
    'I would like to look less surprised the next time someone is decent to me.',
    'That gave me enough space to think. I had forgotten how much that matters.',
  ]),
  interview('devoted', ['assistance', 'alliance'], 'actor', [
    'I trust them enough to stop rehearsing what I would say if they turned on me.',
    'Somewhere in all this, their safety became part of my plan.',
    'I know the sensible advice about getting attached. I have heard it.',
    'If I have to explain why I care, this interview is going to take a while.',
    'I can still count the risks. I just cannot pretend they are the only things that count.',
    'They matter to me. You can put whatever dramatic music you like under that.',
  ], { relationship: { minTrust: 80, maxGrudge: 39 } }),
  interview('friendly', ['assistance', 'alliance'], 'target', [
    'I caught myself relaxing around them. That was unexpected.',
    'I am starting to think we could have managed an ordinary conversation somewhere else.',
    'It is nice to have a reason to look forward to seeing someone.',
    'We are getting along. I would like to leave the grand predictions out of it.',
    'There might be room for a little kindness without drawing up a contract.',
    'I am willing to see where this goes. Slowly would suit me.',
  ], { relationship: { minTrust: 20, maxGrudge: 39 } }),
  interview('betrayed', ['betrayal'], 'target', [
    'I keep going back over the conversation, looking for the bit I should have questioned.',
    'I need a new plan before I need an apology.',
    'The embarrassing part is how certain I sounded when I defended them.',
    'I would like five minutes without having to decide what this makes me.',
    'I am angry, but I do not want anger doing all my thinking.',
    'The cameras have the moment it happened. I am stuck with the moment I understood it.',
  ]),
  interview('betrayer', ['betrayal'], 'actor', [
    'I had an explanation ready. It sounded better before I needed to use it.',
    'I made the choice. Calling it inevitable would be convenient.',
    'I would prefer a question about my excellent navigation skills right now.',
    'There is a version of this interview where I pretend I feel nothing. You would notice.',
    'I cannot expect them to judge the decision by what it cost me.',
    'I thought the difficult part would be doing it. Apparently there are follow-up questions.',
  ], { traits: ['disloyal'] }),
  interview('rival', ['grudge', 'nemesis'], 'actor', [
    'I dislike how much of my attention they are getting for free.',
    'I have started checking who is nearby before I let myself get angry.',
    'I could spend all day explaining what I think of them. That would help them more than me.',
    'I need to keep a clear head around them. Unfortunately my head has other suggestions.',
    'There is no shortage of danger here. Somehow they still stand out.',
    'I would like this rivalry to stop deciding which direction I look first.',
  ], { relationship: { minGrudge: 40 } }),
  interview('nemesis', ['grudge', 'nemesis'], 'actor', [
    'I am planning around them now. I hate admitting how much that has changed.',
    'I can hear a dozen sensible warnings, and their name is still louder.',
    'This has gone past an argument I can set aside when something else happens.',
    'I need a reason to keep going that does not begin and end with them.',
    'Even this interview feels like time I should be spending watching for them.',
    'I know what this obsession is costing me. Knowing has not been enough to stop it.',
  ], { relationship: { minGrudge: 80 } }),
  interview('revenge', ['revenge'], 'actor', [
    'I had imagined knowing exactly what to say afterward. I do not.',
    'The next hour used to seem very simple when I thought about this.',
    'I need to work out what to do with all the attention I was spending on that.',
    'You can replay the ending. I suspect I will be replaying the beginning.',
    'I thought relief would be easier to recognise.',
    'I would like a little time before anyone calls this closure.',
  ]),
  interview('surviving', ['survival'], 'any', [
    'I keep catching myself saving small complaints for someone who is not here.',
    'I am doing practical things because they give my hands somewhere to put the worry.',
    'There are parts of the day I would happily trade for a chair and an uninteresting view.',
    'I wonder which of these habits I would carry home without noticing.',
    'I have developed very strong opinions about where to sit down.',
    'I tried to remember what I was worried about before this. It sounded rather luxurious.',
  ]),
  interview('loyal', ['assistance', 'alliance'], 'actor', [
    'I do not want people to have to guess whether I mean what I say.',
    'I can be frightened and still be someone they can count on.',
    'I keep thinking about the sort of person I will have to remember being here.',
    'It would be easier to promise less. I have considered that.',
    'I would like my word to be one useful thing this place cannot take out of my hands.',
    'I know loyalty complicates the arithmetic. I was never particularly fond of arithmetic.',
  ], { traits: ['loyal'], relationship: { minTrust: 40, maxGrudge: 39 } }),
  interview('exit', ['elimination'], 'eliminated', [
    'There were ordinary moments in there too. I hope somebody remembers those.',
    'I keep thinking of a completely useless thing I meant to say.',
    'I would prefer to choose my own last sentence. Give me a second.',
    'It is strange how quickly all those urgent plans stop needing me.',
    'If you are editing this, please keep the part where I tried.',
    'I did have a plan for the rest of the day. It was not a particularly good one.',
  ]),
];
