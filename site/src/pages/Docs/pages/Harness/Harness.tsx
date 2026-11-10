import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import Terminal from '@/components/Terminal/Terminal';
import { HARNESS_HOOKS, HARNESS_LIMITS, HARNESS_SESSION_CONTEXT, HARNESS_SKILLS } from '@/constants/harness.constant';
import { HARNESS_SETTINGS_JSON } from '@/constants/snippets.constant';
import { HARNESS_TRANSCRIPT, TERMINAL_LABEL } from '@/constants/transcripts.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import RichText from '@/pages/Docs/components/RichText/RichText';
import { meta } from '@/pages/Docs/pages/Harness/Harness.constant';

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
							<p>Every hook is capped at {HOOK_TIMEOUT} and always exits 0: a hook must never block a session.</p>
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
					...meta('session-start'),
					body: (
						<>
							<p>
								The <code>SessionStart</code> hook is what makes the difference. It tells the agent:
							</p>
							<ul>
								{HARNESS_SESSION_CONTEXT.map((item) => {
									return <li key={item}>{item}</li>;
								})}
							</ul>
							<p>None of this is in the chat window, so none of it is lost when the window is cleared or compacted.</p>
						</>
					)
				},
				{
					...meta('the-skills'),
					body: (
						<>
							<p>The harness ships three skills, and installs them where the agent will find them.</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Skill</th>
										<th scope="col">What it does</th>
									</tr>
								</thead>
								<tbody>
									{HARNESS_SKILLS.map((skill) => {
										return (
											<tr key={skill.skill}>
												<td>
													<code>{skill.skill}</code>
												</td>
												<td>
													<RichText text={skill.what} />
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
					...meta('the-commands'),
					body: (
						<>
							<p>
								<code>harness doctor</code> checks the harness installed in this repository: the manifest, the hook
								entries, the hook files, the memory limits, the index drift, the decision records, the secrets in{' '}
								<code>.harness/</code>, the learned skills, and the managed-file drift.
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
					body: (
						<>
							<p>
								The harness is bounded on purpose. The memory is a budget, not a log, and the guard hook stops a write
								that would break it.
							</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Limit</th>
										<th scope="col">Value</th>
									</tr>
								</thead>
								<tbody>
									{HARNESS_LIMITS.map((limit) => {
										return (
											<tr key={limit.label}>
												<td>{limit.label}</td>
												<td>{limit.value}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</>
					)
				}
			]}
		/>
	);
};

export default Harness;
