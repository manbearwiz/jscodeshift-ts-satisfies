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
  Options,
  TSTypeReference,
  TSArrayType,
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

function isTSTypeReference(node?: Node | null): node is TSTypeReference {
  return node?.type === 'TSTypeReference';
}

function isTSArrayType(node?: Node | null): node is TSArrayType {
  return node?.type === 'TSArrayType';
}

function isIdentifier(node?: Node | null): node is Identifier {
  return node?.type === 'Identifier';
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
