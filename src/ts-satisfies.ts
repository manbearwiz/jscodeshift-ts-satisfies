import type {
  API,
  ASTNode,
  ASTPath,
  ArrayExpression,
  FileInfo,
  Identifier,
  JSCodeshift,
  Node,
  ObjectExpression,
  Options,
  TSArrayType,
  TSAsExpression,
  TSSatisfiesExpression,
  TSTypeReference,
  VariableDeclarator,
  TSType,
} from 'jscodeshift';

/**
 * Check if node is an ArrayExpression or ObjectExpression
 * @param j JSCodeshift API reference
 * @param node Node to check
 * @returns true if node is an ArrayExpression or ObjectExpression, false otherwise
 */
function isArrayOrObjectExpression(
  j: JSCodeshift,
  node?: Node | null,
): node is ArrayExpression | ObjectExpression {
  return (
    (j.ArrayExpression.check(node) && !!node.elements.length) ||
    j.ObjectExpression.check(node)
  );
}

/**
 * Get the TSAsExpression from a VariableDeclarator or ExportDefaultDeclaration
 * @param j JSCodeshift API reference
 * @param node Node to get TSAsExpression from
 * @returns TSAsExpression if node is a VariableDeclarator or ExportDefaultDeclaration, null otherwise
 */
function getAsExpression(
  j: JSCodeshift,
  node?: Node | null,
): TSAsExpression | null {
  let asExpression;
  if (j.VariableDeclarator.check(node)) {
    asExpression = node.init;
  } else if (j.ExportDefaultDeclaration.check(node)) {
    asExpression = node.declaration;
  }

  return j.TSAsExpression.check(asExpression) ? asExpression : null;
}

/**
 * Convert a TSAsExpression to a TSSatisfiesExpression
 * @param j JSCodeshift API reference
 * @param node Node to convert
 * @returns TSSatisfiesExpression
 */
function convertAsExpression(
  j: JSCodeshift,
  node?: Node | null,
): TSSatisfiesExpression {
  const { typeAnnotation, expression } = getAsExpression(j, node)!;

  return j.tsSatisfiesExpression(expression, typeAnnotation);
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
    j.TSArrayType.check(annotation) ||
    (j.TSTypeReference.check(annotation) &&
      j.Identifier.check(annotation.typeName) &&
      annotation.typeName.name !== 'const')
  );
}

/**
 * Extract name from a TSType
 * @param j JSCodeshift API reference
 * @param reference TSType to extract name from
 * @returns name of TSType if it is a TSTypeReference with an Identifier, null otherwise
 */
function extractNameFromTypeReference(
  j: JSCodeshift,
  reference: TSType,
): string | null {
  return j.TSTypeReference.check(reference) &&
    j.Identifier.check(reference.typeName)
    ? reference.typeName.name
    : null;
}

function getTypeNameFromType(
  j: JSCodeshift,
  annotation: TSTypeReference | TSArrayType,
): string | null {
  if (j.TSTypeReference.check(annotation)) {
    return extractNameFromTypeReference(j, annotation);
  } else if (j.TSArrayType.check(annotation)) {
    return extractNameFromTypeReference(j, annotation.elementType);
  }
  return null;
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
  const typeName = getTypeNameFromType(j, annotation);
  return !typeRestriction || (!!typeName && typeRestriction.includes(typeName));
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

  root
    .find(j.TSAsExpression)
    .map((x) => x.parent as ASTPath<ASTNode>)
    .filter(({ node }) => {
      const asExpression = getAsExpression(j, node)!;

      return (
        isArrayOrObjectExpression(j, asExpression?.expression) &&
        validTypeAnnotation(j, asExpression.typeAnnotation) &&
        restrictTypeAnnotation(j, asExpression.typeAnnotation, typeRestriction)
      );
    })
    .forEach(({ node }) => {
      const tsSatisfiesExpression = convertAsExpression(j, node)!;

      if (j.ExportDefaultDeclaration.check(node)) {
        node.declaration = tsSatisfiesExpression;
      }

      if (j.VariableDeclarator.check(node)) {
        node.init = tsSatisfiesExpression;
        (node.id as Identifier).typeAnnotation = null;
      }
    });

  root.find(j.VariableDeclaration).forEach((path) => {
    path.node.declarations
      .filter(
        (d): d is VariableDeclarator =>
          j.VariableDeclarator.check(d) &&
          j.Identifier.check(d.id) &&
          !!d.id.typeAnnotation &&
          isArrayOrObjectExpression(j, d.init),
      )
      .forEach((declarator) => {
        const id = declarator.id as Identifier;
        const annotation = id.typeAnnotation?.typeAnnotation;

        if (
          declarator.init &&
          validTypeAnnotation(j, annotation) &&
          restrictTypeAnnotation(j, annotation, typeRestriction)
        ) {
          declarator.init = j.tsSatisfiesExpression(
            declarator.init,
            annotation,
          );
          id.typeAnnotation = null;
        }
      });
  });

  root.find(j.CallExpression).forEach(({ node }) => {
    node.arguments = node.arguments.map((arg) =>
      j.TSAsExpression.check(arg) &&
      isArrayOrObjectExpression(j, arg.expression) &&
      validTypeAnnotation(j, arg.typeAnnotation) &&
      restrictTypeAnnotation(j, arg.typeAnnotation, typeRestriction)
        ? j.tsSatisfiesExpression(arg.expression, arg.typeAnnotation)
        : arg,
    );
  });

  return root.toSource();
}

export const parser = 'ts';
