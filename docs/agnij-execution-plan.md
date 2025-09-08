## Tsunami — Execution Plan for Agnij (ShieldedVault, eERC, PrivacyRouter)

This document defines the roadmap, tasks, stages, deliverables, and dependencies for Agnij’s scope in the Tsunami MVP and beyond. It also enumerates interpersonal dependencies with teammates and external technical references grounding the plan.

### Scope Owned by Agnij (MVP)
- ShieldedVault: custody of underlying ERC-20s; Merkle tree of commitments; nullifier registry; mint/burn eERC; spend to router; withdrawals with compliance gating hooks.
- eERC tokens: encapsulated ERC-20 wrappers; restricted transfer (Router/Vault only);
- PrivacyRouter (with Roshan): verify zk spend proofs; perform Uniswap swaps using Vault funds; mint new commitments for outputs.

### Referenced foundations
- Uniswap v4 pool manager and hooks (unlock callbacks, BaseHook patterns): Uniswap v4 Core/Periphery.
- Router integration patterns and quoting (V4Quoter, Router SDK): Uniswap docs.
- ZK stack: Circom + snarkjs (Groth16), Solidity verifiers; Poseidon Merkle tree via circomlibjs.

---

## Phase Roadmap

### Phase 1 — MVP (private swaps with fixed denominations)
Goal: E2E flow deposit → private swap → new private note; withdrawals with threshold stub.

- Milestone 1: Contract skeletons compile and deploy locally
  - Contracts: `ShieldedVault`, `eERC`, `PrivacyRouter`, `ComplianceOracleStub`, `Verifier(s)`.
  - Core storage: Merkle tree params fixed; nullifier mapping; roots window.
  - Access control: roles, pausability scope (limited to spend/withdraw paths).

- Milestone 2: Fixed-denomination deposit/withdraw
  - Deposit: lock `token`, `amountBucket`, emit `CommitmentInserted`.
  - Withdraw: proof verify + compliance stub for > threshold.

- Milestone 3: Private spend + Uniswap swap
  - Spend proof verify against `root` and `nullifier`.
  - Execute swap via Uniswap (start with canonical path; v4 unlock flow if available on target chain; else v3 router as fallback).
  - Mint output as new commitment to stealth recipient data.

- Milestone 4: E2E tests and invariants
  - Happy paths and adversarial tests; double-spend rejection; slippage guard.

Exit criteria (Phase 1):
- Private swap completes within target UX (<=60s with relayer), fixed buckets supported for 2–3 tokens, thresholded withdrawals enforced, no double-spends.

### Phase 2 — Compliance & flexibility
- Variable denominations; note splitting/merging in circuits.
- zk-attestation integration (Polygon ID or equivalent) for large withdrawals.
- Relayer fee handling and anti-censorship measures.

### Phase 3 — Productionization
- Uniswap v4 hook optimization (MEV-aware), mobile app launch, audits, governance guardrails.

---

## Technical Decisions to Lock (Phase 1)
- Merkle tree
  - Hash: Poseidon; Depth: 32 (review vs expected tx volume); Root window: last N roots (e.g., 256) accepted.
  - Insertion: on-chain incremental tree with event emission; audit-friendly layout.

- Note/Nullifier model (minimal viable)
  - Commitment C = Poseidon(pubKeyNote, tokenAddress, denominationId, rho).
  - Nullifier N = Poseidon(skNote, rho). N is public input; single-use enforced on-chain.

- Proof systems
  - Groth16 for Deposit/Spend/Withdraw circuits; Solidity verifiers auto-generated via snarkjs.
  - Public inputs: `root`, `nullifier`, `token`, `denominationId`, and constraints per circuit.

- Uniswap integration (MVP pragmatic)
  - Prefer v4 PoolManager unlock flow if chain supports; else use standard router (v3) for initial swaps.
  - Slippage protection via `minAmountOut`, deadline.

- Compliance stub
  - Threshold set in USD via a simple price oracle stub/config; if amount > threshold, require attestation proof placeholder.

---

## Workstreams and Tasks

### A. Contract Architecture (Agnij)
1) Define interfaces and storage
   - `IShieldedVault`, `IPrivacyRouter`, `IeERC`, `IComplianceOracle`.
   - Storage layout: roots ring buffer, nullifier mapping, denomination registry per token.

2) Implement `eERC`
   - Mint/burn restricted to `ShieldedVault`.
   - Transfers disabled; `PrivacyRouter` interacts via `Vault` only.

3) Implement `ShieldedVault`
   - deposit(token, amount, commitment, denominationId)
   - withdraw(proof, root, nullifier, token, amount, recipient)
   - executeSpend(proof, root, nullifier, tokenIn, tokenOut, amountIn, minAmountOut, recipientStealthData)
   - Events: `CommitmentInserted`, `NullifierUsed`, `RootUpdated`.

4) Implement `PrivacyRouter`
   - Verify spend proof against `Verifier` and Vault state.
   - Call Uniswap route; return `amountOut` and finalize new commitment in Vault.

5) Compliance oracle stub
   - `isExitAllowed(token, amountUsd)` returns bool.
   - Admin-set threshold and simple price source placeholder.

Deliverables: compiling, documented contracts with unit tests and invariant checks.

### B. ZK/Verifier Integration (Dependency: Ayash)
- Agnij: define public inputs and contract verifier interfaces; wire calldata encoding.
- Ayash: design circuits (Deposit/Spend/Withdraw), emit `zkey` and `vkey`, provide `Verifier.sol` or acceptable ABI.
- Joint: agree on Poseidon parameters and tree arity; test `verifyProof` gas and limits.

### C. Uniswap Routing (Joint with Roshan)
- Agnij: define router interface from Vault; slippage/deadline; exactIn swaps.
- Roshan: finalize v4 or v3 pathing on target chain; provide pool keys/paths utils; handle unlock callbacks.
- Joint: quote integration (off-chain quoter) and tests for edge liquidity.

### D. Frontend/Relayer Interfaces (Dependency: Arko + Sam, optional Bhagya)
- JSON schemas for wallet RPC: deposit, proveSpend, swap, withdraw.
- Relayer API (optional): submit tx, fee model.
- Display balances in eERC; map denominations to UX.

---

## Interpersonal Dependencies & Handoffs

| Interface | Owner → Consumer | What is needed | When |
|---|---|---|---|
| Circuits public inputs | Ayash → Agnij | Final public input ordering/types for Deposit/Spend/Withdraw | Before contract verifier wiring |
| Verifier artifacts | Ayash → Agnij | `.zkey`, `vkey.json`, `Verifier.sol` (Groth16) | Before proof integration tests |
| Poseidon/Merkle params | Ayash ↔ Agnij | Field, arity, hash params, depth | Before Vault tree implementation |
| Swap pathing | Roshan ↔ Agnij | Chain selection, v4 PoolManager vs v3 router path; pool keys | Before Router implementation |
| Compliance attestation API | Bhagya ↔ Agnij | Threshold config, attestation verifier ABI (stub first) | Before withdrawal gating tests |
| Wallet UX schemas | Arko+Sam ↔ Agnij | RPC payloads for deposit/swap/withdraw/proof | During E2E wiring |
| Relayer protocol | Bhagya (or infra) ↔ Agnij | Nonces, fee token, auth | Optional in MVP |

---

## Detailed Task Breakdown (with dependencies)

1) Decide Merkle/Nullifier design [BLOCKED BY: Ayash params]
   - Output: constants and library selection; Tree depth; accepted roots window.

2) Define and freeze contract interfaces
   - Output: Solidity interfaces with events and errors; reviewed by Roshan/Ayash.

3) Implement `eERC`
   - Output: audited access control; disabled transfers; tests for mint/burn gating.

4) Implement `ShieldedVault` (storage + deposit)
   - Output: tree insert, event emission, denomination registry.

5) Implement `ShieldedVault` (withdraw)
   - Output: proof verify, nullifier check/set, compliance gating hook.

6) Implement `PrivacyRouter` (spend + swap)
   - Output: proof verify; Uniswap swap; new commitment.

7) Wire verifiers
   - Output: verifier contracts linked; calldata packing helpers; tests using sample proofs.

8) Compliance stub and price source
   - Output: threshold config; unit tests for gating.

9) E2E tests
   - Output: deposit→spend→swap→new note; deposit→withdraw (<, > threshold); double-spend prevention.

10) Invariants and audit prep
   - Output: forge-invariant tests; pause scope; upgradeability plan.

---

## Testing & Quality Gates
- Unit tests: Merkle operations, nullifier uniqueness, eERC gating.
- Integration tests: proofs verification, swap execution, slippage and deadline.
- Invariants: no balance leakage, conservation across spend+swap, nullifier single-use.
- Gas snapshots: monitor verify/insert/swap paths.

---

## Risks and Mitigations
- Compliance perception: provide gating on large exits; document attestation path early.
- Trusted setup: run MPSC for each circuit; publish transcripts; migration path to Plonk/Halo2 later.
- Linkability: fixed denominations; consider batched/relayed withdrawals; randomize timing where feasible.
- MEV: use deadlines, quoter, and later explore v4 hook-based protections.
- Merkle growth: ring buffer roots, incremental tree with efficient storage.

---

## Timeline (suggested)
- Week 1: Interfaces; Merkle/Nullifier decisions; `eERC` + Vault(deposit) skeleton; select Uniswap path.
- Week 2: Withdraw path + compliance stub; Router swap; verifier wiring harness.
- Week 3: E2E tests; invariants; gas snapshots; polish and docs.

---

## Success Criteria (Phase 1)
- All flows compile and pass tests; no double-spend; thresholds enforce.
- Swaps succeed on target chain against public liquidity; bounded slippage.
- Clear, versioned interfaces for circuits, router, and UX.

---

## Immediate Next Actions for Agnij
- Freeze interfaces and constants.
- Implement `eERC` and Vault deposit path.
- Align with Ayash on public inputs; request first verifier artifacts.
- Align with Roshan on v4/v3 route choice and pool data APIs.


