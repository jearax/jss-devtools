import { type ComponentProps, type ElementType } from 'react';

// `as` is the only inference site for C: NoInfer keeps the element's own props from leaking
// candidates into the inference, so `as="a"` unlocks `href` and a missing `as` rejects it.
export type PolymorphicProps<C extends ElementType> = {
	as?: C;
} & NoInfer<Omit<ComponentProps<C>, 'as'>>;

const Polymorphic = <C extends ElementType = 'div'>({ as: Tag, ...props }: PolymorphicProps<C>) => {
	const Element = Tag ?? 'div';

	return <Element {...props} />;
};

export default Polymorphic;
