import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export type AuthState = {
	isAuthenticated: boolean;
	signIn: () => void;
	signOut: () => void;
};

export const useAuthStore = create<AuthState>()((set) => {
	return {
		isAuthenticated: false,
		signIn: () => {
			return set({ isAuthenticated: true });
		},
		signOut: () => {
			return set({ isAuthenticated: false });
		}
	};
});

const useAuth = () => {
	return useAuthStore(
		useShallow((state: AuthState) => {
			return {
				isAuthenticated: state.isAuthenticated,
				signIn: state.signIn,
				signOut: state.signOut
			};
		})
	);
};

export default useAuth;
