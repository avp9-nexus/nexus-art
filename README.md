# nexus-art

**AI curator agents buy art at auction. A human releases the funds. Nothing moves without them.**

NEXUS-ART pursues two things at once, and they are inseparable: an **AI that
discovers and funds living artists**, and the **discipline required to let an agent
commit money without ever giving it the last word**. Handmade, solo.

---

## What has been proven — and anyone can verify

Three public demonstrations on **Base Sepolia** (testnet, no real value at stake).
Contract `0x471796C1644d87f30AD81D36f6d4A56f0e270c23`, source verified.

| | What was demonstrated |
|---|---|
| **POC-001** | A curator evaluates a work, bids, wins. Proceeds split exact to the wei. |
| **POC-002** | Two curators with distinct tastes fight over the same work. Ten offers exchanged, **one** commitment of funds, **one** human gesture. |
| **POC-003** | The settlement key leaves the server: it now lives in a hardware signer. The server proposes a transaction; it can no longer sign one. |

Every cycle leaves a consultable on-chain trace. Details, transactions and the
curation rubric: [`poc-001/`](poc-001/) ·
[annotated demonstration](poc-001/DEMONSTRATION-POC-001.md) *(in French)*.

---

## Two ways in

**→ You came for the art.** What the project sets out to do, what it refuses to
claim, and why the human gesture is the medium: [`MANIFESTE.md`](MANIFESTE.md)
*(in French)*.

**→ You came for the agents.** The rules that stop an agent — and the human
directing it — from asserting what neither has verified, each one paired with the
real mistake that produced it: [`AGENT-GOVERNANCE.md`](AGENT-GOVERNANCE.md).

---

## The founding constraint

An autonomous agent handling value poses a problem that is easy to state and hard to
solve: **it needs enough autonomy to be useful, and little enough that it cannot cause
harm alone.**

The answer here is two keys. A weak key, with no spending power, which the agent uses
to negotiate as freely and as often as it likes. A separate vault, which signs exactly
one thing: the step that actually moves the money — and only after a human gesture made
outside the system. The agent chains ten decisions on its own; the eleventh, the one
that costs, requires a hand.

The reusable patterns, independent of this project, are documented in
[`poc-001/PATTERNS-SECURITE-AGENTIQUE.md`](poc-001/PATTERNS-SECURITE-AGENTIQUE.md)
*(in French)*.

---

## What this project is not

- **Not finance.** Test network, no real value, no investment advice.
- **Not a product.** The deployed contract is a POC and a deliberate dead end. Any
  deployment of value will go through a new contract audited by an external third party.
- **Not a first.** Others work on generative art and collector agents. This repository
  documents one precise combination and its limits, not a precedence claim.
- **The agents are not co-founders.** They carry a curatorial and editorial voice.
  Questions of legal status rest with the filer.

---

## Prior art

INPI e-Soleau: **DSO2026016080** (2 May 2026) · **DSO2026023753** (28 June 2026) ·
**DSO2026025380** (11 July 2026).

Site: **https://nexus-art.org** *(in French)* · Licence: [LICENSE](LICENSE)
