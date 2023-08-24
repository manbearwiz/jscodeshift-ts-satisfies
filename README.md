# jscodeshift-ts-satisfies

[![npm](https://img.shields.io/npm/v/jscodeshift-ts-satisfies?style=flat-square)](https://www.npmjs.com/package/jscodeshift-ts-satisfies?activeTab=versions)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/jscodeshift-ts-satisfies?style=flat-square)](https://bundlephobia.com/package/jscodeshift-ts-satisfies)
[![NPM](https://img.shields.io/npm/l/jscodeshift-ts-satisfies?style=flat-square)](https://raw.githubusercontent.com/manbearwiz/jscodeshift-ts-satisfies/master/LICENSE)
[![npm](https://img.shields.io/npm/dt/jscodeshift-ts-satisfies?style=flat-square)](https://www.npmjs.com/package/jscodeshift-ts-satisfies)
[![GitHub issues](https://img.shields.io/github/issues/manbearwiz/jscodeshift-ts-satisfies?style=flat-square)](https://github.com/manbearwiz/jscodeshift-ts-satisfies/issues)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release&style=flat-square)](https://github.com/semantic-release/semantic-release)

A jscodeshift codemod to transform type annotations to use TS4.9+ satisfies keyword

## Installation

Install [`jscodeshift`](https://github.com/facebook/jscodeshift) to run the
codemod script:

```sh
npm install -g jscodeshift
```

## Usage

```sh
jscodeshift -t https://rawgit.com/scalvert/jscodeshift-ts-satisfies/master/jscodeshift-ts-satisfies.js ./tests/
```
