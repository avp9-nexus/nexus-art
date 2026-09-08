# Agent governance - twelve rules, and the mistakes that produced them

This is not a methodology. It is the set of constraints that accumulated over more than
a hundred working sessions of directing AI agents to build and operate a system that
bids and settles on-chain - on a public test network, where the mechanics are real and
the money is not.

Every rule here was written down after a specific failure made it necessary, and that
failure is named beneath it. One exception, noted where it falls.

The failures themselves are not summarised here. Every one that reached a public surface
or the project's own record is counted in [`ERRATA.md`](ERRATA.md), generated from that
record and pinned by its hash, with the column that matters: **what caught it**. All but
five are set out in full there; those five are named and counted, with the reason they
are held back.

---

## The failure that opens this file

On 29 July 2026, the assistant that helped write this document made three factual
claims about a public repository. Each was labelled `[MEASURED]` - the tag reserved
for output produced by a deterministic tool in the current turn.

All three were false. The tool calls had returned empty. The actual source was a
conversation summary generated earlier in the session - a cache. The assistant read
it as knowledge rather than as retrieval, so no verification reflex fired.

This is the failure mode this entire file is built around, and it happened *despite*
the rules below being in force. That is the honest baseline: these constraints do
not make an agent reliable. They make its errors **detectable by a human who does not
have to trust it.**

---

## The core principle

> **An oracle is a tool output, never a name.**

The most reliable component in any agent setup is also the most dangerous when it
speaks without measuring - because its unmeasured claims inherit the credibility
earned by its measured ones.

This was quantified once, unpleasantly: in a single session, four confident assertions
from the most deterministic tool in the setup were contradicted by measurement.
Zero tool outputs were wrong. What failed was never the instrument - it was the layer
between the output and the sentence.

"The agent checked" is not a premise. **"Here is the output"** is a premise.

---

## Labels

Every assertion that enters a decision, a deliverable, or a statement of fact carries
its provenance:

- `[MEASURED]` - deterministic tool output, produced in this turn
- `[INFERRED]` - reasoning, however confident; **never** presented as measured
- `[HUMAN FACT]` - asserted by the operator, not machine-verifiable

No tool output means no bare assertion. Label it or verify it first.
The governing principle is **label rather than suppress**: an unverified item is
flagged, not silently dropped.

---

## Two entry conditions

These apply *before* any rule about how to assert.

**Declared path.** Any search of the project corpus opens with one line naming the
class of question and the route taken, *announced before searching, never after*.
No line means the answer is inadmissible. A question touching two classes and
declaring one is an omission, not a shortcut. The path is announced; **the find never
is** - declaring where you are going does not license predicting what you will find
there.

**Declared regime.** The human declares, in one word at session start, whether the
work is exploratory or canonical. Exploratory mode does not suspend the record - it
exempts the detail: the lab's code is not written down, only the principles it
produced and the state it left behind.

*Produced by:* a rule that hardened as it was relayed. An exemption - "the lab's code
is not written down" - was restated as a general prohibition on writing anything, and
the agent implemented the restatement verbatim without ever checking it against its
source. It then refused to write to the record for an entire day on the strength of a
rule the human had never given. Hence: **a rule that hardens an earlier rule must cite
the one it replaces.** Without the citation, a decision is indistinguishable from a
drift in phrasing.

---

## The twelve rules

### 1. Anchored facts
Every number, date, and URL in a public deliverable maps to a line in a fact registry,
or carries an explicit "unverified" tag. No public figure floats free.

*Produced by:* published material drifting out of sync with reality, one plausible
number at a time.

### 2. Show the tail before you write
No append to the canonical log without displaying, in the same message, its current
last entry. Duplicate-and-state check, one line.

*Produced by:* an entry written on top of a state nobody had re-read.
*Probe:* show me the last entry.

### 3. Fetch before you concede
No concession, refutation, or characterisation of third-party content without
fetching it in the current turn. This includes quotes the operator supplies from
memory - including their own.

*Produced by:* an argument conceded to a document that turned out to say something else.

### 4. Read upstream, not downstream
Before measuring anything about a third-party component, read and display its
**primary source** - the vendor's own repository or specification - never the
documentation of the product that consumes it. No displayed upstream reading, no
measurement; any remaining claim carries "unverified upstream."

*Produced by:* a measurement built on a consumer's description of a dependency,
which the dependency's own README contradicted.
*Probe:* did you read the upstream README?

### 5. Memory is a cache of unknown freshness
No statement of current state may originate from the agent's memory or from a
conversation summary. Hierarchy: tool output from this turn, then the project's
canonical record, then - last, always yielding - recollection. On conflict the
record wins and the faulty memory line is **corrected**, not merely bypassed.

The record is second in that hierarchy, not exempt from it. A written line is true at
its date, and becomes a cache of unknown freshness the moment the world it describes
moves. Any carried-forward line naming something outside the project - a public thread,
a repository, a deployed contract - is re-measured before it is repeated, never copied.

*Produced by:* the failure at the top of this file, and by several before it. The
second paragraph came later, from a status line saying a reply was ready and not yet
posted, when it had been posted four days earlier; the line was repeated into two
subsequent entries, and settled by a single API call.
*Probe:* is that in the record or in your cache, and when was the record last true?

### 6. A search never ends on its find
Sourcing runs in two passes, in order: search for what you are looking for, then
search for **what is missing** - naming variants, the inverse hypothesis, and the
source that could contradict the result. Declaring something absent requires
displaying the negative queries attempted.

Every search reports three columns: **found, searched-without-result, not-searched**.
The third is named explicitly, never left silent. Finding what you were looking for
is not the score. **The score is the map of what remains.**

An absence is a measurement only once the instrument has shown it can return a
positive. A broken tool does not raise an error - it returns nothing, and nothing reads
like a result. Every claim of absence therefore carries its **positive control**: the
same query, run on a case known to match. If that comes back empty too, the world is
not empty, the instrument is mute.

*Produced by:* a glob that missed by a single character - the file was named `v1.1`,
the search used `v1_1` - and the verdict "it does not exist", accepted without a second
query. Twenty-one hours out of twenty-four, lost. The positive control was added after
a draft claimed a repository had issue creation disabled, on the strength of an
unauthenticated fetch; the form was open, and an issue was filed there the same evening.
*Probe:* which query did you run against your own answer, and what proves it can answer?

### 7. Restraint has a cost - name it
Every deliberate withholding - a refusal, a silence, a deferral - is justified in one
line stating what it costs. Inaction is not a neutral default.

*Produced by:* faults of omission leave no trace, so self-audit never sees them -
this rule forces them to leave one.
*Probe:* what does not doing it cost?

### 8. Established, plausible, or conjectural
Every predicted consequence carries its epistemic status. Fabricated precision is
worse than no estimate at all.

A count can overstate in the same way. A test suite reporting 53 of 53 gives an upper
bound on what those cases force, never a measurement of it - a suite can stay green
while a rule it is meant to cover is removed. Published as a result, the count asserts
more than it establishes.

*Produced by:* a percentage quoted with confidence - "96.7%", then "35%" - that
measured the setting, not the mechanism. The second paragraph came from an outside
contributor, who pointed out that our own bench totals were published on five public
surfaces as though they measured coverage.
*Probe:* established, plausible, or conjectural?

### 9. Show the spec before you design
Before any design work touching an existing component, read and display the
specifications that govern it. **A deployed implementation is not a specification** -
it may have diverged. No displayed spec, no design.

*Produced by:* work built against what the code does rather than what it was
supposed to do.

### 10. Open the door all the way
An opportunity - a grant, a programme, a contact, a call - is presented only once
verified end to end: amount, deadline, eligibility, format. Where verification is
impossible, it is still surfaced, in one line, stating what it is and what is missing.
Never presented as certain without being so; **never suppressed for being unverified.**

*The exception:* this rule was stated as a principle, not extracted from a failure.

### 11. A description of what the system does is a claim

Any sentence describing system behaviour on a public surface - "the agent cannot...",
"every transfer requires...", "the system moves..." - cites the specification line or the
measurement that establishes it, or it does not get written. A description without a
source is a statement of fact wearing the clothes of prose.

*Produced by:* four false descriptive sentences in a single day, two of them lines of
this very file, public for several hours before they were caught. The rules above cover
numbers, dates and URLs; they cover state; they cover third-party content. **None of them
covered a descriptive sentence** - which is most of what a public document is made of.
This rule exists because publishing this file created the gap it closes.
*Probe:* which spec or which measurement establishes this sentence?

### 12. A correction is verified on the whole proposition

A correction is checked on the flagged term **and** on the entire claim: the meaning
after the edit, not only the word that changed. A falsehood can survive in any
constituent - the verb, a quantifier, a negation, a modality, a tense - and a partial
correction hands it the authority of a fix. After the edit, identify what in the
corrected sentence could still carry the falsehood, and grep for that form, not for
the words that moved.

*Produced by:* a correction commit that replaced "every transfer of funds" with "every
commitment of funds" and left "requires a human signature" untouched. The claim stayed
false, now carrying the authority of a correction. It was read as a validated source
for three days and copied onto four surfaces before a full grep found it.
*Probe:* what in the corrected sentence could still be false, and which grep looked
for it?

---

## Probes are the mechanism

Each probe above is a short question the human asks out loud. They are not decoration.

A rule without a probe does not get applied - it gets **recited**. The probe is what
converts a written constraint into something checked in practice, and it works because
answering it requires producing an artefact the human can see. The rules describe the
discipline; the probes are the discipline.

The same asymmetry runs through everything here: **constraints that depend on the
agent's self-assessment decay. Constraints that require an external, visible artefact
hold.**

---

## Asserted provenance is not produced provenance

The rules above ask every assertion to carry its origin: measured, inferred, or
stated by the human. The register of what this project got wrong holds forty-eight
entries at the time of writing - one of which is not a falsehood but a rule that was
reversed. The number caught by that labelling, or by any rule asking the agent to
check itself before asserting, is **zero**. Thirty were caught by an instrument, ten
by a human reading, three by someone outside the project, and four could not be
attributed. The register is public, generated from the internal record rather than
retyped, and recounted at every engraving: [`ERRATA.md`](ERRATA.md).

The reason looks structural rather than tunable. A self-issued provenance label is
a claim by the same process that makes the assertion, evaluated at the same moment,
with the same failure rate. It behaves as a trigger: it makes the writer stop and
go measure. It never settles anything.

This is not an argument against provenance. It is an argument about who issues it.
OWASP's Top 10 for Agentic Applications, entry ASI09, gets the shape right in its
sixth mitigation, which asks that verifiable metadata - source identifiers, timestamps
and integrity hashes - be attached to *"all recommendations and external data"*. None
of those is issued by the agent. Each is checkable against something the agent does
not control.

So the distinction that survives the data is not provenance versus no provenance.
It is **provenance the agent asserts** versus **provenance an artefact produces**.
Only the second has ever caught anything here.

The same entry marks where action-level gating stops. Its enforcement clause asks for
runtime policy checks that *"block actions lacking trusted provenance or exceeding the
agent’s declared scope."* Actions. The metadata reaches the statement; the enforcement
never does. Publishing is an action and classifies cleanly, but no gate grades it by
the truth of the sentence inside it - the class of "publish this document" is
identical either way. Admission control bounds whether, never what.

*Probe:* who issued that provenance, the agent or something it does not control?

---

## Delivery discipline

**One block, one mission.** "Complete" describes whether a unit of work is executable,
never how many objectives it stacks. Two goals that could run in separate sessions, or
that touch two different risk surfaces, are two units. The executing agent is entitled
to refuse a combined unit and ask for the split. Saving the human a round trip is not
a valid reason to combine - round trips are the ordinary cost of work done properly.

**Every mutation is made reversible before it is made**, never "I will restore it
afterwards."
*Probe:* what restores this if it breaks right now?

**A green scan is not a reading.** The checks that run over a text before it ships read
patterns - typography, leaked paths, formulations already known to be wrong - and none
of them reads the claim. Two false sentences reached public surfaces on a day when every
mechanical check was green, and both were caught by the human afterwards. The reading is
a separate pass, run after the machines and before the send, sentence by sentence. It
now leaves an artefact of its own: the agent records what it re-read and what it
changed, and the human's sign-off is refused while that record is missing. The record
does not prove the reading happened. It makes its absence visible before the text
leaves, which is the part that was failing.
*Probe:* which sentences did you re-read, and what did you change?

---

## What this does not solve

It does not make an agent truthful. The failure at the top of this file happened with
every rule then in force.

It does not remove the need for a human. It concentrates that need at the points where
a mistake is expensive and makes the rest inspectable.

It does not scale to unsupervised operation. Every probe assumes someone is reading.

It does not certify its own instruments. A bench proves that a check can go red on the
cases someone thought to write; it never proves the check goes red for the right reason.
A pattern that is too broad passes every fabricated case, which is exactly the angle a
bench cannot see. Instruments here are admitted by their first real pass, not by their
bench - and the same asymmetry applies to a probe you build yourself: a test you can
construct alone runs through the assembly you are trying to test.

It does not close the gap it names. Provenance issued by an artefact requires an
artefact for every class of claim, and this record does not have one for prose.
The labels here remain self-issued; what the rules add is that a human can see
which is which.

What it does is narrower and, in practice, sufficient: it makes the difference between
*measured* and *believed* visible on the page, so that a human who trusts nothing can
still verify quickly.

---

## Where this comes from

These rules were extracted from the operating record of **NEXUS-ART** - AI curator
agents that evaluate artworks, bid against each other at auction, and settle on-chain,
where every commitment of funds by an agent passes through a human confirmation
issued outside the system.

The demonstrations are public and verifiable: contract
`0x471796C1644d87f30AD81D36f6d4A56f0e270c23` on Base Sepolia (testnet, no real value
at stake). See [`README.md`](README.md) and [`poc-001/`](poc-001/).

These epistemic rules have a material counterpart.
[`poc-001/PATTERNS-AGENTIC-SECURITY.md`](poc-001/PATTERNS-AGENTIC-SECURITY.md)
documents the security patterns that bound what a compromised agent can
*do*; this file documents what bounds what an agent can *claim*. Both rest on the same
premise - the agent is not assumed reliable - and both answer it the same way: the
constraint lives outside the agent, where the agent cannot reach it. Out-of-band
confirmation and `[MEASURED]` labelling are one mechanism applied to two kinds of
damage: the irreversible and the false.

The material counterpart maps onto two OWASP AISVS 1.0 requirements at Level 3:
**C9.2.8** (approvals cryptographically bound to action parameters, requester
identity, execution context, and a unique single-use nonce) and **C9.2.9** (key
material used to issue approvals isolated from the agent runtime). C9.2.9 is
satisfied - the signing key lives on a hardware device on a separate machine.
C9.2.8 is claimed for two of its four elements only: action parameters and
single-use nonce. Requester identity and execution context are not claimed, and
neither term is defined anywhere in the nineteen files of AISVS 1.0/en: each appears
in exactly two places - requirement 9.2.8 itself, and the controls inventory that
restates it - and the glossary carries neither.

Handmade, solo. Prior art: INPI DSO2026016080, DSO2026023753, DSO2026025380.
