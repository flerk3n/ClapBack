---
inclusion: always
---

# Project status maintenance

`docs/PROJECT_STATUS.md` is the canonical record of implemented capabilities, validation, integration blockers, and next actions for this workspace.

After making meaningful code, configuration, architecture, integration, or documentation changes:

1. Complete the implementation and relevant validation first.
2. Before the final response, review what actually changed and update `docs/PROJECT_STATUS.md` when the work affects capabilities, architecture, configuration, integration readiness, known limitations, validation state, or next actions.
3. Keep the executive summary, implemented-capability sections, blocker priorities, validation record, next actions, and dated change log mutually consistent.
4. Record only completed or directly observed facts. Never claim unimplemented or unvalidated work.
5. Include relevant validation commands and outcomes. If validation could not run, state that explicitly.
6. Add newly discovered blockers with a priority and concrete impact. Remove or mark a blocker resolved only after verifying the fix.
7. Preserve unrelated entries and edits. Make the smallest status update that accurately describes the completed task.
8. Do not update the status file for read-only investigation, discussion, trivial formatting, generated files, or changes that do not alter project status.
9. If `docs/PROJECT_STATUS.md` is the only changed file, do not create another status update about that update.

Use one concise change-log entry per coherent task, with the newest entry first.
