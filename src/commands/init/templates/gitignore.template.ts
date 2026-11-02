export const gitignoreTemplate = (): string => {
	return `node_modules/
.pnpm-store/
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
.pnp.*

dist/
build/
out/
.output/
*.tsbuildinfo
*.tgz

.next/
.nuxt/
.svelte-kit/
.astro/
.turbo/
.vercel/
.netlify/
storybook-static/

coverage/
.nyc_output/
playwright-report/
test-results/
blob-report/

.cache/
.parcel-cache/
.eslintcache
.stylelintcache

logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
*.pid
*.pid.lock

.env
.env.*
!.env.example

tmp/
temp/

.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
!.vscode/tasks.json
.idea/
.history/
*.swp
*.swo
*~

.DS_Store
._*
Thumbs.db
desktop.ini
`;
};
