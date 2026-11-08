# Licensing

This repository holds four kinds of material under four different terms. The root
[`LICENSE`](LICENSE.md) is the default and applies to anything not listed below.

This map is the authority. A file that carries an `SPDX-License-Identifier` line repeats it, so
the terms are readable by tooling and not only by people; the root `LICENSE` carries
`LicenseRef-NEXUS-Reference-Only-1.0` for the same reason.

## The map

| What | Where | Terms |
| --- | --- | --- |
| **Governance and method documents, the errata, and the guides** | `AGENT-GOVERNANCE.md`, `MANIFESTE.md`, `CORRECTIONS.md`, `WHAT-CAUGHT-IT.md`, `ERRATA.md`, `errata.json`, `README.md`, `llms.txt`, `poc-001/README.md`, `poc-001/PATTERNS-AGENTIC-SECURITY.md`, `poc-001/DEMONSTRATION-POC-001.md`, `poc-001/VALIDATION.md`, `poc-004/README.md` | **CC BY 4.0** - [full text](https://creativecommons.org/licenses/by/4.0/legalcode) |
| **Tooling and reference code** | `.github/garde_commit_ci.mjs`, `.github/workflows/garde-commit.yml`, `poc-001/mcp-servers/**`, `poc-001/*.SKILL.md`, `poc-001/weights.json` | **Apache-2.0** - [full text](https://www.apache.org/licenses/LICENSE-2.0) |
| **The deployed contract's source** | `contracts/NexusPOC.sol` | **MIT** - its own `SPDX-License-Identifier` header, part of the bytes verified on-chain |
| **Artworks and website** | the `.webp` files, `index.html`, `claim.html`, favicons and site assets | **Reserved** - [`LICENSE`](LICENSE.md), `LicenseRef-NEXUS-Reference-Only-1.0` |

## Why the split is shaped this way

**The governance documents are meant to circulate.** They are cited in public standards work, and
an all-rights-reserved notice made that citation legally awkward for the people most likely to do
it. CC BY 4.0 removes the friction and **makes attribution mandatory** rather than optional, which
is the outcome this project actually wants: the material is reusable, and every reuse carries the
provenance. The errata and the guides to the repository go with them: the evidence and the map
travel under the same terms.

**The code is small and was written to be lifted.** Apache-2.0 is the license already used by the
projects this work is contributed to, so a maintainer can take a file across without a licence
review.

**The artworks stay reserved, and that is deliberate.** They carry the INPI prior-art deposits
listed in [`LICENSE`](LICENSE.md), and the artworks are the work itself.

**The deployed contract keeps the licence it was deployed with.** Its source carries an MIT
header, chosen at deployment so that anyone can audit the contract and fork it to learn from it.
That header is part of the bytes verified on-chain; changing it would make the published source
stop reproducing against the chain. The NEXUS PROTOCOL name and brand stay reserved.

## Attribution

For the CC BY 4.0 material, attribute as:

```text
avp9 / NEXUS - INPI DSO2026016080 - https://github.com/avp9-nexus/nexus-art
```

For academic or standards citation, see [`CITATION.cff`](CITATION.cff), which carries the Zenodo
DOI.

## What this does not change

- The root `LICENSE` still governs every file not listed above.
- GitHub will keep displaying **"Other"** as the repository licence, because the majority of the
  repository is reserved and `licensee` classifies a repository by its root `LICENSE` alone. That
  label is accurate: this is a mixed-licence repository, and this file is the map.
- Nothing here grants a patent licence, and no patent is claimed.

## Reporting a problem with this file

If a licence header contradicts this map, or a file appears in no row, that is a defect worth
reporting - open an issue. A licensing map that is wrong is worse than none.
