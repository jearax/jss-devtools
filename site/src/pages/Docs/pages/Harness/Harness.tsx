import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import Terminal from '@/components/Terminal/Terminal';
import { HARNESS_HOOKS, HARNESS_LIMITS } from '@/constants/harness.constant';
import { HARNESS_SETTINGS_JSON } from '@/constants/snippets.constant';
import { HARNESS_TRANSCRIPT, TERMINAL_LABEL } from '@/constants/transcripts.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { meta } from '@/pages/Docs/pages/Harness/Harness.constant';
import {
	KnowledgeSection,
	LimitsSection,
	SecuritySection,
	SessionStartSection,
	SkillsSection
} from '@/pages/Docs/pages/Harness/Sections';

const HOOK_TIMEOUT =
	HARNESS_LIMITS.find((limit) => {
		return limit.label === 'Hook timeout';
	})?.value ?? '30 seconds';

const Harness = () => {
	return (
		<DocPage
			title="harness"
			summary="The repository harness, and the agent workflow it installs."
			sections={[
				{
					...meta('what-it-is'),
					body: (
						<>
							<p>
								The harness is a folder in the repository &mdash; <code>.harness/</code> &mdash; and the hooks Claude
								Code runs when a session starts, when a tool writes, and when a session ends. <code>init</code> installs
								it by default; <code>--no-harness</code> leaves it out.
							</p>
							<p>
								Its purpose is one sentence: the repository, not the chat context, is the authority an agent works from.
								So the decisions, the memory and the plan live in files that survive the session, and the agent is
								pointed at them when it starts.
							</p>
						</>
					)
				},
				{
					...meta('the-hooks'),
					body: (
						<>
							<p>
								The hooks are written into <code>.claude/settings.json</code>. Each one has a limit on what it watches,
								so the memory guard only sees the tools that can write to the memory.
							</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Event</th>
										<th scope="col">Watches</th>
										<th scope="col">What it does</th>
									</tr>
								</thead>
								<tbody>
									{HARNESS_HOOKS.map((hook) => {
										return (
											<tr key={`${hook.event}-${hook.matcher ?? 'all'}`}>
												<td>
													<code>{hook.event}</code>
												</td>
												<td>{hook.matcher === null ? 'every tool' : <RichText text={hook.matcher} />}</td>
												<td>
													<RichText text={hook.note} />
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
					...meta('the-file'),
					body: (
						<>
							<p>
								The hooks go into the project&rsquo;s <code>.claude/settings.json</code>, under a single{' '}
								<code>hooks</code> key. This is the file, from a real run:
							</p>
							<CodeBlock code={HARNESS_SETTINGS_JSON} language="json" title=".claude/settings.json" />
						</>
					)
				},
				{
					...meta('knowledge'),
					body: <KnowledgeSection />
				},
				{
					...meta('security'),
					body: <SecuritySection />
				},
				{
					...meta('session-start'),
					body: <SessionStartSection />
				},
				{
					...meta('the-skills'),
					body: <SkillsSection />
				},
				{
					...meta('the-commands'),
					body: (
						<>
							<p>
								<code>harness doctor</code> checks the harness installed in this repository: the manifest, the hook
								entries, the hook files against the CLI, the memory limits, the index drift, the decision records,
								secrets and private data in the files git would publish, symlinks, the learned skills, the knowledge
								state, and the managed-file drift.
							</p>
							<p>
								On a repository installed by an older CLI build, run <code>jss-devtools harness update</code> once after
								installing this CLI. Until that update the doctor reports the <code>Hook files</code> error: the bundle
								changed outside <code>harness update</code>, and the update migrates it.
							</p>
							<Terminal
								label={TERMINAL_LABEL}
								comment="Check the harness installed in this repository"
								lines={HARNESS_TRANSCRIPT}
								title="harness doctor"
							/>
							<p>It exits 0 when the harness is healthy or has warnings only, and 1 when any check fails.</p>
							<p>
								<code>harness update</code> brings the harness to the installed CLI version and keeps your edits. When a
								file conflicts, it stages the conflict and asks you to resolve it; your live files are never changed
								behind your back.
							</p>
							<CodeBlock
								code="jss-devtools harness update --dry-run"
								language="sh"
								prompt={{ dir: 'my-app' }}
								title="update"
								headerAction={
									<CopyButton
										feedback="icon"
										label="Copy the harness update command"
										value="jss-devtools harness update --dry-run"
									/>
								}
							/>
							<CodeBlock
								code="jss-devtools harness update --continue"
								language="sh"
								prompt={{ dir: 'my-app' }}
								title="resume"
								headerAction={
									<CopyButton
										feedback="icon"
										label="Copy the harness update command"
										value="jss-devtools harness update --continue"
									/>
								}
							/>
						</>
					)
				},
				{
					...meta('the-limits'),
					body: <LimitsSection hookTimeout={HOOK_TIMEOUT} />
				}
			]}
		/>
	);
};

export default Harness;
