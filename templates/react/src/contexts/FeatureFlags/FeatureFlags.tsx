import { OpenFeatureProvider } from '@openfeature/react-sdk';
import { type ReactNode } from 'react';

export type FeatureFlagsProviderProps = {
	children: ReactNode;
};

const FeatureFlagsProvider = ({ children }: FeatureFlagsProviderProps) => {
	return <OpenFeatureProvider>{children}</OpenFeatureProvider>;
};

export default FeatureFlagsProvider;
