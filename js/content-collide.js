/* Landfall — two at once (Lachlan, 2026-11-15: threads should pop off together and press the player; DESIGN.md
   "Pressure"). When two threads are pressing in the same season, the colony hasn't the people for both: the player
   puts everything on one, and the other is neglected. A neglected thread comes back sooner and harder (threads.js:
   its beats weigh three times as much and it drains morale for three months); the one attended to eases off.
   Three options (Lachlan, 2026-11-21: three at most): one for each thread, and the curfew that holds both. No DOM. */
(function () {
'use strict';
const { add, h } = LF; const { N, Nc, F } = h;
const cap1 = x => x.charAt(0).toUpperCase() + x.slice(1);
/* Live threads the colony has a name for, the most recently active first. */
const named = s => Object.keys(s.threads || {}).filter(id => { const t = s.threads[id], d = LF.THREADS[id];
  return t.on && !t.end && !['latent', 'quiet', 'after'].includes(t.phase) && d && d.called && d.called(s, t) && !(t.focus && s.day - t.focus < 60); })
  .sort((a, b) => ((s.threads[b].last || {}).d || s.threads[b].since || 0) - ((s.threads[a].last || {}).d || s.threads[a].since || 0));
const nm = (s, id) => LF.THREADS[id].called(s, s.threads[id]);
const attend = (id, on) => s2 => { const t = LF.T(s2, id); if (!t) return; if (on) { t.focus = s2.day; t.neglect = 0; } else t.neglect = s2.day; };
const voice = (s, seat, fall) => { const p = LF.officer(s, seat); return p && LF.seatState(s, seat) === 'here' ? p.first : fall; };

add({ id: 'col.two', view: 'people', arc: 'collide', tone: 'crisis', title: 'Two at Once', w: 6, gap: 50, repeat: 110,
  when: s => s.day >= 90 && named(s).length >= 2,
  setup: s => { const [a, b] = named(s); return { a, b, an: nm(s, a), bn: nm(s, b), why: `${nm(s, a)} and ${nm(s, b)} both came to a head in the same season` }; },
  text: (s, c) => `${cap1(c.an)}, and ${c.bn}, in the same month. There are ${LF.num(LF.heads(s))} people and one watch, and every one of them is already doing two jobs.\n\n${voice(s, 'security', LF.h.Nwc(s, 'security'))} wants every spare hand on ${c.an}. ${voice(s, 'doctor', LF.h.Nwc(s, 'doctor'))} wants them on ${c.bn}.\n\n[[command]] "There are hands for one of these and not for both, so pick one, and I'll have the roster changed before supper." "Whichever one you leave will cost us people, and I'll be the one who counts them."`,
  choices: [
    { label: (s, c) => `Everything on ${c.an}`, note: (s, c) => `${cap1(c.bn)} gets nobody for a season, and it won't wait.`, hint: 'unknown', info: (s, c) => [['yield', cap1(c.an) + ' eases'], ['danger', cap1(c.bn) + ', left alone']],
      out: { text: (s, c) => `Every crew that can be spared goes onto ${c.an}. Nobody is watching ${c.bn}. Everyone knows it.`, fx: (s, c) => ({ tension: 6, do: s2 => { attend(c.a, true)(s2); attend(c.b, false)(s2); } }) } },
    { label: (s, c) => `Everything on ${c.bn}`, note: (s, c) => `${cap1(c.an)} gets nobody for a season, and it won't wait.`, hint: 'unknown', info: (s, c) => [['yield', cap1(c.bn) + ' eases'], ['danger', cap1(c.an) + ', left alone']],
      out: { text: (s, c) => `Every crew that can be spared goes onto ${c.bn}. Nobody is watching ${c.an}. Everyone knows it.`, fx: (s, c) => ({ tension: 6, do: s2 => { attend(c.b, true)(s2); attend(c.a, false)(s2); } }) } },
    { label: 'Lock the colony down until both are over', dark: true, note: 'A curfew, a pass to be outside after dark, a ration cut for anyone without one, and an informer in every pod. Both stop moving. So does everyone.', hint: 'unknown', info: [['yield', 'Both held still'], ['danger', 'Everyone, and whoever breaks the curfew']],
      out: { text: (s, c) => `The curfew bell goes at dusk. The passes are printed by the next morning, and the first informer's report is on your desk by the evening. Two people are shot by the watch in the first fortnight for being out without a pass. ${cap1(c.an)} and ${c.bn} both go quiet. So does the mess hall.`,
        fx: (s, c) => ({ pop: -2, morale: -7, tension: -10, stain: ['lockdown', 2], do: s2 => { attend(c.a, true)(s2); attend(c.b, true)(s2); for (const id of [c.a, c.b]) s2.arcLast['th.' + id] = s2.day; LF.emit(s2, 'confinement', 'col.two', 50, 120, 'the colony is under curfew'); LF.emit(s2, 'suspicion', 'col.two', 40, 180, 'there is an informer in every pod'); } }) } },
  ] });
LF.TAGS['col.two'] = ['', '', 'order severe closed'];
Object.assign(LF.DEEDS || {}, { lockdown: 'the curfew, and the two shot for breaking it', hanged_for_both: 'the clerk hanged for two things nobody did' });
LF.ARC_VIEW.collide = 'people';
})();
