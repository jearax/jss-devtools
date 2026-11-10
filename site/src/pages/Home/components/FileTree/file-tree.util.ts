import { TreeNode } from '@/pages/Home/constants/repository-tree.constant';

export type TreeLine = {
	path: string;
	name: string;
	depth: number;
	dir: boolean;
	branch: string;
};

// The editor's explorer order: folders before files, each group by name, case-insensitive.
const compareNodes = (a: TreeNode, b: TreeNode) => {
	const byKind = Number(b.children !== undefined) - Number(a.children !== undefined);

	return (
		byKind ||
		a.name.localeCompare(b.name, 'en', {
			sensitivity: 'base',
			numeric: true
		})
	);
};

// `branch` is the line's prefix as `tree` prints it: a rule per open ancestor, then the elbow.
// Sibling folders drawn by name only fold into one shell brace line, `{bin,core}/`, as a reader would type them.
const foldEmptyFolders = (nodes: TreeNode[]): TreeNode[] => {
	const empty = nodes.filter((node) => {
		return node.children?.length === 0;
	});

	if (empty.length < 2) {
		return nodes;
	}

	const folded = {
		name: `{${empty
			.map((node) => {
				return node.name;
			})
			.join(',')}}`,
		children: []
	};

	return nodes.flatMap((node) => {
		if (node === empty[0]) {
			return [folded];
		}

		return empty.includes(node) ? [] : [node];
	});
};

export const flattenTree = (nodes: readonly TreeNode[], depth = 0, parent = '', prefix = ''): TreeLine[] => {
	const sorted = foldEmptyFolders([...nodes].sort(compareNodes));

	return sorted.flatMap((node, index) => {
		const dir = node.children !== undefined;
		const last = index === sorted.length - 1;
		const path = `${parent}${node.name}`;

		const line = {
			path,
			name: dir ? `${node.name}/` : node.name,
			depth,
			dir,
			branch: `${prefix}${last ? '└── ' : '├── '}`
		};

		return [line, ...flattenTree(node.children ?? [], depth + 1, `${path}/`, `${prefix}${last ? '    ' : '│   '}`)];
	});
};
