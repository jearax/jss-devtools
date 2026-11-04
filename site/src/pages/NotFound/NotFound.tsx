import { ComponentProps } from 'react';

import styles from './styles.module.css';

export interface NotFoundProps extends ComponentProps<'section'> {}

const NotFound = ({ className, ...props }: NotFoundProps) => {
	return (
		<section className={className} {...props}>
			<div className={styles.inner}>
				<p className={styles.code}>404</p>
				<h1 className={styles.title}>This page is not part of the site.</h1>
				<p className={styles.text}>
					The CLI has three commands, and the docs have six pages. Everything else is a link that goes nowhere.
				</p>
				<a className={styles.link} href="/">
					Back to the home page
				</a>
			</div>
		</section>
	);
};

export default NotFound;
