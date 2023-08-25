import type {
  API,
  ArrayExpression,
  FileInfo,
  Identifier,
  JSCodeshift,
  Node,
  ObjectExpression,
  Options,
  VariableDeclarator,
} from 'jscodeshift';

function isArrayOrObjectExpression(
  j: JSCodeshift,
  node?: Node | null,
): node is ArrayExpression | ObjectExpression {
  return (
    (j.ArrayExpression.check(node) && !!node.elements.length) ||
    j.ObjectExpression.check(node)
  );
}

export default function transform(
  file: FileInfo,
  api: API,
  options: Options,
): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);
  const typeRestriction = Array.isArray(options['types'])
    ? options['types']
    : null;

  root.find(j.VariableDeclaration).map((path) => {
    path.node.declarations
      .filter((x): x is VariableDeclarator => j.VariableDeclarator.check(x))
      .filter(
        (d) =>
          j.Identifier.check(d.id) &&
          ((j.TSAsExpression.check(d?.init) &&
            isArrayOrObjectExpression(j, d.init.expression)) ||
            (d.id.typeAnnotation && isArrayOrObjectExpression(j, d.init))),
      )
      .forEach((declarator) => {
        const id = declarator.id as Identifier;
        const annotation = j.TSAsExpression.check(declarator.init)
          ? declarator.init.typeAnnotation
          : id.typeAnnotation?.typeAnnotation;
        const init = j.TSAsExpression.check(declarator.init)
          ? declarator.init.expression
          : declarator.init;

        if (
          init &&
          (j.TSArrayType.check(annotation) ||
            (j.TSTypeReference.check(annotation) &&
              j.Identifier.check(annotation.typeName) &&
              annotation.typeName.name !== 'const')) &&
          (!typeRestriction ||
            (j.TSTypeReference.check(annotation) &&
              j.Identifier.check(annotation.typeName) &&
              typeRestriction.includes(annotation.typeName.name)))
        ) {
          declarator.init = j.tsSatisfiesExpression(init, annotation);
          id.typeAnnotation = null;
        }
      });
    return path;
  });

  root.find(j.CallExpression).forEach(({ node }) => {
    node.arguments = node.arguments.map((arg) =>
      j.TSAsExpression.check(arg) &&
      isArrayOrObjectExpression(j, arg.expression)
        ? j.tsSatisfiesExpression(arg.expression, arg.typeAnnotation)
        : arg,
    );
  });

  return root.toSource();
}

export const parser = 'ts';
