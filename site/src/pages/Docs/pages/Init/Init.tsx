import CodeBlock from '@/components/CodeBlock/CodeBlock';
import Terminal from '@/components/Terminal/Terminal';
import { INIT_OPTIONS } from '@/constants/reference.constant';
import { INIT_PACKAGE_SCRIPTS } from '@/constants/snippets.constant';
import { INIT_TRANSCRIPT, TERMINAL_LABEL } from '@/constants/transcripts.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import { INIT_FILES, INIT_PRESETS } from '@/pages/Docs/Docs.constant';

const Init = () => {
	return (
		<DocPage
			title="init"
			summary="Create a project, or set up the folder you are in."
			sections={[
				{
					id: 'what-it-does',
					title: 'What it does',
					body: (
						<>
							<p>
								With a folder name, <code>init</code> creates a new project. Without one, it sets up the folder you are
								in. The two paths differ in what they read, not in what they write: the same toolchain either way.
							</p>
							<CodeBlock code="jss-devtools init my-app --pm pnpm" language="sh" prompt="$" title="a new project" />
							<CodeBlock code="jss-devtools init" language="sh" prompt="$" title="the current folder" />
						</>
					)
				},
				{
					id: 'the-flow',
					title: 'The flow',
					body: (
						<>
							<p>Every check runs before the first write, so a failure never leaves a half-written project behind.</p>
							<ul>
								<li>
									The preflight reads the folder and the machine, and refuses what it cannot do: a folder that already
									holds a project, a config <code>init</code> owns that is already there.
								</li>
								<li>The plan is built and printed. Every file it would write is listed with what it would do to it.</li>
								<li>
									You confirm it. <code>--yes</code> skips the question, which is what a CI job needs.
								</li>
								<li>
									The files are written, the packages are installed with the chosen manager, and{' '}
									<code>package.json</code> is sorted.
								</li>
							</ul>
							<p>
								After that, <code>git init</code>, the install and the sort can each still exit 1. When one does, the
								files are already written: the command says so and prints the command to finish the step by hand.
							</p>
						</>
					)
				},
				{
					id: 'the-options',
					title: 'The options',
					body: (
						<table>
							<thead>
								<tr>
									<th scope="col">Option</th>
									<th scope="col">What it does</th>
								</tr>
							</thead>
							<tbody>
								{INIT_OPTIONS.map((option) => {
									return (
										<tr key={option.flag}>
											<td>
												<code>{option.flag}</code>
											</td>
											<td>{option.meaning}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)
				},
				{
					id: 'the-files',
					title: 'The files it writes',
					body: (
						<>
							<p>
								A new project gets the toolchain, the git hooks and the editor settings. These are the files{' '}
								<code>init</code> owns, and it will not overwrite the three it considers its own &mdash;{' '}
								<code>eslint.config.mjs</code>, <code>.prettierrc.json</code> and <code>commitlint.config.mjs</code>{' '}
								&mdash; unless you pass <code>--force</code>.
							</p>
							<ul>
								{INIT_FILES.map((file) => {
									return (
										<li key={file}>
											<code>{file}</code>
										</li>
									);
								})}
							</ul>
							<p>
								With <code>--pm pnpm</code> the project also gets a <code>pnpm-workspace.yaml</code>, and with the
								harness installed it gets the <code>.harness/</code> folder and the hook entries in{' '}
								<code>.claude/settings.json</code>.
							</p>
						</>
					)
				},
				{
					id: 'the-scripts',
					title: 'The scripts it writes',
					body: (
						<>
							<p>
								A new project&rsquo;s <code>package.json</code> carries the scripts the toolchain runs: the build, the
								watch, the lint, the format, the typecheck, and the git hooks. From a real run:
							</p>
							<CodeBlock code={INIT_PACKAGE_SCRIPTS} language="json" title="package.json" />
						</>
					)
				},
				{
					id: 'the-presets',
					title: 'The presets',
					body: (
						<>
							<p>
								<code>--framework</code> declares five choices. One of them is implemented.
							</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Preset</th>
										<th scope="col">State</th>
									</tr>
								</thead>
								<tbody>
									{INIT_PRESETS.map((preset) => {
										return (
											<tr key={preset.name}>
												<td>
													<code>{preset.name}</code>
												</td>
												<td>{preset.state}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</>
					)
				},
				{
					id: 'the-dry-run',
					title: 'The dry run',
					body: (
						<>
							<p>
								<code>--dry-run</code> prints the plan and stops. Nothing is written, nothing is installed, and the
								command prints the command line that would apply it.
							</p>
							<CodeBlock code="jss-devtools init my-app --pm pnpm --dry-run" language="sh" prompt="$" title="dry run" />
							<Terminal label={TERMINAL_LABEL} lines={INIT_TRANSCRIPT} title="init --dry-run" />
						</>
					)
				}
			]}
		/>
	);
};

export default Init;
