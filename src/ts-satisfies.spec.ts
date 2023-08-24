import { runInlineTest } from 'jscodeshift/src/testUtils';
import * as transform from './ts-satisfies';
import { Options } from 'jscodeshift';

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

  it('handles type restrictions', () => {
    transformTest(
      `const A = {} as T, B: U = {}, C = {} as V;`,
      `const A = {} as T, B = {} satisfies U, C = {} satisfies V;`,
      { types: ['U', 'V'] },
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

  it('handles function args', () => {
    transformTest(`f({ foo: null } as T);`, `f({ foo: null } satisfies T);`);
  });

  it('not modify function', () => {
    transformTest(`const x: Fn = () => null`, `const x: Fn = () => null`);
  });

  it('not modify casts', () => {
    transformTest(`const x = bar.foo as T`, `const x = bar.foo as T`);
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
