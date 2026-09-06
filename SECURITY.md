# Security Policy

## Scope

This repository contains a **proof-of-concept** deployed on a public **test network**.

| In scope | Out of scope |
|---|---|
| `contracts/NexusPOC.sol` — deployed at `0x471796C1644d87f30AD81D36f6d4A56f0e270c23` on Base Sepolia (chainId 84532) | Any mainnet deployment — there is none |
| The two governance documents, for factual errors | The website, the agents' runtime, the VPS infrastructure — not published here |

**No real value is at stake.** All funds involved are testnet ETH obtained from faucets;
the contract escrows only the highest bid between bid and settlement, and its balance is
zero outside an open auction. It refuses to deploy on any chain other than 84532
(`EXPECTED_CHAIN_ID`, enforced in the constructor).

## Corrections

Claims published in this repository that turned out to be false are listed in
[CORRECTIONS.md](CORRECTIONS.md), each with the commit that fixed it, so that the whole
list can be checked with `git log`. What that register could **not** tell us, and why, is
in [WHAT-CAUGHT-IT.md](WHAT-CAUGHT-IT.md).

Factual errors in the published documents are in scope above. Open a public issue for
those, since they are not security findings, and the correction will land in
`CORRECTIONS.md` with its commit.

## Reporting a vulnerability

Use **GitHub private vulnerability reporting** — the *Report a vulnerability* button under
the Security tab. It opens a private channel visible only to the maintainer.

If that button is not available to you, email **avp9pro@gmail.com** with the same content
instead. Either route reaches the maintainer privately.

Please do not open a public issue for a security finding.

## Safe harbor

If you research this repository in good faith and within the scope above, I will not
pursue legal action against you, and I will not ask anyone to act against you on my
behalf. What other people do on their own initiative is not mine to promise.

Good faith means you stay on the test network, you do not access, alter or copy data that
is not yours, you do not degrade the service for anyone else, and you tell me privately
before you tell the public.

If you cross the scope by accident, stop, and tell me, you are still covered. A researcher
who has to choose between saying nothing and losing this protection will say nothing, and
I would rather know.

This covers what is mine to give: the contract on Base Sepolia and the documents in this
repository. It does not extend to infrastructure other people operate, GitHub, Netlify and
the public RPC endpoints included. Their terms are theirs, not mine to waive.

## Response

This project is maintained by one person, alongside other work. Reports are read and
acknowledged as soon as they are seen. There is no on-call rotation, no service level and
no guaranteed remediation timeline. A report that needs a fast answer should say so.

## Known limitations — please do not report these

The contract is a proof of concept with documented design limits. These are **assumed
trade-offs, not defects**, and a new contract (`NexusV1`) is planned after an external
paid audit:

- **A token that has been auctioned can never be auctioned again.** `auctions[].exists` is
  never reset to `false`; settlement sets `settled = true` and the entry persists.
- **The curator recipient is a single contract-wide address.** It is mutable by the owner
  via `setCuratorRecipient(address)`, but it is not per-auction. In the POC the split can
  therefore pay a party that did not win.
- **The split assumes `owner == seller`.** In the POC the deployer is also the creator of
  the works. A distinct `sellerRecipient` is required before third-party artists deposit
  work — a rewrite, not a patch. This is stated in the contract header.
- **No anti-sniping.** A bid in the final seconds does not extend the auction. Deliberate:
  per the project's locked specification, anti-sniping is the responsibility of the
  **off-chain auction platform**, which implements it — not of the contract, and the
  successor contract deliberately keeps no time-extension logic either.
- **Blind signing is enabled on the hardware wallet** during operations. Mitigated by
  out-of-band confirmation and by decoding the transaction before signing, not by the
  device itself.
- **Refunds and payouts are pushed, and a failed push reverts.** `placeBid` refunds the
  previous highest bidder inline (`previousBidder.call{value: previousBid}`, revert on
  failure) and `settleAuction` pays the royalty, curator and platform recipients the same
  way (`_safeSendEth`). A whitelisted bidder that is a contract rejecting ETH therefore
  freezes the auction at its own bid — nobody can outbid it; settlement still works and
  delivers the token to it — and a payout recipient that rejects ETH blocks settlement.
  Bounded by the bidder whitelist and by owner-set recipients. Found by our own scan on
  5 September 2026, not by a report; the successor contract will use pull payments
  (`pendingRefunds` + `withdraw()`).

## What was checked against the deployed contract, and what was not

Dated snapshot, **11 August 2026**, read from two independent RPC endpoints that returned
identical values: chain id `84532` and the contract answers there; contract balance `0`
wei with no auction open; `auctions(27)` still reports `exists = true` alongside
`settled = true`, which is the first limitation above observed rather than asserted; the
selectors for `cancelAuction(uint256)` and `cancel(uint256)` are **absent** from the
deployed bytecode, checked with three known-present selectors as a positive control.

Five statements on this page are **not** verifiable from the chain and are not claimed to
be. The `EXPECTED_CHAIN_ID` guard runs in the constructor and cannot be observed after
deployment; it is read from the source, which Sourcify reports as an exact match to the
deployed bytecode. The escrow behaviour between bid and settlement is behavioural, and a
zero balance today is consistent with it rather than proof of it. `owner == seller`, the
absence of anti-sniping and the push-then-revert refund are properties of the source.
Blind signing is a state of a hardware device and is reported by its operator.

## No bug bounty

There is no reward program, monetary or otherwise. Reports are welcome and will be
credited in the repository if you wish.
