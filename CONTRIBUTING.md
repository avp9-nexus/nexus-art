# Contributing

This file exists to be clear about what this repository is, so nobody spends effort on the wrong
thing. It is a clarification, not an invitation.

## What this repository is

A **public record**, not a collaborative codebase. It publishes the governance rules of an
agentic system, each paired with the dated failure that produced it, the corrections made to
claims that turned out to be false, and the on-chain artefacts that let a reader verify the record
without trusting it.

It is maintained by one person. Most of it - the artworks, the website, the deployed contract -
carries INPI prior-art deposits and is reserved. See [`LICENSING.md`](LICENSING.md) for the map.

## What is not accepted, and why

**Pull requests that add or modify code or artworks are not accepted.** The reserved material is
tied to prior-art deposits; taking a contribution into it would blur an authorship record that the
deposits exist to fix. This is a property of the project, not a judgement about anyone's work.

Saying this plainly is the point of this file. A repository that stays silent lets people open a
pull request that was never going to land.

## What is genuinely wanted

⭐ **If a claim published here is wrong, that is the contribution this project wants most.**

[`CORRECTIONS.md`](CORRECTIONS.md) lists claims that were published here and were false, each with
the commit that killed it. That file is not an apology; it is the reason to trust the rest. Adding
to it is a service.

Worth opening an issue for:

- **A factual claim that does not hold.** A number, a date, an address, a described behaviour.
  Please say what you measured and how - a disagreement about a measurement is settled by the
  measurement, not by authority.
- **A documented behaviour that the code does not have.** The governance documents describe what
  the system does; where the description and the artefact diverge, the description is the defect.
- **A broken or misleading reference.** A link, a transaction hash, a citation that resolves to
  something other than what the text says it does.
- **A gap in the licensing map** - a file that falls under no row of [`LICENSING.md`](LICENSING.md).

You do not need to propose a fix. A precise report is more useful than a patch here.

## Security

Do not open a public issue for a vulnerability. [`SECURITY.md`](SECURITY.md) describes the private
reporting channel and states the limits this proof of concept knowingly accepts.

## Where the reusable work actually lives

The parts of this work meant to be lifted rather than reimplemented are contributed **upstream**,
under the licence of the receiving project, and that is where to engage with them:

- Negative conformance vectors and their runner - contributed to the **OWASP GenAI Agent Control
  Standard**, Apache-2.0.
- Conformance assertions on the expected failed condition - contributed to
  [`xmuruaga/bounded-agents`](https://github.com/xmuruaga/bounded-agents).

Issues, review, and pull requests on that material belong in those repositories, where the licence
and the maintainers can carry them.

## Using the material from here

The governance and method documents are **CC BY 4.0**: reuse is granted, attribution is required.

```text
avp9 / NEXUS - INPI DSO2026016080 - https://github.com/avp9-nexus/nexus-art
```

For academic or standards citation, [`CITATION.cff`](CITATION.cff) carries the Zenodo DOI.

## What happens to a report that is right

It goes into [`CORRECTIONS.md`](CORRECTIONS.md), with the commit that fixed it, and the reporter is
credited there by name unless they ask otherwise. That file already lists four claims that were
published here and were false; each line can be checked against this repository's `git log`.
