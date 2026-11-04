import Terminal from '@/components/Terminal/Terminal';
import { DOCTOR_TRANSCRIPT, TERMINAL_LABEL } from '@/constants/transcripts.constant';
import DocPage from '@/pages/Docs/components/DocPage/DocPage';
import { DOCTOR_CHECKS } from '@/pages/Docs/Docs.constant';
import { meta } from '@/pages/Docs/pages/Doctor/Doctor.constant';

const Doctor = () => {
	return (
		<DocPage
			title="doctor"
			summary="Check Node.js, git and the package managers."
			sections={[
				{
					...meta('what-it-checks'),
					body: (
						<>
							<p>
								<code>doctor</code> reads the machine and reports what it finds. There is nothing to configure and
								nothing to install: it only looks.
							</p>
							<table>
								<thead>
									<tr>
										<th scope="col">Check</th>
										<th scope="col">What it reads</th>
									</tr>
								</thead>
								<tbody>
									{DOCTOR_CHECKS.map((check) => {
										return (
											<tr key={check.label}>
												<td>{check.label}</td>
												<td>{check.what}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</>
					)
				},
				{
					...meta('the-output'),
					body: (
						<>
							<p>Each line is one check, with its own detail and its own note. The last line is the summary.</p>
							<Terminal label={TERMINAL_LABEL} lines={DOCTOR_TRANSCRIPT} title="doctor" />
						</>
					)
				},
				{
					...meta('the-glyphs'),
					body: (
						<>
							<p>Three marks, three meanings, and they mean the same thing everywhere the CLI prints.</p>
							<ul>
								<li>
									<code>✔</code> the check passed.
								</li>
								<li>
									<code>✖</code> the check failed. The line carries the fix.
								</li>
								<li>
									<code>◇</code> something is being reported, not judged &mdash; a package manager that is simply not
									installed, for instance.
								</li>
							</ul>
							<p>
								A package manager that is only missing is shown, not failed. The command fails only when there is no
								usable package manager at all, or when Node.js or git is missing.
							</p>
						</>
					)
				},
				{
					...meta('the-exit-code'),
					body: (
						<>
							<p>
								<code>doctor</code> exits 0 when every check passed and 1 when one failed. The failure message says how
								many of how many checks failed, so a script can tell what happened without parsing the output.
							</p>
							<p>
								A check that fails always carries a hint: the Node version to install, or the command to run. The
								command never exits 1 without saying what to do.
							</p>
						</>
					)
				}
			]}
		/>
	);
};

export default Doctor;
