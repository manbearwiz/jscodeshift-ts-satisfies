import { defineInlineTest } from 'jscodeshift/src/testUtils';
import * as transform from './ts-satisfies';

describe('ts-satisfies', () => {
  defineInlineTest(
    transform,
    {},
    `const route: Route = { label: 'Label' };`,
    `const route = { label: 'Label' } satisfies Route;`,
    'handles simple types',
  );

  defineInlineTest(
    transform,
    { types: ['Bar', 'Biz'] },
    `const A = {} as Foo, B: Bar = {}, C = {} as Biz;`,
    `const A = {} as Foo, B = {} satisfies Bar, C = {} satisfies Biz;`,
    'handles type restrictions',
  );

  defineInlineTest(
    transform,
    {},
    `const routes: Route[] = [ { label: 'Label' } ];`,
    `const routes = [ { label: 'Label' } ] satisfies Route[];`,
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
    { types: ['Meta'] },
    `const meta: Meta<Foo> = {}, bar: Bar = {}; `,
    `const meta = {} satisfies Meta<Foo>, bar: Bar = {}; `,
    'handles generic type restriction',
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
    `f({ foo: null } as Foo);`,
    `f({ foo: null } satisfies Foo);`,
    'handles function args',
  );

  defineInlineTest(
    transform,
    {},
    `const x: Fn = () => { return null; }`,
    `const x: Fn = () => { return null; }`,
    'not modify function',
  );

  defineInlineTest(
    transform,
    {},
    `const x = bar.foo as Foo`,
    `const x = bar.foo as Foo`,
    'not modify casts',
  );
});
