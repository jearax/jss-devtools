import CodeBlock from '@/components/CodeBlock/CodeBlock';
import CopyButton from '@/components/CopyButton/CopyButton';
import {
	HARNESS_KNOWLEDGE_TABLE,
	HARNESS_LIMITS,
	HARNESS_SECURITY,
	HARNESS_SESSION_CONTEXT,
	HARNESS_SKILLS
} from '@/constants/harness.constant';
import RichText from '@/pages/Docs/components/RichText/RichText';

/** The body of the "Private or shared knowledge" section of the harness page. */
export const KnowledgeSection = () => {
	return (
		<>
			<p>
				By default <code>init</code> keeps harness knowledge out of git: the memory, the decisions, the docs, the plans
				and learned skills are gitignored and stay on this machine. <code>init --share-knowledge</code> keeps them in
				git instead, so a clone carries the team&rsquo;s knowledge.
			</p>
			<table>
				<thead>
					<tr>
						<th scope="col">&nbsp;</th>
						<th scope="col">Ignored (default)</th>
						<th scope="col">--share-knowledge</th>
					</tr>
				</thead>
				<tbody>
					{HARNESS_KNOWLEDGE_TABLE.map((row) => {
						return (
							<tr key={row.area}>
								<td>{row.area}</td>
								<td>
									<RichText text={row.ignored} />
								</td>
								<td>
									<RichText text={row.shared} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<p>
				To change the key later, edit <code>knowledge.share</code> in <code>.harness/config.json</code> and run{' '}
				<code>jss-devtools harness update</code>; it re-renders the two ignore files. Going private then needs you to
				untrack the knowledge with <code>git rm -r --cached</code> on the paths; sharing needs <code>git add</code>. The
				CLI never runs git itself.
			</p>
			<CodeBlock
				code={
					'jss-devtools harness update\n# then, to go private:\ngit rm -r --cached .harness/MEMORY.md .harness/decisions .harness/docs .harness/plans .harness/curator.json\n# or, to share:\ngit add .harness/MEMORY.md .harness/decisions .harness/docs .harness/plans .harness/curator.json'
				}
				language="sh"
				prompt={{ dir: 'my-app' }}
				title="flip the key, then move the files"
				headerAction={
					<CopyButton
						feedback="icon"
						label="Copy the knowledge flip commands"
						value={
							'jss-devtools harness update\ngit rm -r --cached .harness/MEMORY.md .harness/decisions .harness/docs .harness/plans .harness/curator.json'
						}
					/>
				}
			/>
			<p>
				Private mode cannot back the knowledge up, cannot put it on a fresh clone or a second machine, and counts skill
				usage per machine. A hand-written skill under <code>.claude/skills/</code> that git does not track yet is
				ignored too; the ignore file keeps <code>!/harness-*/</code> and <code>!/ak-*/</code> so the harness-owned
				folders stay tracked, and an edit to that managed ignore file survives <code>harness update</code> through the
				normal merge.
			</p>
		</>
	);
};

/** The body of the "Security" section of the harness page. */
export const SecuritySection = () => {
	return (
		<>
			<p>
				The hooks run on every session, so what can write them and what checks them matters. The table below is the
				whole model: what runs, what compares it, and what the content check reads.
			</p>
			<table>
				<thead>
					<tr>
						<th scope="col">Topic</th>
						<th scope="col">What the harness does</th>
					</tr>
				</thead>
				<tbody>
					{HARNESS_SECURITY.map((item) => {
						return (
							<tr key={item.topic}>
								<td>{item.topic}</td>
								<td>
									<RichText text={item.detail} />
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			<p>
				Run <code>jss-devtools harness doctor</code> before pushing: it exits 1 when any check fails, and its upgrade
				note matters on an existing repository &mdash; after installing this CLI, run{' '}
				<code>jss-devtools harness update</code> once. Until that update, the doctor&rsquo;s <code>Hook files</code>{' '}
				error is expected: the CLI now ships a different bundle at the same version.
			</p>
		</>
	);
};

/** The body of the "At the start of a session" section of the harness page. */
export const SessionStartSection = () => {
	return (
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
	);
};

/** The body of the "The skills" section of the harness page. */
export const SkillsSection = () => {
	return (
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
	);
};

/** The body of the "The limits" section of the harness page. */
export const LimitsSection = ({ hookTimeout }: { hookTimeout: string }) => {
	return (
		<>
			<p>
				The harness is bounded on purpose. The memory is a budget, not a log, and the guard hook stops a write that
				would break it.
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
			<p>Every hook is capped at {hookTimeout} and always exits 0: a hook must never block a session.</p>
		</>
	);
};
