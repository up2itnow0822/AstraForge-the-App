---
title: ADR-003: Quantum Simulation vs Hardware
status: Proposed
decision_date: 2025-10-17
---

## Context
Quantum hardware costly/unavailable; sim sufficient for decision optimization.

## Decision
Use simulated annealing in QuantumDecisionSystem; real for prod if integrated.

## Consequences
Pros: Accessible dev, scalable; Cons: Performance gap; Status: Sim default.
