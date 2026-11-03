import type { JSX } from 'react';

export const App = (): JSX.Element => {
	return (
		<main>
			<h1>jss-devtools</h1>
			<p className="tagline">Công cụ dòng lệnh cho các repository JavaScript.</p>

			<p>Cài đặt cho user hiện tại, không cần sudo:</p>
			<pre>
				<code>curl -fsSL https://jss-devtools.jjuidev.com/install.sh | sh</code>
			</pre>

			<p>
				Yêu cầu <code>Node &gt;= 24.11.0</code>, cùng <code>curl</code> hoặc <code>wget</code>.
			</p>

			<p>
				Sau khi cài, lệnh nằm ở <code>~/.local/bin/jss-devtools</code>. Thêm thư mục đó vào <code>PATH</code> nếu chưa
				có.
			</p>

			<p>
				Mã nguồn: <a href="https://github.com/jearax/jss-devtools2">github.com/jearax/jss-devtools2</a>
			</p>
		</main>
	);
};
