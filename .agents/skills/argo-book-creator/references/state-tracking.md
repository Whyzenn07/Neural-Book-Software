# State Tracking Reference (`book-state.md`)

`book-state.md` acts as the persistent memory for the Argo Book Creator system across user turns and chat sessions.

## 1. When to Read and Update `book-state.md`

- **Read**: Step 1 of every task execution. Check if `book-state.md` exists in the workspace root directory.
- **Update**: At the end of every task execution, update `book-state.md` to reflect new chapters created, updated terminology, modified notation rules, or changes in chapter status.

---

## 2. Standard Schema for `book-state.md`

```markdown
# Book State Tracking

## Project Metadata
- **Title**: [Working Book Title]
- **Target Audience**: [e.g., Undergraduate Finance Students, Beginners, Practitioners]
- **Primary Language**: [e.g., Indonesian / English]
- **Last Updated**: [YYYY-MM-DD]

## Terminology Glossary
| Term | Preferred Definition / Translation | Notes |
|---|---|---|
| Working Capital | Modal Kerja | Always use uppercase in Indonesian contexts |
| Discount Rate | Suku Bunga Diskonto | Symbolized as 'r' |

## Notation & Formatting Rules
- **Math Symbols**: $r$ for discount rate, $PV$ for Present Value, $FV$ for Future Value.
- **Code/Formula Style**: Use LaTeX inline ($...$) and block ($$...$$).
- **Callout Style**: Use standard GFM quotes (`> [!NOTE]`, `> [!EXAMPLE]`).

## Chapter Directory & Status

| Ch # | Title | File Path | Status | Last Audit Date |
|---|---|---|---|---|
| 1 | Introduction to Financial Management | `chapters/ch01.md` | Completed | 2026-08-13 |
| 2 | Time Value of Money | `chapters/ch02.md` | Draft | 2026-08-13 |
| 3 | Risk & Return | `chapters/ch03.md` | Planned | - |
```
