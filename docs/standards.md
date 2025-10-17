# AstraForge Documentation Standards

## Overview
AstraForge requires enterprise-grade, cohesive documentation to ensure maintainability, scalability, and collaboration. Standards cover in-code comments (JSDoc 100%), architectural decisions (ADRs), API specifications (OpenAPI 3.0), contributor guides, and operational runbooks. Enforcement via ESLint, TypeDoc, pre-commit hooks, and CI.

## JSDoc Standards
- 100% coverage for public functions/classes/interfaces.
- Required tags: @param (type, description), @returns (type, description), @example (usage), @see (references), @security (auth/sensitivities).
- Inline // for algorithms/logic rationale.
- Follow SOLID: Self-documenting code prioritized.

## ADR Standards
- Use MADR format: Context (problem), Decision (choice), Consequences (pros/cons/status).
- One ADR per major decision (e.g., LLM chaining, quantum fallback).
- File: docs/ADRs/ADR-{num}-{title}.md.

## OpenAPI Standards
- Version 3.0 YAML for all endpoints (REST/WS).
- Paths: /llm/consensus (POST), /collab/ws (upgrade), /vectors/search (GET).
- Include schemas, security (OAuth/JWT), examples.
- File: docs/api.yaml.

## Contributor Standards
- contrib.md: Setup (npm i, env secrets), Deploy (K8s/Terraform), Testing (TDD npm test).

## Runbooks Standards
- runbooks.md: Incidents (P1 rollback), KPIs (Grafana queries), Audits (quarterly, align Phase 6 monitor).

## Enforcement
- ESLint-plugin-jsdoc: require-jsdoc error, param/returns warn.
- Husky pre-commit: lint docs.
- CI: TypeDoc build, validate coverage >95%.
