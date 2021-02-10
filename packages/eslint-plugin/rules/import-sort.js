'use strict';
// @ts-check

const CSS_IMPORT = /\.(css|less|scss|sass)$/;
const MODULE_PATH_REGEX = /[./]*(.*)$/;
/**
 * Function supplied to an array's sort method that works on the path and module name skipping ., .. and /
 */
const relativeModuleSort = (a, b) => {
  const aSource = MODULE_PATH_REGEX.exec(a.source.value)[1];
  const bSource = MODULE_PATH_REGEX.exec(b.source.value)[1];

  return aSource > bSource ? 1 : aSource === bSource ? 0 : -1;
};

/**
 * Partitions the import specifiers in the given import declaration node based on the import type.
 * i.e ImportDefaultSpecifier, ImportNamespaceSpecifier and ImportSpecifier
 *
 *  For example, `import * as React, {useState, useCallback} from 'react';` the following will be returned
 *  {
 *    namespaceSpecifier: <node for `* as React`> ,
 *    importSpecifier: [<node for `useState`>, <node for `useCallback`>]
 *  }
 */
const partitionImportSpecifiers = (importDeclaration) => {
  if (importDeclaration.specifiers.length === 0) {
    return {
      defaultSpecifier: null,
      namespaceSpecifier: null,
      importSpecifiers: null,
    };
  }

  const defaultSpecifier = importDeclaration.specifiers.filter(
    (specifier) => specifier.type === 'ImportDefaultSpecifier',
  )[0];
  const namespaceSpecifier = importDeclaration.specifiers.filter(
    (specifier) => specifier.type === 'ImportNamespaceSpecifier',
  )[0];
  const importSpecifiers = importDeclaration.specifiers.filter((specifier) => specifier.type === 'ImportSpecifier');

  return { defaultSpecifier, namespaceSpecifier, importSpecifiers };
};

/**
 * Sorts the import specifiers for the given import declaration node in the following order.
 *    1. Default Specifier (i.e `React` in `import React, {useState} from 'react'`)
 *    2. Namespace Specifier (i.e `* as React` in `import * as React, {useState} from 'react'`)
 *    3. Import Specifier (i.e `useState, useCallback` in `import * as React, {useState, useCallback} from 'react'`)
 */
const sortImportSpecifiers = (importDeclaration) => {
  const { defaultSpecifier, namespaceSpecifier, importSpecifiers } = partitionImportSpecifiers(importDeclaration);
  if (!importSpecifiers) {
    return importDeclaration;
  }

  importSpecifiers.sort((a, b) => a.imported.name.localeCompare(b.imported.name));

  importDeclaration.specifiers = [defaultSpecifier, namespaceSpecifier, ...importSpecifiers].filter(
    (specifier) => !!specifier,
  );

  return importDeclaration;
};

/**
 * Returns the text representation of the given import specifier node.
 */
const printImportSpecifier = (importSpecifier) => {
  switch (importSpecifier.type) {
    case 'ImportDefaultSpecifier':
      return importSpecifier.local.name;
    case 'ImportNamespaceSpecifier':
      return `* as ${importSpecifier.local.name}`;
    case 'ImportSpecifier':
      return importSpecifier.local.name !== importSpecifier.imported.name
        ? `${importSpecifier.imported.name} as ${importSpecifier.local.name}`
        : importSpecifier.imported.name;
  }
};

/**
 * Returns the text representation of the given import declaration node.
 *
 * NOTE: The built-in `context.getSourceCode().getText(node)` can also return the text representation of a node, but it
 * preserves the original positions of the import specifiers within the import declaration.
 */
const printImportDeclaration = (context, importDeclaration) => {
  const source = importDeclaration.source.value;
  const partitionedImportSpecifiers = partitionImportSpecifiers(importDeclaration);

  const importSpecifiersText = Object.entries(partitionedImportSpecifiers).reduce(
    (importSpecifiersText, [type, importSpecifiers]) => {
      if (importSpecifiers == null || importSpecifiers.length === 0) {
        return importSpecifiersText;
      }

      importSpecifiersText = importSpecifiersText !== '' ? `${importSpecifiersText}, ` : importSpecifiersText;

      if (type === 'importSpecifiers') {
        // There could be more than one specifier for type `ImportSpecifier`, so join them together.
        const combinedImportSpecifiersText = importSpecifiers.map(printImportSpecifier).join(', ');
        importSpecifiersText = `${importSpecifiersText}{ ${combinedImportSpecifiersText} }`;
      } else {
        // There could only be one import specifier for other types i.e `ImportDefaultSpecifier` and
        // `ImportNamespaceSpecifier`.
        importSpecifiersText = `${importSpecifiersText}${printImportSpecifier(importSpecifiers)}`;
      }

      return importSpecifiersText;
    },
    '',
  );

  // Try to preserve the preceding comments for each import declaration.
  const sourceCode = context.getSourceCode();
  const isFirstImport = source === sourceCode.ast.body.filter((s) => s.type === 'ImportDeclaration')[0].source.value;
  let prefix = '';
  if (!isFirstImport) {
    // Don't re-write the preceding comments of the first node since they may not be specific to the import statement.
    const comments = sourceCode
      .getCommentsBefore(importDeclaration)
      .map((comment) => sourceCode.getText(comment))
      .join('\n');

    prefix = comments ? `${comments}\n` : '';
  }

  return importSpecifiersText !== ''
    ? `${prefix}import ${importSpecifiersText} from '${source}';`
    : `${prefix}import '${source}';`;
};

/**
 * Returns a custom textual representation of import declarations which will be used to verify if they are already
 * sorted. For example
 *
 *   `import React, {useState, useCallback} from 'react';\nimport angular from 'angular';`
 *    will be written as
 *   `react: React, useState, useCallback\nangular: angular`
 */
const getText = (importDeclarations) => {
  return importDeclarations.reduce((output, importDeclaration) => {
    const specifiersText = (importDeclaration.specifiers || []).map((s) => s.local.name).join(',');
    return `${output}\n${importDeclaration.source.value}: ${specifiersText}`;
  }, '');
};

/**
 * @type {RuleModule}
 *
 * Ensures the import declarations (along with their import specifiers) are sorted based on the following category
 * and alphabetically within each category.
 *  1. import npm package
 *  2. import @spinnaker package
 *  3. import modules using relative path
 *  4. import css modules
 *
 *  NOTE: `ImportDeclaration` refers to the entire import statement. i.e `import foo from './foo';`. `ImportSpecifier`
 *  refers to the members that are imported from the module. i.e `foo` in `import foo from './foo';`
 */
module.exports = {
  create(context) {
    return {
      Program(program) {
        const importDeclarations = program.body.filter((node) => node.type === 'ImportDeclaration');

        if (!importDeclarations.length) {
          return;
        }
        const start = importDeclarations[0].range[0];
        const end = importDeclarations[importDeclarations.length - 1].range[1];
        const originalTextOfImportDeclarations = getText(importDeclarations);

        // Partition the import declarations into four groups `package`, `spinnaker`, `relativeModule`, `css` so that
        // import declarations within each partition can be sorted alphabetically and written back in the expected
        // partition order.
        const partitions = importDeclarations.reduce(
          (partitions, declarationNode) => {
            if (CSS_IMPORT.test(declarationNode.source.value)) {
              partitions.css.push(declarationNode);
            } else if (declarationNode.source.value.startsWith('@spinnaker')) {
              partitions.spinnaker.push(declarationNode);
            } else if (declarationNode.source.value.startsWith('.')) {
              partitions.relativeModule.push(declarationNode);
            } else {
              partitions.package.push(declarationNode);
            }
            return partitions;
          },
          {
            package: [],
            spinnaker: [],
            relativeModule: [],
            css: [],
          },
        );

        const sortedImportedDeclarations = Object.values(partitions).map((importDeclarations) =>
          importDeclarations
            // Sort import specifiers within each import declaration
            .map(sortImportSpecifiers)
            // Now sort all import declarations alphabetically within each partition
            .sort(relativeModuleSort),
        );
        const sortedTextOfImportDeclarations = getText(sortedImportedDeclarations.flat());

        if (originalTextOfImportDeclarations === sortedTextOfImportDeclarations) {
          return;
        }

        const importDeclarationsText = sortedImportedDeclarations
          .filter((declarationList) => declarationList.length > 0)
          .map((importDeclarations) =>
            // Print the code from sorted import declarations for each partition
            importDeclarations
              .map((importDeclaration) => printImportDeclaration(context, importDeclaration))
              .join('\n'),
          )
          // Combine sorted declarations from each partition
          .join('\n\n');

        context.report({
          fix: (fixer) => fixer.replaceTextRange([start, end], importDeclarationsText),
          message: 'Sort the import statements',
          node: importDeclarations[0],
        });
      },
    };
  },
  meta: {
    fixable: 'code',
    type: 'problem',
    docs: {
      description: 'Sort the import statements',
    },
  },
};
