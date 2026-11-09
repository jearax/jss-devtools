---
name: harness-onboard
description: Seed the harness knowledge of a repository the harness was just installed into, by following .harness/BOOTSTRAP.md. Run when the session-start hook reports that onboarding is pending, or when the user asks to onboard the harness.
---

# Harness onboard

`.harness/BOOTSTRAP.md` holds the steps for this repository; this skill holds the rules around them.

1. Ask the user whether to onboard now. If not, stop; the hook asks again next session.
2. If the repository has a remote, `git pull`. If `.harness/BOOTSTRAP.md` is gone afterwards, a
   teammate already onboarded: stop.
3. Follow `.harness/BOOTSTRAP.md` step by step. Read only: install nothing, start nothing, change
   no code.
4. Write what you found where the table in `CLAUDE.md` says, starting each file from its template.
5. Ask the user the policy questions the code cannot answer. Record a decision only with the user's
   words; code shows what the repository does, not what it must do.
6. If `jss-devtools` is installed, run `jss-devtools harness doctor` and fix what it reports.
7. Delete `.harness/BOOTSTRAP.md`.
8. List every file you wrote and the deletion, and tell the user to commit them: until that commit
   lands, every teammate is asked to onboard again. Never stage or commit yourself.

## Pitfalls

- Skip what the README or the code already says plainly; memory is for what is hard to rediscover.
- An inference about intent is a question for the user, never a decision.
