# AMP Agent Starter Prompt V1

Status: Reusable startup prompt for future AMP Pattaya public UI sessions.

Use this document when opening a new chat with an AI agent for public-facing AMP Pattaya work.

## What This Prompt Is For

Use it when the task touches:

- public pages
- public UI / UX
- bilingual public copy
- design system work
- homepage changes
- public content readiness or publish gating

## Short Version

Copy and paste:

```text
You are working on AMP Pattaya public-facing UI/UX. Before editing anything, read AGENT_RULES.md plus:
- docs/AMP_VISUAL_SYSTEM_SPEC_V1.md
- docs/AMP_PUBLIC_UI_QA_GATE.md
- docs/AMP_COPY_SYSTEM_TH_EN_V1.md
- docs/AMP_PUBLISH_GATE_RULES_V1.md
- docs/AMP_PUBLIC_UI_IMPLEMENTATION_RULES_V1.md

If the task touches the home page, also read docs/AMP_HOME_BLUEPRINT_V1.md.

In your first reply:
1. List the files you read.
2. Summarize the constraints that govern this task.
3. Call out any conflicts between docs, code, or current UI before editing.
4. State exactly what you will change.

Rules:
- Follow the AMP visual system and CTA hierarchy.
- No placeholder, TODO, pending, draft, debug, or weak fallback content on public pages.
- If a section is incomplete or weak, hide it instead of rendering it poorly.
- Thai locale must not be English-mixed unless intentionally required.
- No arbitrary one-off spacing, color, or typography fixes outside the system.
- Validate the result against docs/AMP_PUBLIC_UI_QA_GATE.md before closing.
```

## Full Version

Copy and paste:

```text
You are working inside the AMP Pattaya repository on public-facing UI/UX work.

This is governed work, not free-form design iteration.

Before editing any files, read:
- AGENT_RULES.md
- docs/AMP_VISUAL_SYSTEM_SPEC_V1.md
- docs/AMP_PUBLIC_UI_QA_GATE.md
- docs/AMP_COPY_SYSTEM_TH_EN_V1.md
- docs/AMP_PUBLISH_GATE_RULES_V1.md
- docs/AMP_PUBLIC_UI_IMPLEMENTATION_RULES_V1.md

If the task touches the home page, also read:
- docs/AMP_HOME_BLUEPRINT_V1.md

In your first response, do not start editing immediately.
First:
1. Confirm this is public UI / UX work.
2. List the files you read.
3. Summarize the most important constraints from those files.
4. Identify any conflicts between the docs, the current code, or the requested task.
5. State your implementation approach.

Execution rules:
- Reuse existing public primitives, tokens, containers, and route patterns before inventing anything new.
- Follow the AMP public visual system and CTA hierarchy exactly.
- Do not introduce arbitrary one-off spacing, typography, radius, color, or shadow fixes.
- Use dictionary-driven or publish-ready CMS copy for public UI.
- No placeholder, TODO, pending, draft, seed, debug, or system-note text may appear publicly.
- If a section, card, or trust block is weak or incomplete, hide it instead of rendering a thin public version.
- Thai locale must feel natural and should not visibly leak English UI labels or English body copy.
- If a legacy doc conflicts with the new AMP governance docs, raise the conflict before editing.

Before closing:
- Check the result against docs/AMP_PUBLIC_UI_QA_GATE.md.
- Verify EN and TH logic where relevant.
- Verify mobile behavior.
- State what you validated and what you did not validate.
```

## Required First Response Structure

Ask the agent to reply in this structure:

1. Files read
2. Governing constraints
3. Conflicts or risks
4. Planned edits

This makes drift easier to catch before code changes begin.

## Conflict Rule

The agent must identify conflicts before editing. That includes:

- new governance docs vs legacy docs
- docs vs current code behavior
- requested task vs publish-gate or locale rules

If a conflict exists, the agent should state it explicitly instead of silently choosing one side.

## Implementation Discipline Rule

The agent must:

- reuse shared primitives
- keep public styling system-aligned
- avoid public filler content
- omit weak sections instead of polishing them cosmetically

## Validation Rule Before Closing

The agent should not close with "done" only.

The final response should include:

- files changed
- how the work follows the governing docs
- blockers or residual risks
- what was validated
- recommended next step if the task was primarily governance or documentation

## Operator-Friendly Example Prompts

### Example A: Home Page Work

```text
Please update the AMP Pattaya home page. This is public UI work, so read the required governance docs first, summarize the constraints, and tell me any conflicts before editing.
```

### Example B: Shared Public Component Work

```text
Please improve this public component, but only if the change stays within AMP's public visual system, copy rules, and publish gate. Read the governance docs first and summarize what will constrain your work.
```

### Example C: QA / Audit Work

```text
Please audit this public AMP Pattaya route against AGENT_RULES.md, docs/AMP_VISUAL_SYSTEM_SPEC_V1.md, docs/AMP_PUBLIC_UI_QA_GATE.md, and docs/AMP_COPY_SYSTEM_TH_EN_V1.md. List blockers first, then medium issues, then minor issues.
```
