import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import { INSTALL_COMMAND } from '@/constants/cli.constant';
import { COMMANDS } from '@/constants/commands.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { meta } from '@/pages/Docs/pages/GettingStarted/GettingStarted.constant';

const GettingStarted = () => {
	return (
		<DocPage
			title="Getting started"
			summary="What the CLI is, and what its three commands do."
			sections={[
				{
					...meta('what-it-is'),
					body: (
						<>
							<p>
								<code>jss-devtools</code> is one CLI for the two halves of a JavaScript repository&rsquo;s toolchain.
								The first half is the part you would set up by hand: TypeScript, ESLint, Prettier, commitlint, git
								hooks, the editor settings, the package manager. The second half is the part your coding agent needs and
								cannot guess: the decisions the repository already made, the memory of what it learned, and the plan the
								work is part of.
							</p>
							<p>
								Both halves are written into the repository, not into a chat window. That is the whole idea: the
								repository outlives the session, so it should carry the rules.
							</p>
						</>
					)
				},
				{
					...meta('the-commands'),
					body: (
						<table>
							<thead>
								<tr>
									<th scope="col">Command</th>
									<th scope="col">What it does</th>
								</tr>
							</thead>
							<tbody>
								{COMMANDS.map((row) => {
									return (
										<tr key={row.name}>
											<td>
												<code>jss-devtools {row.name}</code>
											</td>
											<td>
												<RichText text={row.summary} />
												<br />
												<RichText text={row.details} />
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)
				},
				{
					...meta('first-run'),
					body: (
						<>
							<p>Install it. The installer checks the download against its checksum before it writes anything.</p>
							<CodeBlock
								code={INSTALL_COMMAND}
								language="sh"
								prompt={{
									dir: '~',
									git: false
								}}
								title="install.sh"
								wrap
								headerAction={<CopyButton feedback="icon" label="Copy the install command" value={INSTALL_COMMAND} />}
							/>
							<p>Check the machine. Every check carries its own fix, and the command exits 1 when one fails.</p>
							<CodeBlock
								code="jss-devtools doctor"
								language="sh"
								prompt={{
									dir: '~',
									git: false
								}}
								title="doctor"
								headerAction={
									<CopyButton feedback="icon" label="Copy the doctor command" value="jss-devtools doctor" />
								}
							/>
							<p>
								Then set up a project. The command asks which package manager to use, shows the whole plan before it
								writes, and asks for a confirmation.
							</p>
							<CodeBlock
								code="jss-devtools init my-app --pm pnpm"
								language="sh"
								prompt={{
									dir: '~',
									git: false
								}}
								title="init"
								headerAction={
									<CopyButton
										feedback="icon"
										label="Copy the init command"
										value="jss-devtools init my-app --pm pnpm"
									/>
								}
							/>
							<p>
								Add <code>--dry-run</code> to any of them and nothing is written: the CLI prints the plan and stops.
							</p>
						</>
					)
				},
				{
					...meta('next'),
					body: (
						<ul>
							<li>
								<a href="/docs/install">Install</a> &mdash; what the installer needs and where it writes.
							</li>
							<li>
								<a href="/docs/init">init</a> &mdash; every flag, and every file it owns.
							</li>
							<li>
								<a href="/docs/harness">harness</a> &mdash; the hooks the CLI installs for your agent.
							</li>
							<li>
								<a href="/docs/reference">Reference</a> &mdash; the options and the exit codes on one page.
							</li>
						</ul>
					)
				}
			]}
		/>
	);
};

export default GettingStarted;
