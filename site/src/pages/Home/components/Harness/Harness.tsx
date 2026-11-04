import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import CodeBlock from '@/components/CodeBlock/CodeBlock';
import { HARNESS_HOOKS, HARNESS_SESSION_CONTEXT, HARNESS_SKILLS } from '@/constants/harness.constant';
import { HARNESS_SETTINGS_JSON } from '@/constants/snippets.constant';

import styles from './styles.module.css';

export interface HarnessProps extends ComponentProps<'section'> {}

const Harness = ({ className, ...props }: HarnessProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.head}>
					<p className={styles.eyebrow}>The harness</p>
					<h2 className={styles.title}>
						Teach your agent <span className={styles.titleMuted}>the repository.</span>
					</h2>
					<p className={styles.lead}>
						The harness is a folder in your repository &mdash; <code className={styles.inlineCode}>.harness/</code>{' '}
						&mdash; and the hooks Claude Code runs when a session starts, when a tool writes, and when a session ends.
						It carries the decisions in force, the memory, and the plan the work is part of, so the agent starts from
						what the repository already decided.
					</p>
				</div>

				<div className={styles.split}>
					<div className={styles.hooksCard}>
						<h3 className={styles.cardTitle}>What the hooks do</h3>
						<ul className={styles.hooks}>
							{HARNESS_HOOKS.map((hook) => {
								return (
									<li key={`${hook.event}-${hook.matcher ?? 'all'}`} className={styles.hook}>
										<div className={styles.hookHead}>
											<code className={styles.hookEvent}>{hook.event}</code>
											{hook.matcher === null ? null : <code className={styles.hookMatcher}>{hook.matcher}</code>}
										</div>
										<p className={styles.hookNote}>{hook.note}</p>
									</li>
								);
							})}
						</ul>
					</div>

					<div className={styles.codeCard}>
						<CodeBlock
							className={styles.code}
							code={HARNESS_SETTINGS_JSON}
							language="json"
							title=".claude/settings.json"
						/>
						<p className={styles.codeNote}>
							The file the harness writes into the project. Every hook runs on a 30-second budget, and every hook exits
							0: a hook must never block a session.
						</p>
					</div>
				</div>

				<div className={styles.bottom}>
					<div className={styles.context}>
						<p className={styles.label}>At the start of a session the agent is told</p>
						<ul className={styles.chips}>
							{HARNESS_SESSION_CONTEXT.map((item) => {
								return (
									<li key={item} className={styles.chip}>
										{item}
									</li>
								);
							})}
						</ul>
					</div>

					<div className={styles.skills}>
						<p className={styles.label}>The skills it ships</p>
						<ul className={styles.chips}>
							{HARNESS_SKILLS.map((skill) => {
								return (
									<li key={skill.skill} className={styles.chip} title={skill.what}>
										{skill.skill}
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Harness;
