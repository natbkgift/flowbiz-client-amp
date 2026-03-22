Read these files first and treat them as the source of truth:

- .ai/refactor-master-prompt.md
- .ai/refactor-state.md
- .ai/refactor-queue.md

This is NOT a fresh start.

Your job in this run:
- complete at least 2 OPEN issues when feasible
- touch at least 2 surfaces
- avoid repeating completed work
- prefer workflow improvements over visual polish
- stay inside real existing admin/backoffice scope

Focus for this run:
1. dashboard drill-down clarity
2. cross-surface next-step navigation
3. secondary admin empty-state guidance

Validation expectations for frontend work:
- run targeted tests for touched modules
- run `npm --prefix admin-app run build`

Return the result using the required final output format.
After completing the run, provide a full STATE UPDATE that can replace the contents of .ai/refactor-state.md.
Also specify which issue statuses in .ai/refactor-queue.md should change.