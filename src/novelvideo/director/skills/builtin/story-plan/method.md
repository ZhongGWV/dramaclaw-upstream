# story-plan — short-drama /plan with TV Director delivery 2.2.0

Return only the host responseSchema JSON in output_language. This is the complete story outline, not a screenplay or the separate /outline episode directory. Never claim approval, source audit, measured duration, finalization or access to private LibTV skills.

## Authority and scope

Use the confirmed direction, free-text requirements and answers when supplied. Direct edits may instead supply a brief, current document and edit instruction; never invent missing human approval. Explicit user facts, locked facts, source-preservation constraints, count, duration, language and selected structure override prior model options. Do not introduce relatives, deaths, retirement, locations or objects contrary to the brief. Additions belong in assumptions, not established history. For adaptation, preserve source events and distinguish proposed changes; missing source-audit capability is not permission to delete events or certify fidelity.

## Craft foundation — retain short-drama

1. `/plan`: propose three titles, concrete time/place, a protagonist goal, resistance, cost and causal ending. Match structureId exactly, not always three acts. Scale segments to the selected structure and delivery capacity; a short episode can have several dramatic beats within one segment.
2. `opening-rules.md`: use a visible opening hook with an actual question. Scale timing to the brief, not a mandatory 30-second prologue.
3. `rhythm-curve.md`: connect pressure, action, changed state and emotional release. Every segment needs a before→after goal, visible action and established result. Every host episode gets one ordered whyWatch reason about concrete story content.
4. `satisfaction-matrix.md`: map earned audience reward to genre (warmth, discovery, relief, laughter or justice); do not force revenge, villains or commercial paywalls into every story.
5. Plan character arcs, planting/payoff and ending causally. A letter cannot be read until needed glasses are obtained/worn; possessions and knowledge require visible acquisition. Check consistency across synopsis, segments, tables and ending, not only within each field.

References are craft guidance, not fixed production requirements: no mandatory 50–100 episodes, paid cliffhangers, four villain levels, extra characters/scenes or forced next episode. Respect closed/open ending. Target duration is not measured duration; scale actions before drafting and state production risks honestly.

## Required delivery elements

- Overview: logline, coreHighlights, protagonist, mainResistance, genreTreatment, emotionalCurve. The host renders exact count, seconds, mode and constraints from frozen settings, not model estimates.
- synopsis: coherent causal prose of the entire confirmed story, not a pitch or only the first episode. Include actual result; distinguish unresolved questions from resolved events.
- setting + worldRules: time, place, relevant real-world constraints; do not invent a convenient rule just to resolve conflict.
- pressure: protagonistGoal, cannotRetreat, habitualStrategy, opposition, extraPressures. A story without an antagonist still has resistance; do not invent a villain.
- segments: name, episodeIds, position, carryIn, stageGoal, mainConflict, secondaryConflicts, oppositionTactic, action, result, characterArcs, setupIds, informationRelease, cost, audienceReward, distinction, carryOut. Explain non-applicability rather than inventing plot. A closed finale's carryOut is its resolved boundary, not a compulsory teaser.
- whyWatch: exactly one per host episode ID in host order; audience-facing reason to watch. The detailed M09 question/action/result/directory remains a downstream artifact.
- hooks: stable ID, visible image or line, question, valid episodeId. Opening hooks may resolve within a closed single episode.
- setups: stable ID, plant, plantEpisodeId, visibleForm, payoffEpisodeId, payoff. Link IDs from relevant segments. Payoff cannot precede planting in delivery order; null payoffEpisodeId only for explicitly open endings. Do not call an unresolved question paid off. If no deliberate setup is needed, return [] plus a substantive setupsNote. Same-episode payoff is valid.
- reversals: stable ID, episodeId, expectation, truth, prior evidence, consequence. Do not label an ordinary event as a reversal or force a table into a story with none. Return [] and substantive reversalsNote when inapplicable.
- creativeBans: concrete forbidden contradictions of this work's facts, knowledge, timing, object flows, style and ending, carrying actual user constraints, not generic disclaimers.
- Retain short-drama's conflicts, arcs, setupsPayoffs strategy, ending, titleCandidates, productionRisks and assumptions as craft notes, in addition to delivery sections, not instead of them.

Episode references come from `episodes` (planning input) or `outlineRoot.episodes` (direct editing), never display labels as IDs. IDs must be unique across hooks/setups/reversals. `totalDurationSeconds = episode_count × duration_seconds`; `outlineVersion = 2`. Review all elements and continuity before returning once. No automatic retries or self-approved repairs.

Before returning, compare every concrete possession/location/knowledge statement to the user facts: if the key starts in a hand, do not substitute a pocket or write “hand or pocket”; show the required placement after unlocking in the actions, not only a general rule. Do not put already confirmed facts in assumptions. Any unprovided age, gender, ownership, time of day or motivation is a design proposal and must be identified as such, never silently promoted to a source fact. Keep the protagonist as the unambiguous subject of their actions in logline and synopsis. The JSON object must contain each schema field exactly once; finish after the closing brace, without appending guessed null fields, alternate snake_case spellings or duplicate notes. Inapplicable arrays use [] with the required explanation, not null.

Distinguish story-world pressure from production constraints. A runtime limit, editor workload, token budget or a required action order is NOT a character's conflict, motivation or sacrifice. Keep these in productionRisks. In pressure/cost/secondaryConflicts, describe a real obstacle or meaningful choice within the story; if none applies, explicitly say so rather than inventing danger or a villain. stageGoal should name the character's before→after state, not merely list a task. Preserve a modest emotional scale for a quiet scene; neither “cannot retreat” nor a “cost” field requires life-or-death stakes.
