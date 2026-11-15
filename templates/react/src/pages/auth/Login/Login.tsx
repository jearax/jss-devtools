import useAuth from '@/hooks/useAuth/useAuth';

const Login = () => {
	const { signIn } = useAuth();

	return (
		<section>
			<h1>Hello Login</h1>
			<button type="button" onClick={signIn}>
				Sign in
			</button>
		</section>
	);
};

export default Login;
