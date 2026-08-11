# Corrections

Claims published in this repository that were false, and the commit that fixed each one.

**Scope.** This file covers this repository only. A line enters here when something published under `avp9-nexus/nexus-art` was wrong and a commit fixed it, so that you can check the whole thing with `git log` and never take our word for it. Errors on surfaces this repository does not control, such as articles, account metadata or a preprint, are tracked internally and are not listed here, because you could not verify them from here.

**Dated snapshot, not a live mirror.** The project is active and the internal register keeps growing: 17 entries on 30 July 2026, 26 on 5 August, 32 on 10 August, 34 on 11 August. That growth measures how much is being checked, not how much is breaking. If a line here disagrees with the chain, with the contract source or with `git log`, the artifact wins.

Why we keep this at all, and what it could not tell us, is in [WHAT-CAUGHT-IT.md](WHAT-CAUGHT-IT.md).

**On the `[CORRECTED]` marker.** Every false claim quoted below sits on its own line behind that marker. It is not decoration. A corrections file necessarily re-publishes the wrong sentences it corrects, so the automated judge that scans our public surfaces for banned formulations flags this file by construction, and it was right to. The marker is what tells it the string is a citation rather than a live claim, on that line and nowhere else. Any of these sentences written here as normal prose would still be reported.

---

## 1. A human signature, where there was a human confirmation

**Published in** `AGENT-GOVERNANCE.md`, from [`08de4f5`](https://github.com/avp9-nexus/nexus-art/commit/08de4f5) on 29 July 2026:

> [CORRECTED] every commitment of funds by an agent requires a human signature made outside the system

**Why it was false.** For the first two auction cycles the signature was produced by an encrypted keystore running inside the server. The human gesture was an out-of-band confirmation on a separate channel, which is a different thing and a weaker claim. The vault that signs on hardware came later, and it does not make the earlier sentence retroactively true.

**Fixed by** [`48854ba`](https://github.com/avp9-nexus/nexus-art/commit/48854ba) on 1 August 2026.

**The part worth keeping.** An earlier commit, [`a84ae0f`](https://github.com/avp9-nexus/nexus-art/commit/a84ae0f), had already corrected this sentence: it replaced "every transfer of funds" with "every commitment of funds" and left the carrying verb untouched. The false half survived inside a correction, and therefore carried the authority of one, for three days and across four surfaces. A correction has to be verified on the whole proposition, not on the term that was flagged.

## 2. The same false proposition, in a verb a grep did not find

**Published in** `README.md`:

> [CORRECTED] A human signs.

**Why it was false.** Same reason as above, in a shorter form. It also explains why the first sweep missed it: the search looked for the phrase `human signature`, and this surface said `signs`. Searching for the wording instead of the claim finds the copies you already know about.

**Fixed by** [`7828512`](https://github.com/avp9-nexus/nexus-art/commit/7828512) on 1 August 2026. The site now reads *"A human releases the funds"*.

## 3. A royalty of 8.333 percent that the contract never had

**Published in** `index.html` and `claim.html`, and in the POC-001 reading note.

> [CORRECTED] Royalty 8.333% on-chain (EIP-2981)

**Why it was false.** The deployed contract sets `royaltyBps = 833`, which is 8.33 percent. The arithmetic settles it: 8.33 + 45.835 + 45.835 = 100.000, where the extra digit gives 100.003. The figure was found by re-reading a public note that copied the internal registry faithfully, so the copy was not at fault, the source was.

**Fixed by** [`ef64ca7`](https://github.com/avp9-nexus/nexus-art/commit/ef64ca7) on 29 July 2026 and [`42abf5b`](https://github.com/avp9-nexus/nexus-art/commit/42abf5b) on 31 July 2026.

**What is not fixed, on purpose.** The root is a comment in `contracts/NexusPOC.sol`, which reads `royaltyBps = 833` for `8.333%`. That source is byte-identical to the version verified on Sourcify and the bytecode is immutable. Editing the comment would not revoke the recorded verification, it would only make the published source stop reproducing against the chain. So this one is documented rather than repaired, and the deployed code remains the reference.

## 4. A target economic model described as if it were running

**Published in** `claim.html`: a 25 percent split, which belongs to a later phase that is not deployed, written with verbs that placed it in the live contract.

**Why it was false.** The number was correct and the sentence was not. Counting wrong figures does not catch this class: a surface is judged on its propositions, not on its digits. The same review had listed three occurrences as false when two were false and one described a target that would have become wrong if we had "corrected" it.

**Fixed by** [`42abf5b`](https://github.com/avp9-nexus/nexus-art/commit/42abf5b) on 31 July 2026, which corrected the two real cases and marked the target as *"Phase 3, not deployed"*.

---

## Reporting an error

Factual errors in the published documents are in scope of [SECURITY.md](SECURITY.md). Open an issue, or use the private reporting channel described there. A correction that lands here will carry the commit that made it.
