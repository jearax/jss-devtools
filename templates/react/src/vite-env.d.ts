/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_FEATURE_SIDEBAR?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
