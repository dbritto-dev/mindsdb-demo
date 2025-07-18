module.exports = {
    env: {
        node: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:prettier/recommended'
    ],
    plugins: ['prettier'],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        'indent': ['error', 2],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'prefer-template': 'error',
        'prettier/prettier': 'error',
    },
    overrides: [
        {
            files: ['src/**/*.js'],
            env: {
                node: true,
            },
        },
    ],
}; 