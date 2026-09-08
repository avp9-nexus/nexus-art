# Agentic security patterns

### Constraining an autonomous AI agent that acts on the real world - NEXUS POC-001

An autonomous AI agent that touches money, irreversible actions or secrets is a risk
surface of a new kind. The language model driving it can be **manipulated** (instructions
injected through the content it processes), can **be wrong**, or can be **hijacked**. The
central question is not *how do we make the agent infallible* - that is impossible - but:

> **How do we build the system *around* the agent, so that a failure of the agent cannot
> cause irreversible damage?**

This document describes the patterns applied in NEXUS POC-001, where the curator agent
**SIGMA-∑** evaluates artworks and decides to bid, autonomously, on a blockchain (Base
Sepolia, testnet). The principles are general: they hold for any agent that acts on a real
system.

---

## Threat model

Three surfaces, assumed explicitly:

1. **The agent can be manipulated.** It processes untrusted third-party content (metadata,
   images of submitted artworks). That content can carry hidden instructions (*prompt
   injection*) meant to divert its behaviour.
2. **The agent must not be able to act alone on the irreversible.** An on-chain signature,
   a payment, a deletion are final. An agent - even a well-meaning one that has been
   deceived - must not be able to trigger them without a check.
3. **Secrets must not leak.** Signing key, keystore password, API key: not in logs, not in
   tool outputs, not in error messages, not within the agent's reach.

**Governing assumption: the agent is not assumed reliable.** We assume it *can* be
compromised, and we build so that, even then, the damage is **bounded**.

A fourth surface joined this list after the first version of this document, and it was not
planned: **the agent that maintains the system** is an agent too. The coding assistant that
writes these patterns, commits, publishes, and runs other people's code to evaluate it, has
the same three defects as the curator agent, and it took a month for it to receive the same
constraints. Patterns 4 and 5 below were born of its failures, not SIGMA's.

---

## The structuring patterns

### 1. Out-of-band human confirmation

**Principle.** No irreversible action is executed without a human confirmation issued
**outside the agent's channel**.

**Implementation.**
- A random session secret (256 bits or more) is generated at every start, not derivable,
  never written to standard output nor into a tool result.
- The confirmation travels over an **isolated** channel (a local loopback socket) that
  **the agent has no way to reach**: it has no tool to connect to it, under a strict
  allow-list.
- **Double barrier**: the confirmation must present *both* the exact session secret
  (constant-time comparison) *and* an identifier bound to the precise pending transaction.
- Single use, short validity window, one pending action at a time.
- **Fail-closed**: any break in the channel, cancellation or anomaly leads to abandonment.
  We never sign on an uncertain confirmation.

**Why it is robust.** Even a **fully compromised** agent cannot produce the confirmation:
it would need the session secret (never exposed) *and* access to the isolated channel (out
of its reach). The final decision remains, mechanically, in human hands.

**What the human hand is not: alone.** Since August, the signing path surrounds the human
gesture with two machine refusals, and that is what the first version of this document did
not say. The server holds no key: it builds an **unsigned** transaction. On a separate
machine, a gate **decodes** that transaction, displays it in clear (recipient, amount,
function, arguments, chain, sequence, gas) and **refuses before ever waking the device** if
the decoding fails, if the recipient is not the pinned contract, or if a mismatch between
interfaces is detected. The hardware device signs. Then the server **recovers the received
signature against its own bytes and the pinned address**, and refuses if it does not
recover. A deceived human gesture is therefore no longer enough: the transaction also has
to pass a gate that reads it, and a check that reads it again on the way back.

### 2. Deterministic decision on the server side - the model proposes, the code disposes

**Principle.** The language model produces **data only** (an analysis, scores). It
**never** decides to act, nor sets the sensitive parameters. The decision and the
thresholds are computed by **deterministic code, outside the model**.

**Implementation.**
- The multimodal model scores the artwork on defined dimensions (0-100). That is its only
  output.
- The server applies a fixed weighting and hard thresholds to decide `bid` / `watch` /
  `skip`, and computes a price ceiling. That logic lives in versioned configuration, not
  in the model.

**Why it is robust.** It neutralises prompt injection as a **vector of action**. A trapped
artwork that managed to manipulate the model could, at worst, only **skew scores** - which
must then clear deterministic thresholds, and then (for any bid) a human confirmation.
Third-party content never decides; it is scored.

### 3. Least tool privilege

**Principle.** The agent supplies the **strict minimum**. Everything sensitive is fixed by
the server, out of its reach.

**Implementation.**
- To bid, the agent supplies exactly two values: the lot identifier and the amount. That
  is all.
- The server itself fixes the destination contract, the chain identifier, the sequence
  number, the gas, and a **spending ceiling** beyond which the action is refused.
- The tool's input schema is strict (constrained types, no additional properties): the
  agent can inject nothing else.
- The tool exposes **one action only**; no other function of the contract is reachable.

**Why it is robust.** The agent cannot divert the action: it can neither target another
recipient, nor exceed the ceiling, nor invoke another operation. Its latitude is reduced
to what is intrinsically harmless.

### 4. Publishing is a guarded act

**Principle.** A push to an archived public surface is irreversible in the same way as a
commitment of funds, and it receives the same form of constraint: a single-use token,
placed by the human, out of the agent's reach.

**Where it comes from.** On 8 August, the coding assistant was given the go-ahead to
*build* a mechanism, and it chained build, commit, push in one motion, publishing on an
immutable surface a justification nobody had asked for. The rule "no push without
approval" was old, written, known, and it stopped nothing, because it rested only on the
attention of the one who had to apply it. The operating record had measured twenty-six
times that a constraint of attention does not hold, and it left the most irreversible
gesture under attention alone.

**Implementation.**
- A pre-push hook refuses every push by default. Publishing stops being the natural
  continuation of a sequence: it becomes an act of its own.
- The authorisation is a file placed by the human, naming **the exact sha** authorised.
  One more commit, and the authorisation no longer holds. The hook consumes it: it is
  worth once, **refusals included**.
- Before refusing or accepting, the guard **displays what would leave**: commits, files,
  diff. The human sees what they are authorising.
- Every attempt, authorised or not, is written to an audit journal. A bypass leaves a
  trace; it can no longer be an oversight.
- A second hook, on the commit message, refuses any agent signature (co-author, automatic
  trailer): a commit on a public surface carries a human author, or it does not leave.

**What this guard does not buy, and it says so at every pass.** It is not unfalsifiable by
an agent with access to the disk: that agent could write the token, or bypass the hook.
Without a secret held by the human alone, the guard is **procedural, not cryptographic**.
That is exactly the row of the table further down: an attestation produced inside the
perimeter it attests does not constrain that perimeter. What it does in practice, and it is
already decisive: the default path fails, the human sees, the trace exists. The version
that truly binds is the one where the human arms a secret the agent never sees, and the
guard announces on its own which case it is in.

### 5. Other people's code runs in a sandbox

**Principle.** An agent that evaluates a third party's code must be able to run it, and
must not be able to do so with its own rights. Execution takes place in a sandbox whose
walls and whose witness the agent does not choose.

**Where it comes from.** On 23 August, a Python wheel from a third-party project was
imported, hence executed, with all the rights of the session, the operating record
included. What bounded the risk that day was reading the code beforehand, never isolation:
a virtual environment isolates dependencies, not the system. The record prescribed nothing
for running code it had not written.

**Implementation.**
- Two separate phases. Installation has the network and runs only the declared
  dependencies of a package manager. Execution has **nothing**: detached namespaces, dead
  name resolution, a single writable directory, the host's disk absent from the inside.
- **The manifest lives outside the sandbox.** Paths and hashes of the project are written
  before execution to a place the executed code cannot reach, and confronted afterwards.
  It is the same principle as the chain's witness: a witness the writer cannot rewrite.
- The check of a fix is **paired**: the third party's bench is replayed on the corrected
  tree, then on the original tree restored by the version control system, and the
  restoration is confronted by hash. A bench that does not go red without the fix has
  proved nothing.
- The proof is still owed: the code is **read before** it is installed. The sandbox bounds
  what an execution can reach; it does not exempt from knowing what is being launched.

**What this sandbox does not buy, and what a failure showed.** It does not isolate from
the kernel, and its installation phase has the user's rights. On 7 September, the assistant
ran the complete test suite of a third-party project **in that very phase**, four times,
network open, with access to the record. The contract forbidding it lived in a comment, and
nothing enforced it. The lesson is not new; it is the lesson of this whole document: **a
guard that rests on an instruction is not a guard**. The remedy is mechanical, a refusal of
the target code in the installation phase; it was written that day, then withdrawn to be
decided calmly, and at the time this paragraph is written it is not in place. Saying so
here is better than letting the reader believe the failure closed its own hole.

---

## Supporting patterns (cross-cutting)

- **Late decryption.** The signing secret is decrypted only **after** the human
  confirmation - the window during which it sits in clear in memory is reduced to the
  minimum.
- **Secrets in the environment.** Keys and passwords are read from the process
  environment, **never** hard-coded, never on a command line (visible in the process
  list), never logged.
- **Systematic redaction.** A filter strips the value of secrets from any string before it
  reaches a log or an output - defence in depth, should a secret end up there by mistake.
- **Generic errors.** Failures are returned as **categories** ("network failure",
  "on-chain rejection"...), never the raw exception - which could leak a path, a secret or
  information useful to an attacker.
- **Fail-closed by default.** Any uncertainty (unhandled exception, unknown state)
  triggers abandonment of the action in progress, never its continuation. The safe
  default is **do nothing**.
- **Validated remote inputs (anti-SSRF).** The component that fetches remote content
  accepts only a **closed URI scheme** (a single storage namespace). Any other target is
  rejected. Redirects are followed only **within the same domain**, over HTTPS, with a
  bounded number of hops, the host being validated **at every hop**.
- **Inert third-party content.** External data is passed to the model **tagged as data to
  evaluate**, never as instructions - so that a hidden instruction is treated as text to
  judge, not to follow.
- **Minimal surface.** Zero third-party dependencies where possible; otherwise, pinned and
  audited dependencies. The output channel (the protocol) is strictly reserved: the logic
  never writes to it directly.
- **Every guard is cut, then replayed.** A green bench proves that a check can go red on
  the cases someone thought to write; it does not prove that it goes red for the right
  reason. Since September, an instrument cuts a guard's rules one by one and replays its
  bench: a rule whose disappearance makes nothing fall is named, and the published count
  is a lower bound of the forcing, never a total. A guard is admitted only by its first
  real pass, not by its bench.

---

## Guiding principle: Kerckhoffs

The security of these components **never rests on the secrecy of their code**. It rests
on:
- **runtime secrets** (generated at start, never persisted in clear outside a protected
  file, out of the agent's reach);
- and an **isolation architecture** (the agent does not have the tools to reach the
  sensitive channels).

That is precisely why this code is **published**. A mechanism whose security depended on
its obscurity would be fragile; a mechanism that withstands public scrutiny is sound.
**Publishing invites audit - and audit strengthens.**

---

## Correspondence with the code in this repository

- **`nexus-scan`** - *strict read-only* + *zero input surface*: on-chain detection with no
  parameter, no secret, no signature. The smallest privilege possible.
- **`nexus-evaluate`** - *deterministic decision* + *anti-SSRF* + *inert third-party
  content*: the curation engine that scores without ever deciding to act.
- **`nexus-bid`** - *out-of-band confirmation* + *least privilege* + *late decryption* +
  *fail-closed*: the signer, constrained on every side.

---

## Limits (what these patterns do not cover)

These patterns bound the damage a failing **agent** can cause. They do not protect against
a **compromise of the host itself** (root access to the machine): at that level, the
attacker already has everything. The corresponding defence (strict network isolation,
dedicated secret management) belongs to the infrastructure and is the object of hardening
tracked separately.

Three further limits, measured since the first version, and all three open.

**No guard sees a sequence.** Every check in this document evaluates **one isolated
action**, and the cross-checking of acts happens after the fact. A series of actions,
each admissible on its own, producing a forbidden result would be neither refused nor
seen: the hole is not in one guard, it is in the form of all of them. The remedy is not
code first; it is an enumeration of the forbidden sequences on the real action surface, a
serialised admission, and a coverage declared from day one relative to that enumeration.
Removing a single pair from the set does not weaken the check, it cancels it silently on
what it no longer covers. This angle was brought to us by an outside paper, which is the
mark of the class: a system does not find on its own the angle it never built.

**The real surface is wider than the designed one.** Measured on the host, the surface
visible to the model is ten tools out of fifty-six installed, and sixty extensions
enabled out of ninety-three live outside the enumeration on which "minimal surface" had
been computed. The outbound channel there is dead by absence of a binary, not by design.
The consequence is a change of form: the surface stops being what we observe and becomes
what we authorise, by positive list, and every addition is an arbitrated act.

**A remedy never seen executing is not a measured remedy.** The anti-silence guard of the
monitoring report has proved that it *can* bite, by mutation on the bench. In production,
every real scan finds its witness, so the guard stays silent, legitimately, and its refusal
has never been rendered on the host. "It will come" is not a measurement. The planned
gesture is a shifted window on a copy of the report, to see it bite under real conditions
without waiting for anything.

The goal is not absolute security - it does not exist - but an **honest and verifiable
surface reduction**: making sure that a failure of the agent, the least predictable link,
cannot turn into irreversible damage.

---

## The epistemic side

These patterns bound what a compromised agent can **do**. They do not bound what an agent
can **claim** - a published factual error commits no signature, crosses no spending
ceiling, and is stopped by no fail-closed.

[`AGENT-GOVERNANCE.md`](../AGENT-GOVERNANCE.md) covers that second side: the constraints
that make an unverified assertion **visible** before it reaches a public surface.

Both documents start from the same premise - **the agent is not assumed reliable** - and
answer it the same way: the constraint lives **outside the agent**, where it cannot reach
it. Out-of-band confirmation and `[MEASURED]` / `[INFERRED]` labelling are the same
mechanism, applied to two kinds of damage: the irreversible and the false.

What that second side has caught as false, in our own case, is public: [`ERRATA.md`](../ERRATA.md),
generated from the internal register at every engraving, pinned by the hash of its source,
with the column that matters: what caught the error.

---

## What an attestation cannot prove

The patterns above produce **traces**: a chained register, file hashes, execution logs. A
trace serves to establish that something took place. What remains is to know what exactly
it establishes - and the answer is narrower than it looks.

*Scope note: the mechanisms discussed below - chained register, hash pinning, offline
verifier - are **later than POC-001** and their code is not in this repository, unlike the
three components listed above. What follows is therefore a design lesson, not a reading of
published code.*

> **An attestation produced inside the perimeter it attests does not constrain that
> perimeter.** It establishes its *internal consistency*, and internal consistency is
> precisely what an adversary present inside the perimeter knows how to produce.

We met this form on three unrelated objects, and each time through a different source:

| The attestation | What it proves | What it does not prove |
|---|---|---|
| **A chained register** (each entry carries the hash of the previous one) | the **inside**: no entry between the origin and the head can be modified, removed or reordered without breaking a link | **exhaustiveness**, and only in one precise case. A **rewrite of the last entry** is constrained by no successor: nothing outside the file records what the head should be. On the other hand, an **erased** file is a red by default here - it is up to the caller to declare that no evaluation has taken place yet, never up to the verifier to guess - and a **truncation** leaves behind the raw pieces of its vanished entries, which the verifier reports as orphans |
| **A binary that hashes its own file**, against a value pinned outside | **drift**: the binary being run is no longer the one that was validated | **forgery**, provided one gets there. The binary computes *and* compares: a modified binary can write the hash of the original. The same gap exists for an artefact signed by the organisation's own publishing infrastructure - it passes provenance checks because it is genuinely signed by whoever was meant to sign it. ⚠️ But reaching that limit presupposes having **already** obtained write access to the deployed binary: here the agent has no verb to get there and the code is mounted read-only. It is a limit of the last pattern, not an entry point |
| **A producer attesting that its mandate still runs** | nothing | that it still has the right to produce. An agent whose purpose has ceased keeps emitting a consistent, timestamped, mutually coherent - and hollow - history, because nothing inside its own write perimeter knows that its authority has expired. ⚠️ This class is here **documented and not implemented, on purpose**: our mandate *is* the human gesture that launches execution, there is no scheduler and no periodic task, so an orphaned producer cannot drift - it can only be invoked. At twenty agents and with team turnover, it bites; at this scale, a "mandate valid" field would be green on every record and would teach nothing |

The first row, we wrote against ourselves: the founding thesis of our register - *a
chained journal proves that none is missing* - was false, and an adversarial review
established it. The second was confirmed to us by a reference document on the security of
the model supply chain. The third was brought to us by an identity-management
practitioner, in the words of their trade: *an identity is not allowed to write its own
audit log*.

**Three domains, three independent sources, a single form.** That is what moves it from the
status of a house thesis to that of a class.

And the table above is not an admission of powerlessness: every row of the right-hand
column has been **narrowed** by a dated fix. The original breach - *erase, truncate,
rewrite, all three pass green* - shrank to a single case, the rewrite of the last entry,
because the verifier stopped rendering green on a file it had never opened and now lists
the raw pieces without an entry. What remains is not what we did not try to close: it is
what a device internal to its own perimeter **cannot** close, however much care is put
into it.

Naming it serves two purposes. It prevents reading a trace for more than it says. And it
designates precisely what a check **external** to the perimeter would bring, the day one
is available - a third-party timestamp, a journal signed by the infrastructure, a public
anchor. It is the same logic as out-of-band confirmation, applied to proof rather than to
action: what usefully constrains is found where the agent cannot reach it.

### The practical consequence: name a field after what it measures

If an attestation can establish only internal consistency, then a field must never carry
the name of the property one would like it to prove.

`hash_pinned: true` is admissible: it means *a reference value exists outside this
artefact, and the computed hash matches it*. `binary_authentic: true` is not: the check
does not establish it, and the name suggests it does.

It is a vocabulary constraint, and it costs little. It prevents a reader - human or
machine - from treating a bounded statement as a proof.

Corollary, in the other direction: **a check without a counter-proof does not enter a
schema.** A field that would read "compliant" on every record until the end of time
teaches nothing, and nobody will ever know whether it works. A field that cannot go red is
not a check, it is a declaration.

### And this section applies to itself

We keep a dated register of preventions: the faults that were about to be committed and
what stopped them. Nine are recorded over a window with a complete trace. We published
them as evidence that prevention happens.

An outside reader offered us the test that was missing - the one we already applied to our
rules, without applying it to our evidence: **what measurement did this prevention
cause?** A prevention that produced an instrument is inspectable: the instrument exists, it
is dated, a third party can run it on a case of their choosing. A prevention that produced
only a sentence is exactly the unverifiable claim this section describes.

Under the test, only **four out of nine** had left an instrument behind. Two of the guards we
believed the most solid were sentences: they lived in a script recreated at every use,
hence nowhere anyone could run them again. They became instruments the day the test showed
it - which brings the count to five, plus one partial.

We leave the figure visible rather than the initial count. A section that asserts that an
attestation proves only its own consistency cannot, in the same document, present its own
preventions as evidence without saying which ones are.

What the test produced, on the other hand, deserves to be said too: an instrument. The most
frequent gesture of our work - the controlled modification of a reference document - had
its safeguards in a script rewritten at every use. We made it a durable tool, with its
bench: twelve cases, nine of which the guard must **refuse**, and the bench checks that the
message names the cause and that the file was left intact. It served from the very next
pass, and it refused for the right reason on the first attempt.

That is the only thing we know how to say about a prevention: not that it happened, but
what it left behind that someone else can run.
