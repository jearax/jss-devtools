import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import Terminal from '@/components/Terminal/Terminal';
import { INIT_OPTIONS } from '@/constants/reference.constant';
import { INIT_PACKAGE_SCRIPTS } from '@/constants/snippets.constant';
import { INIT_TRANSCRIPT, TERMINAL_LABEL } from '@/constants/transcripts.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { INIT_FILES, INIT_PRESETS } from '@/pages/Docs/Docs.constant';
import {
	INIT_COMMANDS,
	INIT_FILES_INTRO,
	INIT_FILES_NOTE,
	INIT_FLOW_AFTER,
	INIT_FLOW_STEPS,
	INIT_MONOREPO_PARAGRAPHS,
	INIT_WHAT_IT_DOES,
	meta
} from '@/pages/Docs/pages/Init/Init.constant';

const commandBlock = (command: (typeof INIT_COMMANDS)[number]) => {
	return (
		<CodeBlock
			key={command.code}
			code={command.code}
			language="sh"
			prompt={command.prompt}
			title={command.title}
			headerAction={<CopyButton feedback="icon" label={command.label} value={command.code} />}
		/>
	);
};

const Init = () => {
	return (
		<DocPage
			title="init"
			summary="Create a project, or set up the folder you are in."
			sections={[
				{
					...meta('what-it-does'),
					body: (
						<>
							<p>
								<RichText text={INIT_WHAT_IT_DOES} />
							</p>
							{INIT_COMMANDS.slice(0, 2).map(commandBlock)}
						</>
					)
				},
				{
					...meta('the-flow'),
					body: (
						<>
							<p>Every check runs before the first write, so a failure never leaves a half-written project behind.</p>
							<ul>
								{INIT_FLOW_STEPS.map((step) => {
									return (
										<li key={step}>
											<RichText text={step} />
										</li>
									);
								})}
							</ul>
							<p>
								<RichText text={INIT_FLOW_AFTER} />
							</p>
						</>
					)
				},
				{
					...meta('the-options'),
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
											<td>
												<RichText text={option.meaning} />
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)
				},
				{
					...meta('the-files'),
					body: (
						<>
							<p>
								<RichText text={INIT_FILES_INTRO} />
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
								<RichText text={INIT_FILES_NOTE} />
							</p>
						</>
					)
				},
				{
					...meta('the-monorepo'),
					body: (
						<>
							{INIT_MONOREPO_PARAGRAPHS.map((paragraph) => {
								return (
									<p key={paragraph}>
										<RichText text={paragraph} />
									</p>
								);
							})}
						</>
					)
				},
				{
					...meta('the-scripts'),
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
					...meta('the-presets'),
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
					...meta('the-dry-run'),
					body: (
						<>
							<p>
								<code>--dry-run</code> prints the plan and stops. Nothing is written, nothing is installed, and the
								command prints the command line that would apply it.
							</p>
							{commandBlock(INIT_COMMANDS[2]!)}
							<Terminal
								label={TERMINAL_LABEL}
								comment="Set up a project, without writing anything"
								lines={INIT_TRANSCRIPT}
								title="init --dry-run"
							/>
						</>
					)
				}
			]}
		/>
	);
};

export default Init;
