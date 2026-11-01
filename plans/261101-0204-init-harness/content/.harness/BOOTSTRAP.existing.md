# Onboarding pending

The harness was just installed into a project that already has code. Run the `harness-onboard`
skill; it deletes this file when onboarding is done.

1. Read the README, the build, test and CI config, and the top-level layout.
2. Trace one real path end to end: entry point, core logic, its test.
3. Find how to build, test, lint and run, and what about it is not obvious.
4. Write `.harness/docs/architecture.md` from its template, its row in `.harness/docs/README.md`,
   and a memory line pointing to it.
5. Add the non-obvious facts to `.harness/MEMORY.md`, each with `(src: path)`.
6. Ask the user the policy questions the code cannot answer, and record the answers as decisions.
