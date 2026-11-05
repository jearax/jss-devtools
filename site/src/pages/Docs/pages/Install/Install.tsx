import CodeBlock from '@/components/CodeBlock/CodeBlock';
import { INSTALL_COMMAND, NODE_FLOOR, REQUIREMENTS } from '@/constants/cli.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { meta } from '@/pages/Docs/pages/Install/Install.constant';

const INSTALL_PATHS: readonly { label: string; value: string }[] = [
	{
		label: 'The bundle',
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
		meaning: 'Where the bundle is installed.'
	},
	{
		name: 'JSS_DEVTOOLS_BIN_DIR',
		meaning: 'Where the command is written.'
	}
];

const Install = () => {
	return (
		<DocPage
			title="Install"
			summary="The install command, what it needs, and what it writes."
			sections={[
				{
					...meta('the-command'),
					body: (
						<>
							<p>
								One line, no sudo, nothing else to run. The installer is a POSIX shell script the site serves; it
								installs the CLI for the current user.
							</p>
							<CodeBlock code={INSTALL_COMMAND} language="sh" prompt="$" title="install.sh" wrap />
							<p>
								The bundle it downloads is a single self-contained file. It carries its own runtime dependencies and
								runs with nothing beside it, so there is no <code>node_modules</code> to install beside it.
							</p>
						</>
					)
				},
				{
					...meta('what-it-needs'),
					body: (
						<>
							<ul>
								{REQUIREMENTS.map((requirement) => {
									return (
										<li key={requirement}>
											<RichText text={requirement} />
										</li>
									);
								})}
							</ul>
							<p>
								The Node floor is enforced by the installer itself, before the download, and again by{' '}
								<code>doctor</code>. The script needs <code>curl</code> or <code>wget</code>, and a way to check a
								checksum: <code>sha256sum</code> or <code>shasum</code>.
							</p>
						</>
					)
				},
				{
					...meta('what-it-writes'),
					body: (
						<>
							<p>Two paths, both under your home directory. Nothing else on the machine is touched.</p>
							<table>
								<thead>
									<tr>
										<th scope="col">What</th>
										<th scope="col">Where</th>
									</tr>
								</thead>
								<tbody>
									{INSTALL_PATHS.map((path) => {
										return (
											<tr key={path.label}>
												<td>{path.label}</td>
												<td>
													<code>{path.value}</code>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
							<p>
								The command in <code>~/.local/bin</code> is a small shell script that runs the bundle in place, not a
								symlink, so the CLI never has to resolve a link.
							</p>
							<p>
								If <code>~/.local/bin</code> is not on your <code>PATH</code>, the installer says so and prints the line
								to add. It does not edit your shell profile for you.
							</p>
						</>
					)
				},
				{
					...meta('moving-it'),
					body: (
						<>
							<p>Three environment variables move the locations:</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Variable</th>
										<th scope="col">What it changes</th>
									</tr>
								</thead>
								<tbody>
									{INSTALL_ENV.map((entry) => {
										return (
											<tr key={entry.name}>
												<td>
													<code>{entry.name}</code>
												</td>
												<td>
													<RichText text={entry.meaning} />
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</>
					)
				},
				{
					...meta('uninstall'),
					body: (
						<p>
							Remove the two paths above: <code>~/.local/bin/jss-devtools</code> and <code>~/.jss-devtools</code>. The
							installer writes nothing else, so there is nothing else to clean up.
						</p>
					)
				},
				{
					...meta('the-floor'),
					body: (
						<p>
							The floor is <code>{NODE_FLOOR}</code>. It is declared once, in the package manifest, and the served
							script carries a copy because a shell script cannot read a manifest. The repository&rsquo;s test holds the
							two together.
						</p>
					)
				}
			]}
		/>
	);
};

export default Install;
