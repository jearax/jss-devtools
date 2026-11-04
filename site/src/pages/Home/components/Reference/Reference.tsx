import { cn } from '@jjuidev/design-system';
import { ComponentProps } from 'react';

import { EXIT_CODES, INIT_OPTIONS, REFERENCE_LINKS } from '@/constants/reference.constant';

import styles from './styles.module.css';

export interface ReferenceProps extends ComponentProps<'section'> {}

const Reference = ({ className, ...props }: ReferenceProps) => {
	return (
		<section className={cn(styles.root, className)} {...props}>
			<div className={styles.inner}>
				<div className={styles.head}>
					<p className={styles.eyebrow}>Reference</p>
					<h2 className={styles.title}>
						Every option, <span className={styles.titleMuted}>nothing hidden.</span>
					</h2>
					<p className={styles.lead}>
						The commands take a handful of flags and answer with two exit codes. This is all of them.
					</p>
				</div>

				<div className={styles.split}>
					<div className={styles.card}>
						<h3 className={styles.cardTitle}>The init options</h3>
						<dl className={styles.options}>
							{INIT_OPTIONS.map((option) => {
								return (
									<div key={option.flag} className={styles.option}>
										<dt className={styles.flag}>
											<code className={styles.flagCode}>{option.flag}</code>
										</dt>
										<dd className={styles.meaning}>{option.meaning}</dd>
									</div>
								);
							})}
						</dl>
					</div>

					<div className={styles.side}>
						<div className={styles.card}>
							<h3 className={styles.cardTitle}>Exit codes</h3>
							<dl className={styles.list}>
								{EXIT_CODES.map((exit) => {
									return (
										<div key={exit.code} className={styles.row}>
											<dt className={styles.flag}>
												<code className={styles.code}>{exit.code}</code>
											</dt>
											<dd className={styles.meaning}>
												{exit.meaning}
												{exit.also === undefined ? null : (
													<span className={styles.also}>
														<code className={styles.flagCode}>{exit.also.command}</code> {exit.also.meaning}
													</span>
												)}
											</dd>
										</div>
									);
								})}
							</dl>
						</div>

						<div className={styles.card}>
							<h3 className={styles.cardTitle}>Where the truth lives</h3>
							<ul className={styles.links}>
								{REFERENCE_LINKS.map((link) => {
									return (
										<li key={link.href}>
											<a className={styles.link} href={link.href} rel="noreferrer" target="_blank">
												{link.label}
											</a>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</div>

				<div className={styles.cta}>
					<p className={styles.ctaText}>The docs have the same facts, with the flags and the files they touch.</p>
					<a className={styles.ctaLink} href="/docs/reference">
						Read the reference
					</a>
				</div>
			</div>
		</section>
	);
};

export default Reference;
