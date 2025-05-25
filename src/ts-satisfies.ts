import type {
  API,
  ASTNode,
  ASTPath,
  FileInfo,
  JSCodeshift,
  Node,
  Options,
  TSArrayType,
  TSAsExpression,
  TSSatisfiesExpression,
  TSTypeAssertion,
  TSTypeReference,
  TSUnionType,
} from 'jscodeshift';

function isTypeAssertionOrAsExpression(
  j: JSCodeshift,
  node?: Node | null,
): node is TSAsExpression | TSTypeAssertion {
  return j.TSAsExpression.check(node) || j.TSTypeAssertion.check(node);
}

/**
 * Convert a TSAsExpression to a TSSatisfiesExpression
 * @param j JSCodeshift API reference
 * @param node Node to convert
 * @returns TSSatisfiesExpression
 */
function convertAsExpression(
  j: JSCodeshift,
  asExpression: TSAsExpression | TSTypeAssertion,
): TSSatisfiesExpression {
  return j.tsSatisfiesExpression(
    asExpression.expression,
    asExpression.typeAnnotation,
  );
}

/**
 * Check if node is a valid type annotation
 * @param j JSCodeshift API reference
 * @param annotation Node to check
 * @returns true if annotation is a valid type annotation, false otherwise
 */
function validTypeAnnotation(
  j: JSCodeshift,
  annotation?: Node | null,
): annotation is TSArrayType | TSTypeReference {
  return (
    j.TSUnionType.check(annotation) ||
    j.TSIntersectionType.check(annotation) ||
    j.TSArrayType.check(annotation) ||
    (j.TSTypeReference.check(annotation) &&
      j.Identifier.check(annotation.typeName) &&
      annotation.typeName.name !== 'const')
  );
}

/**
 * Check if annotation is in typeRestriction array
 * @param j JSCodeshift API reference
 * @param annotation type annotation to check
 * @param typeRestriction array of type names to check against
 * @returns true if annotation is in typeRestriction array, false otherwise
 */
function restrictTypeAnnotation(
  j: JSCodeshift,
  annotation: TSTypeReference | TSArrayType,
  typeRestriction?: string[] | null,
): boolean {
  const typeRefs = j.TSArrayType.check(annotation)
    ? [annotation.elementType]
    : j.TSUnionType.check(annotation) || j.TSIntersectionType.check(annotation)
      ? (annotation as TSUnionType).types
      : [annotation];

  return typeRefs.some((typeRef) => {
    const typeName =
      j.TSTypeReference.check(typeRef) &&
      j.Identifier.check(typeRef.typeName) &&
      typeRef.typeName.name;

    return (
      !typeRestriction || (!!typeName && typeRestriction.includes(typeName))
    );
  });
}

export default function transform(
  file: FileInfo,
  api: API,
  options: Options,
): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);
  const typeRestriction = Array.isArray(options['types'])
    ? (options['types'] as string[])
    : null;
  const expressionRestriction = Array.isArray(options['expressions'])
    ? (options['expressions'] as string[])
    : ['declaration', 'cast'];

  [
    root.find(j.ObjectExpression),
    root.find(j.ArrayExpression, (node) => !!node.elements.length),
    root.find(j.StringLiteral),
  ].forEach((expressionCollection) =>
    expressionCollection
      .map((x) => x.parent as ASTPath<ASTNode>)
      .forEach(({ node, parent }) => {
        if (
          expressionRestriction.includes('cast') &&
          isTypeAssertionOrAsExpression(j, node) &&
          validTypeAnnotation(j, node.typeAnnotation) &&
          restrictTypeAnnotation(j, node.typeAnnotation, typeRestriction)
        ) {
          const parentNode = (parent as ASTPath<ASTNode>).node;
          const tsSatisfiesExpression = convertAsExpression(j, node);

          if (j.ExportDefaultDeclaration.check(parentNode)) {
            parentNode.declaration = tsSatisfiesExpression;
          } else if (
            j.VariableDeclarator.check(parentNode) &&
            j.Identifier.check(parentNode.id)
          ) {
            parentNode.init = tsSatisfiesExpression;
            parentNode.id.typeAnnotation = null;
          }
        } else if (
          expressionRestriction.includes('declaration') &&
          j.VariableDeclarator.check(node) &&
          j.Identifier.check(node.id) &&
          node.init &&
          validTypeAnnotation(j, node.id.typeAnnotation?.typeAnnotation) &&
          restrictTypeAnnotation(
            j,
            node.id.typeAnnotation?.typeAnnotation,
            typeRestriction,
          )
        ) {
          node.init = j.tsSatisfiesExpression(
            node.init,
            node.id.typeAnnotation?.typeAnnotation,
          );
          node.id.typeAnnotation = null;
        }
      }),
  );

  return root.toSource();
}

export const parser = 'ts';
