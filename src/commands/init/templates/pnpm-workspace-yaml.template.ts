export const pnpmWorkspaceYamlTemplate = (): string => {
	return `allowBuilds:
  esbuild: true
  unrs-resolver: true

strictPeerDependencies: true

engineStrict: true
`;
};

export const pnpmWorkspaceYamlExistingTemplate = (): string => {
	return `allowBuilds:
  esbuild: true
  unrs-resolver: true
`;
};

export const pnpmWorkspaceYamlMonorepoTemplate = (): string => {
	return `packages:
  - apps/*
  - packages/*

allowBuilds:
  esbuild: true
  unrs-resolver: true

strictPeerDependencies: true

engineStrict: true
`;
};
