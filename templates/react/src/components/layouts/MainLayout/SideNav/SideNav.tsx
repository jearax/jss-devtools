import { Link } from 'react-router';

import { ROUTES } from '@/router/routes.constant';

const NAV_LINKS = [
	{
		label: 'Home',
		to: ROUTES.HOME
	},
	{
		label: 'Login',
		to: ROUTES.LOGIN
	},
	{
		label: 'Dashboard',
		to: ROUTES.DASHBOARD
	}
];

const SideNav = () => {
	return (
		<nav>
			{NAV_LINKS.map((link) => {
				return (
					<Link key={link.to} to={link.to}>
						{link.label}
					</Link>
				);
			})}
		</nav>
	);
};

export default SideNav;
