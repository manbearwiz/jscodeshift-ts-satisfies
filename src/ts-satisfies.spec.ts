import { runInlineTest } from 'jscodeshift/src/testUtils';
import * as transform from './ts-satisfies';
import { Options } from 'jscodeshift';
import { describe, it } from 'vitest';

function transformTest(
  input: string,
  expectedOutput: string,
  options: Options = {},
) {
  runInlineTest(transform, options, { source: input }, expectedOutput);
}

describe('ts-satisfies', () => {
  it('handles simple types', () => {
    transformTest(
      `const route: Route = { label: 'Label' };`,
      `const route = { label: 'Label' } satisfies Route;`,
    );
  });

  it('handles string unions', () => {
    transformTest(
      `const align: 'left' | 'right' = 'left';`,
      `const align = 'left' satisfies 'left' | 'right';`,
    );
  });

  it('handles intersection types', () => {
    transformTest(
      `const artist: Artist & Error = { error: 'foo'};`,
      `const artist = { error: 'foo'} satisfies Artist & Error;`,
    );
  });

  it('handles type restrictions', () => {
    transformTest(
      `const A = {} as T, B: U = {}, C = {} as V;`,
      `const A = {} as T, B = {} satisfies U, C = {} satisfies V;`,
      { types: ['U', 'V'] },
    );
  });

  it('handles expression restrictions (declaration)', () => {
    transformTest(
      `const A: T = { foo: 1 }, B = { foo: 2 } as U;`,
      `const A = { foo: 1 } satisfies T, B = { foo: 2 } as U;`,
      {
        expressions: ['declaration'],
      },
    );
  });

  it('handles expression restrictions (cast)', () => {
    transformTest(
      `const A: T = { foo: 1 }, B = { foo: 2 } as U;`,
      `const A: T = { foo: 1 }, B = { foo: 2 } satisfies U;`,
      {
        expressions: ['cast'],
      },
    );
  });

  it('handles no expression restrictions', () => {
    transformTest(
      `const A: T = { foo: 1 }, B = { foo: 2 } as U;`,
      `const A = { foo: 1 } satisfies T, B = { foo: 2 } satisfies U;`,
    );
  });

  it('handle default exports types', () => {
    transformTest(
      `export default { title: 'Title' } as Meta;`,
      `export default { title: 'Title' } satisfies Meta;`,
    );
  });

  it('handle declarations with type assertions', () => {
    transformTest(
      `const x = <Meta>{ title: 'Title' };`,
      `const x = { title: 'Title' } satisfies Meta;`,
    );
  });

  it('handle default exports types with type restriction', () => {
    transformTest(
      `export default { title: 'Title' } as Meta;`,
      `export default { title: 'Title' } satisfies Meta;`,
      { types: ['Meta'] },
    );
  });

  it('handles array types', () => {
    transformTest(
      `const a: T[] = [ { a: 1 } ];`,
      `const a = [ { a: 1 } ] satisfies T[];`,
    );
  });

  it('not modify empty arrays', () => {
    transformTest(`const a: T[] = []`, `const a: T[] = []`);
  });

  it('handles type restrictions on arrays', () => {
    transformTest(
      `const a: T[] = [ { a: 1 } ], b: U[] = [ { a: 1 } ];`,
      `const a = [ { a: 1 } ] satisfies T[], b: U[] = [ { a: 1 } ];`,
      { types: ['T'] },
    );
  });

  it('handles type restrictions on unions', () => {
    transformTest(
      `const a: A | B = { a: 1 }, b: B | C = { a: 2 };`,
      `const a = { a: 1 } satisfies A | B, b: B | C = { a: 2 };`,
      { types: ['A'] },
    );
  });

  it('handles type restrictions on intersections', () => {
    transformTest(
      `const a: A & B = { a: 1 }, b: B & C = { a: 2 };`,
      `const a = { a: 1 } satisfies A & B, b: B & C = { a: 2 };`,
      { types: ['A'] },
    );
  });

  it('handles generic types', () => {
    transformTest(
      `const meta: Meta<T> = { title: 'Title' }; `,
      `const meta = { title: 'Title' } satisfies Meta<T>; `,
    );
  });

  it('handles generic type restriction', () => {
    transformTest(
      `const meta: Meta<T> = {}, bar: Bar = {}; `,
      `const meta = {} satisfies Meta<T>, bar: Bar = {}; `,
      { types: ['Meta'] },
    );
  });

  it('handles multiple declarations', () => {
    transformTest(
      `const A = {} as T, B: Bar = {};`,
      `const A = {} satisfies T, B = {} satisfies Bar;`,
    );
  });

  it('handles both type annotations', () => {
    transformTest(`const A: T = {} as T;`, `const A = {} satisfies T;`);
  });

  it('skips function args', () => {
    transformTest(`f({ foo: null } as T);`, `f({ foo: null } as T);`);
  });

  it('not modify function', () => {
    transformTest(`const x: Fn = () => null`, `const x: Fn = () => null`);
  });

  it('not modify casts', () => {
    transformTest(`const x = bar.foo as T`, `const x = bar.foo as T`);
  });

  it('not modify casts to any', () => {
    transformTest(`const foo = bar as any`, `const foo = bar as any`);
  });

  it('not modify casts to any in functions', () => {
    transformTest(`fn({ a: 1 } as any)`, `fn({ a: 1 } as any)`);
  });

  it('not modify const assertions', () => {
    transformTest(
      `const align = ['left', 'right'] as const`,
      `const align = ['left', 'right'] as const`,
    );
  });

  it('not modify intentional any conversions in functions', () => {
    transformTest(`fn({} as any as T)`, `fn({} as any as T)`);
  });

  it('not modify intentional any conversions in declarations', () => {
    transformTest(`const a = ({} as any) as T`, `const a = ({} as any) as T`);
  });
});
