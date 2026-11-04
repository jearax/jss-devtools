/**
 * The snippets the CLI writes into a project, taken from a real run of `jss-devtools init`. The
 * site shows what the CLI writes, not what it would write.
 *
 * The run: `node dist/cli.mjs init app --pm npm --yes`, in an empty folder, on Node 24.22.0.
 */

/**
 * The `.claude/settings.json` the harness installs: the five hook entries, in the shape the
 * harness writes them. From the run above.
 */
export const HARNESS_SETTINGS_JSON = `{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs\\"",
            "async": false,
            "timeout": 30
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs\\" memory-guard",
            "async": false,
            "timeout": 30
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs\\"",
            "async": true
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs\\"",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \\"$CLAUDE_PROJECT_DIR/.harness/bin/harness-hook.mjs\\"",
            "async": false,
            "timeout": 30
          }
        ]
      }
    ]
  }
}`;

/**
 * The scripts the `package.json` of a new project carries. From the run above.
 */
export const INIT_PACKAGE_SCRIPTS = `{
  "scripts": {
    "build": "tsc && tsc-alias --resolve-full-paths",
    "dev": "tsx watch src/main.ts",
    "format": "npm run lint:fix && prettier --write .",
    "lint": "eslint \\"{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\" \\"*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\"",
    "lint:fix": "eslint --fix \\"{src,lib{,s},bin{,s},script{,s},tool{,s},config{,s},type{,s},test{,s},__test{s,}__,spec{,s},e2e}/**/*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\" \\"*.{cjs,mjs,js,jsx,cts,mts,ts,tsx}\\"",
    "prepare": "husky",
    "start": "node dist/main.js",
    "typecheck": "tsc --noEmit"
  }
}`;
