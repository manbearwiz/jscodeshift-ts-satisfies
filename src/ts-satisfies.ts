import {
  API,
  ArrayExpression,
  FileInfo,
  Identifier,
  Node,
  ObjectExpression,
  Options,
  TSArrayType,
  TSAsExpression,
  TSTypeReference,
  VariableDeclarator,
} from 'jscodeshift';

interface NodeTypeMap {
  ArrayExpression: ArrayExpression;
  ArrayOrObjectExpression: ArrayExpression | ObjectExpression;
  Identifier: Identifier;
  ObjectExpression: ObjectExpression;
  TSArrayType: TSArrayType;
  TSAsExpression: TSAsExpression;
  TSTypeReference: TSTypeReference;
  VariableDeclarator: VariableDeclarator;
}

function nodeTypeGuard<T extends keyof NodeTypeMap>(
  type: T,
): (node?: Node | null) => node is NodeTypeMap[T] {
  return (node?: Node | null): node is NodeTypeMap[T] => node?.type === type;
}

const isArrayExpression = nodeTypeGuard('ArrayExpression');
const isIdentifier = nodeTypeGuard('Identifier');
const isObjectExpression = nodeTypeGuard('ObjectExpression');
const isTSArrayType = nodeTypeGuard('TSArrayType');
const isTSAsExpression = nodeTypeGuard('TSAsExpression');
const isTSTypeReference = nodeTypeGuard('TSTypeReference');
const isVariableDeclarator = nodeTypeGuard('VariableDeclarator');

function isArrayOrObjectExpression(
  node?: Node | null,
): node is ArrayExpression | ObjectExpression {
  return isArrayExpression(node) || isObjectExpression(node);
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
      .filter(isVariableDeclarator)
      .filter(
        (d) =>
          d.id.type === 'Identifier' &&
          ((isTSAsExpression(d?.init) &&
            isArrayOrObjectExpression(d.init.expression)) ||
            (d.id.typeAnnotation && isArrayOrObjectExpression(d.init))),
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

        if (
          init &&
          (isTSArrayType(annotation) ||
            (isTSTypeReference(annotation) &&
              isIdentifier(annotation.typeName) &&
              annotation.typeName.name !== 'const')) &&
          (!typeRestriction ||
            (isTSTypeReference(annotation) &&
              isIdentifier(annotation.typeName) &&
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
      isTSAsExpression(arg)
        ? j.tsSatisfiesExpression(arg.expression, arg.typeAnnotation)
        : arg,
    );
  });

  return root.toSource();
}

export const parser = 'ts';
