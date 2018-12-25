module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },

  env: {
    browser: true,
    node: true,
    es6: true
  },
  
  plugins: [
    'json',
    'promise',
    'html'
  ],
  // add your custom rules here
  rules: {
    // allow debugger during development
    'no-debugger':
      process.env.NODE_ENV && process.env.NODE_ENV.startsWith('dev') ? 0 : 2,

    'prefer-const': 'error',
    'one-var': ['off'],
    'no-var': 'error',
    'no-return-assign': ['error', 'except-parens'],
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'quote-props': ['error', 'as-needed'],
    curly: ['off', 'multi-or-nest', 'consistent'],

    'padding-line-between-statements': [
      'off'
    ],

    'promise/always-return': 'off',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-new-statics': 'error',
    'promise/no-return-in-finally': 'error'
  },

  settings: {
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: 'typescript-eslint-parser',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },

      plugins: ['typescript'],
      rules: {
        // these are off because TypeScript handles these, and ESLint otherwise gets false positives on these.
        // See: https://github.com/eslint/typescript-eslint-parser/issues/208
        'no-undef': 0,
        'no-unused-vars': 0,

        // typescript-specific rules
        'typescript/adjacent-overload-signatures': 'error', // — Require that member overloads be consecutive
        'typescript/class-name-casing': 'error', // — Require PascalCased class and interface names (class-name from TSLint)
        'typescript/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true
          }
        ], // — Require explicit return types on functions and class methods
        // 'typescript/explicit-member-accessibility': , // — Require explicit accessibility modifiers on class properties and methods (member-access from TSLint)
        // 'typescript/interface-name-prefix': , // — Require that interface names be prefixed with I (interface-name from TSLint)
        'typescript/member-delimiter-style': [
          'off',
          {
            delimiter: 'none',
            requireLast: true,
            ignoreSingleLine: true
          }
        ],
        'typescript/no-angle-bracket-type-assertion': 'error', // — Enforces the use of as Type assertions instead of <Type> assertions (no-angle-bracket-type-assertion from TSLint)
        'typescript/no-array-constructor': 'error', // — Disallow generic Array constructors
        'typescript/no-explicit-any': 'off', // — Disallow usage of the any type (no-any from TSLint)
        'typescript/no-inferrable-types': 'off', // — Disallows explicit type declarations for variables or parameters initialized to a number, string, or boolean. (no-inferrable-types from TSLint)
        'typescript/no-namespace': 'error', // — Disallow the use of custom TypeScript modules and namespaces
        'typescript/no-triple-slash-reference': 'error', // — Disallow /// <reference path="" /> comments (no-reference from TSLint)
        'typescript/no-unused-vars': 'error', // — Prevent TypeScript-specific constructs from being erroneously flagged as unused
        'typescript/no-var-requires': 'off', // — Disallows the use of require statements except in import statements (no-var-requires from TSLint)
        'typescript/type-annotation-spacing': ['off', {}] // — Require consistent spacing around type annotations
      }
    }
  ]
}
