import { type ComponentProps, type ElementType } from 'react';

type PolymorphicProps<C extends ElementType> = ComponentProps<C> & {
	as?: C;
};

const Polymorphic = <C extends ElementType = 'div'>({ as: Tag, ...props }: PolymorphicProps<C>) => {
	const Element = (Tag ?? 'div') as ElementType;

	return <Element {...props} />;
};

export default Polymorphic;
