import type {
  FileInfo,
  API,
  VariableDeclarator,
  Identifier,
  TSAsExpression,
  ArrowFunctionExpression,
  Node,
  Options,
  TSTypeReference,
  TSArrayType,
} from 'jscodeshift';

interface NodeTypeMap {
  VariableDeclarator: VariableDeclarator;
  TSAsExpression: TSAsExpression;
  ArrowFunctionExpression: ArrowFunctionExpression;
  TSTypeReference: TSTypeReference;
  TSArrayType: TSArrayType;
  Identifier: Identifier;
}

function nodeTypeGuard<T extends keyof NodeTypeMap>(
  type: T,
): (node?: Node | null) => node is NodeTypeMap[T] {
  return (node?: Node | null): node is NodeTypeMap[T] => node?.type === type;
}

const isVariableDeclarator = nodeTypeGuard('VariableDeclarator');
const isTSAsExpression = nodeTypeGuard('TSAsExpression');
const isArrowFunctionExpression = nodeTypeGuard('ArrowFunctionExpression');
const isTSTypeReference = nodeTypeGuard('TSTypeReference');
const isTSArrayType = nodeTypeGuard('TSArrayType');
const isIdentifier = nodeTypeGuard('Identifier');

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

        if (
          init &&
          (isTSArrayType(annotation) || isTSTypeReference(annotation)) &&
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
