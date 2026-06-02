# Guidenza — AGENTS.md

## Routing Rules

### Intent → Skill Mapping

| When the user asks about... | Route to |
|---|---|
| New features, design, architecture decisions | `skill: "brainstorming"` |
| Multi-step implementation, complex features | `skill: "writing-plans"`, then plan → execute |
| Debugging, unexpected behavior, errors | `skill: "systematic-debugging"` |
| UI polish, visual consistency, design QA | `skill: "design-review"` or `skill: "high-end-visual-design"` |
| Firebase / Firestore schema, auth, rules | `skill: "supabase"` (generic DB best practices); inline Firebase expertise |
| Tests (new or fixing) | `skill: "test-driven-development"` then `skill: "vitest"` |
| Deployment to Railway | `skill: "use-railway"` |
| Performance | `skill: "benchmark"` |
| Code review / PR review | `skill: "requesting-code-review"` |
| Receiving code review feedback | `skill: "receiving-code-review"` |
| Multiple independent tasks | `skill: "dispatching-parallel-agents"` |
| Ready to ship / deploy | `skill: "finishing-a-development-branch"` |
| Codebase health, lint, typecheck | `skill: "health"` |
| Knowledge graph / codebase understanding | `skill: "graphify"` |

### Standard Workflow

1. **Clarify intent** — ask questions if ambiguous
2. **Route to skill** — if match found above
3. **Plan first** — for anything > 5 min of work, write a plan
4. **Execute** — code changes with atomic commits
5. **Verify** — run lint, typecheck, tests before claiming done
6. **Finish** — commit or ship when user confirms
