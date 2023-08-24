import { defineInlineTest } from 'jscodeshift/src/testUtils';
import * as transform from './ts-satisfies';

describe('ts-satisfies', () => {
  defineInlineTest(
    transform,
    {},
    `const applicationLevelRoutes: Model = { label: 'Label' };`,
    `const applicationLevelRoutes = { label: 'Label' } satisfies Model;`,
    'handles simple types',
  );

  defineInlineTest(
    transform,
    {},
    `const applicationLevelRoutes: Model[] = [ { label: 'Label' } ];`,
    `const applicationLevelRoutes = [ { label: 'Label' } ] satisfies Model[];`,
    'handles array types',
  );

  defineInlineTest(
    transform,
    {},
    `const meta: Meta<Foo> = { title: 'Title' }; `,
    `const meta = { title: 'Title' } satisfies Meta<Foo>; `,
    'handles generic types',
  );

  defineInlineTest(
    transform,
    {},
    `const A = {} as Foo, B: Bar = {};`,
    `const A = {} satisfies Foo, B = {} satisfies Bar;`,
    'handles multiple declerations',
  );

  defineInlineTest(
    transform,
    {},
    `const A: Foo = {} as Foo;`,
    `const A = {} satisfies Foo;`,
    'handles both type annotations',
  );

  defineInlineTest(
    transform,
    {},
    `build({ field: null, isVisible: true } as Foo);`,
    `build({ field: null, isVisible: true } satisfies Foo);`,
    'handles function args',
  );
});
