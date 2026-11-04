import { COMMANDS } from '@/constants/commands.constant';
import { EXIT_CODES, INIT_OPTIONS, REFERENCE_LINKS } from '@/constants/reference.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import { INIT_FILES } from '@/pages/Docs/Docs.constant';

const Reference = () => {
	return (
		<DocPage
			title="Reference"
			summary="The options, the presets and the exit codes."
			sections={[
				{
					id: 'the-commands',
					title: 'The commands',
					body: (
						<table>
							<thead>
								<tr>
									<th scope="col">Command</th>
									<th scope="col">What it does</th>
								</tr>
							</thead>
							<tbody>
								{COMMANDS.map((command) => {
									return (
										<tr key={command.name}>
											<td>
												<code>jss-devtools {command.name}</code>
											</td>
											<td>{command.summary}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)
				},
				{
					id: 'the-options',
					title: 'The init options',
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
					id: 'the-exit-codes',
					title: 'The exit codes',
					body: (
						<>
							<p>
								Two codes, and no others. A failed command always exits 1, and a failed command never exits 0 &mdash;
								the previous release shipped a handler that turned a crash into exit 0, and the repository now tests
								that it cannot happen again.
							</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Code</th>
										<th scope="col">What it means</th>
									</tr>
								</thead>
								<tbody>
									{EXIT_CODES.map((exit) => {
										return (
											<tr key={exit.code}>
												<td>
													<code>{exit.code}</code>
												</td>
												<td>
													{exit.meaning}
													{exit.also === undefined ? null : (
														<>
															<br />
															<code>{exit.also.command}</code> {exit.also.meaning}
														</>
													)}
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
					id: 'the-files',
					title: 'The files init owns',
					body: (
						<>
							<p>
								<code>init</code> owns these files. It will not overwrite the three it considers its own without{' '}
								<code>--force</code>: it stops and lists them instead.
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
						</>
					)
				},
				{
					id: 'where-the-truth-lives',
					title: 'Where the truth lives',
					body: (
						<>
							<p>
								This page states what the CLI does. The repository states why, and the decision records state what was
								chosen and by whom.
							</p>
							<ul>
								{REFERENCE_LINKS.map((link) => {
									return (
										<li key={link.href}>
											<a href={link.href} rel="noreferrer" target="_blank">
												{link.label}
											</a>
										</li>
									);
								})}
							</ul>
						</>
					)
				}
			]}
		/>
	);
};

export default Reference;
