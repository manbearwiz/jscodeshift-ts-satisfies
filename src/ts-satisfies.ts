import type {
  FileInfo,
  API,
  VariableDeclarator,
  Identifier,
  TSAsExpression,
  JSXIdentifier,
  TSTypeParameter,
  ArrowFunctionExpression,
  Node,
} from 'jscodeshift';

function isVariableDeclarator(
  declaration:
    | VariableDeclarator
    | Identifier
    | JSXIdentifier
    | TSTypeParameter,
): declaration is VariableDeclarator {
  return declaration?.type === 'VariableDeclarator';
}

function isTSAsExpression(node?: Node | null): node is TSAsExpression {
  return node?.type === 'TSAsExpression';
}

function isArrowFunctionExpression(
  node?: Node | null,
): node is ArrowFunctionExpression {
  return node?.type === 'ArrowFunctionExpression';
}

export default function transform(
  file: FileInfo,
  api: API,
): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.VariableDeclaration).map((path) => {
    path.node.declarations
      .filter(isVariableDeclarator)
      .filter(
        (d) =>
          d.id.type === 'Identifier' &&
          !isArrowFunctionExpression(d.init) &&
          (!!d.id.typeAnnotation || isTSAsExpression(d?.init)),
      )
      .forEach((declarator) => {
        const id = declarator.id as Identifier;
        const annotation = isTSAsExpression(declarator.init)
          ? declarator.init.typeAnnotation
          : id.typeAnnotation?.typeAnnotation;
        const init =
          isTSAsExpression(declarator.init) && !!declarator.init
            ? declarator.init.expression
            : declarator.init;
        if (init && annotation) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
          declarator.init = j.tsSatisfiesExpression(init, annotation as any);
        }
        id.typeAnnotation = null;
      });
    return path;
  });

  root.find(j.CallExpression).forEach(({ node }) => {
    node.arguments = node.arguments.map((arg) =>
      isTSAsExpression(arg)
        ? j.tsSatisfiesExpression(arg.expression, arg.typeAnnotation)
        : arg,
    );
  });

  return root.toSource();
}

export const parser = 'ts';
