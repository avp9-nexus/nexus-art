# What caught it

A note on a measurement problem we ran into on our own records. It is published because the answer was uncomfortable, and because the question is not ours alone.

## The finding

This project keeps an internal register of falsified claims. Every line records where the error lived, what was asserted, and what is true with the proof. On 11 August 2026 it held 34 lines covering 33 identifiers, built over four months.

Not one of those lines recorded what had caught the error.

The register is kept by someone who writes automated judges for a living, on a corpus whose stated rule is that a claim without its source does not get written. The column that would have said *an instrument found this* or *a person found this* was never there. Nobody noticed, because nobody asked the question until an outside document asked it.

## Why it could not simply be extracted afterwards

The first attempt was a mechanical extraction anchored on verbs of detection. It attributed 9 lines out of 34. The other 25 simply did not say.

The second attempt was a set of three resolvers, each with a different matching strategy. Every one of them flipped at least two of the nine attributions that were already there. One of them read the phrase *"not by a re-reading"* as an attribution to a person. That closed the question: the attribution is not derivable from the prose of the entry, whatever the pattern.

What made the work possible was not in the register. It was in the register's version history. The register is versioned, so each line can be dated to the pass that added it, and that pass points at one journal entry. Read that one entry, and in most cases the trigger is named in it.

**If your register does not record the trigger at write time, you will not recover it from the register. You may recover it from the register's history, if you kept one. You will find that out only when you try.**

## What the classification is worth, which is less than it looks

30 lines out of 34 now carry a value. Four stay undeterminable, because the entry names the fault and its fix and never says what surfaced it. The split is: instrument 21, person 6, third party 2, out of taxonomy 1, undeterminable 4.

Three caveats, and they are the reason this is published as a finding rather than as evidence.

**One classifier.** One person, one pass, no second reader. No disagreement could occur, so none could be counted. The inter-rater agreement here is not good, it does not exist.

**The classifier is the person who made the errors.** Self-recorded, self-classified, in a register whose whole purpose is to resist that failure mode.

**The pointer that made it feasible is derived, and it drifts.** Of the 21 entries that name a detector at all, 7 name it in the entry the pointer designates and 14 name it in the entry before. It points at the pass that wrote the line, not always at the pass that saw the fault. It still cut the reading from an entire journal down to two documents, which is why it is worth keeping even while it drifts.

## The part that travels

A register of errors cannot credit the controls that prevent errors, because a control that works produces no entry at all. It produces a near miss. That observation was sent to a conformity assessment framework and it stands on its own.

This note is its smaller and more awkward companion. An over-instrumented system, run by someone who writes judges all day, could not say what had caught three quarters of its own faults, and did not know it until the question was asked out loud. If that is the state here, the question is worth asking wherever an error log is offered as evidence that controls work: **does your register record what caught each entry, or only what was wrong?**

We are not offering this as proof of anything. As proof it would weaken the original observation, since a self-classified register is exactly the kind of evidence that observation warns against. As a finding it holds: this is what happens when you try to classify your own register, and it is cheaper to learn it from us than from an audit.

## Figures and dates

Everything here is a dated snapshot of an active project. The internal register held 17 entries on 30 July 2026, 26 on 5 August, 32 on 10 August and 34 on 11 August. It will keep growing, and the growth measures how much is being checked rather than how much is breaking. The published corrections that a reader can verify in this repository are in [CORRECTIONS.md](CORRECTIONS.md).
