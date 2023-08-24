# jscodeshift-ts-satisfies

A jscodeshift codemod to transform type annotations to use TS4.9+ satisfies keyword

## Installation

Install [`jscodeshift`](https://github.com/facebook/jscodeshift) to run the
codemod script:

```
npm install -g jscodeshift
```

## Usage

```
jscodeshift -t https://rawgit.com/scalvert/jscodeshift-ts-satisfies/master/jscodeshift-ts-satisfies.js ./tests/
```
