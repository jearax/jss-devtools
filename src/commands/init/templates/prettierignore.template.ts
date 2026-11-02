export const prettierignoreTemplate = (): string => {
	return `package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lock

.yarn/

.harness/bin/
.harness/core/
`;
};
