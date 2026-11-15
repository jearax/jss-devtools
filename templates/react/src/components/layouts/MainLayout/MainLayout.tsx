import { useBooleanFlagValue } from '@openfeature/react-sdk';
import { Outlet } from 'react-router';

import Footer from '@/components/layouts/MainLayout/Footer/Footer';
import Header from '@/components/layouts/MainLayout/Header/Header';
import Sidebar from '@/components/layouts/MainLayout/Sidebar/Sidebar';
import { SIDEBAR_FLAG_KEY } from '@/contexts/FeatureFlags/FeatureFlags.config';

const MainLayout = () => {
	const sidebarEnabled = useBooleanFlagValue(SIDEBAR_FLAG_KEY, true);

	return (
		<div>
			<Header />
			{sidebarEnabled && <Sidebar />}
			<main>
				<Outlet />
			</main>
			<Footer />
		</div>
	);
};

export default MainLayout;
