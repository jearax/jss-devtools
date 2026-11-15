import useAuth from '@/hooks/useAuth/useAuth';

const Dashboard = () => {
	const { signOut } = useAuth();

	return (
		<section>
			<h1>Hello Dashboard</h1>
			<button type="button" onClick={signOut}>
				Sign out
			</button>
		</section>
	);
};

export default Dashboard;
