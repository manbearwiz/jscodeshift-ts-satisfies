# jscodeshift-ts-satisfies

[![npm](https://img.shields.io/npm/v/jscodeshift-ts-satisfies?style=flat-square)](https://www.npmjs.com/package/jscodeshift-ts-satisfies?activeTab=versions)
[![NPM](https://img.shields.io/npm/l/jscodeshift-ts-satisfies?style=flat-square)](https://raw.githubusercontent.com/manbearwiz/jscodeshift-ts-satisfies/master/LICENSE)
[![npm](https://img.shields.io/npm/dt/jscodeshift-ts-satisfies?style=flat-square)](https://www.npmjs.com/package/jscodeshift-ts-satisfies)
[![GitHub issues](https://img.shields.io/github/issues/manbearwiz/jscodeshift-ts-satisfies?style=flat-square)](https://github.com/manbearwiz/jscodeshift-ts-satisfies/issues)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release&style=flat-square)](https://github.com/semantic-release/semantic-release)

**jscodeshift-ts-satisfies** is a codemod for [jscodeshift](https://github.com/facebook/jscodeshift) that transforms type annotations to use the `satisfies` keyword available in TypeScript 4.9 and later.

## Installation

Before using the codemod script, make sure you have **jscodeshift** installed. You can do this using the following command:

```sh
npm install -g jscodeshift jscodeshift-ts-satisfies
```

## Usage

To apply the codemod to all TypeScript files in the `stories` directory, you can use the following command:

```sh
jscodeshift -t node_modules/jscodeshift-ts-satisfies/src/ts-satisfies.ts stories/**/*.ts
```

### Options

#### `--types`

You have the option to specify the types that should undergo transformation using the `--types` flag. Here's an example:

```sh
jscodeshift -t node_modules/jscodeshift-ts-satisfies/src/ts-satisfies.ts stories/**/*.ts --types=Meta --types=StoryObj --types=Story
```
