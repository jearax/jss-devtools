import { type ComponentType, type ReactNode } from 'react';

export type ProviderComponent = ComponentType<{ children: ReactNode }>;

export interface ProvidersProps {
	providers: readonly ProviderComponent[];
	children: ReactNode;
}

const Providers = ({ providers, children }: ProvidersProps) => {
	const nestProviders = (): ReactNode => {
		return providers.reduceRight<ReactNode>((node, Provider) => {
			return <Provider>{node}</Provider>;
		}, children);
	};

	return nestProviders();
};

export default Providers;
