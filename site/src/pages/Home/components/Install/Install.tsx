import { cn } from '@jjuidev/design-system';
import { Download, FolderCheck, ShieldCheck } from 'lucide-react';
import { ComponentProps } from 'react';

import CodeBlock from '@/components/CodeBlock/CodeBlock';
import { INSTALL_COMMAND, NODE_FLOOR } from '@/constants/cli.constant';

import styles from './styles.module.css';

export interface InstallProps extends ComponentProps<'section'> {}

const INSTALL_PATHS: readonly { label: string; value: string }[] = [
	{
		label: 'The CLI',
		value: '~/.jss-devtools/<version>/cli.mjs'
	},
	{
		label: 'The command',
		value: '~/.local/bin/jss-devtools'
	}
];

const INSTALL_ENV: readonly { name: string; meaning: string }[] = [
	{
		name: 'JSS_DEVTOOLS_BASE_URL',
		meaning: 'Where the bundle is downloaded from.'
	},
	{
		name: 'JSS_DEVTOOLS_HOME',
		meaning: 'Where the CLI is installed.'
	},
	{
		name: 'JSS_DEVTOOLS_BIN_DIR',
		meaning: 'Where the command is written.'
	}
];

const Install = ({ className, ...props }: InstallProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.head}>
					<p className={styles.eyebrow}>Install</p>
					<h2 className={styles.title}>
						One command, <span className={styles.titleMuted}>no sudo.</span>
					</h2>
				</div>

				<div className={styles.bento}>
					<article className={styles.tile} data-wide="true">
						<div className={styles.tileTitle}>
							<span className={styles.icon} aria-hidden="true">
								<Download size={18} strokeWidth={1.75} />
							</span>
							<h3 className={styles.tileHeading}>Paste it in a terminal</h3>
						</div>
						<CodeBlock
							className={styles.code}
							code={INSTALL_COMMAND}
							language="sh"
							prompt="$"
							title="install.sh"
							wrap
						/>
						<p className={styles.tileNote}>
							Needs Node {NODE_FLOOR} and <code className={styles.inlineCode}>curl</code> or{' '}
							<code className={styles.inlineCode}>wget</code>. The installer prints a PATH hint if{' '}
							<code className={styles.inlineCode}>~/.local/bin</code> is not on your PATH.
						</p>
					</article>

					<article className={styles.tile}>
						<div className={styles.tileTitle}>
							<span className={styles.icon} aria-hidden="true">
								<FolderCheck size={18} strokeWidth={1.75} />
							</span>
							<h3 className={styles.tileHeading}>Where it lands</h3>
						</div>
						<dl className={styles.paths}>
							{INSTALL_PATHS.map((path) => {
								return (
									<div key={path.label} className={styles.path}>
										<dt className={styles.pathLabel}>{path.label}</dt>
										<dd className={styles.pathValue}>{path.value}</dd>
									</div>
								);
							})}
						</dl>
					</article>

					<article className={styles.tile}>
						<div className={styles.tileTitle}>
							<span className={styles.icon} aria-hidden="true">
								<ShieldCheck size={18} strokeWidth={1.75} />
							</span>
							<h3 className={styles.tileHeading}>Verified, and yours to move</h3>
						</div>
						<p className={styles.tileNote}>
							The download is checked against its SHA-256 checksum before anything is written. The bundle is a single
							self-contained file: it carries its own runtime dependencies and runs with nothing beside it.
						</p>
						<ul className={styles.env}>
							{INSTALL_ENV.map((entry) => {
								return (
									<li key={entry.name} className={styles.envItem}>
										<code className={styles.envName}>{entry.name}</code>
										<span className={styles.envMeaning}>{entry.meaning}</span>
									</li>
								);
							})}
						</ul>
					</article>
				</div>
			</div>
		</section>
	);
};

export default Install;
