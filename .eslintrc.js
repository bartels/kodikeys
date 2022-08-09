module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  extends: "eslint:recommended",
  rules: {
    "linebreak-style": ["error", "unix"],
    "indent": ["error", 2, {"SwitchCase": 1}],
    "quotes": "off",
    "camelcase": "off",
    "comma-dangle": "off",
    "eqeqeq": "error",
    "curly": ["error", "multi-line"],
    "no-console": "off",
    "no-loop-func": "error",
    "no-undef": "error",
    "no-trailing-spaces": "error",
    "no-unused-vars": ["error", {"vars": "all", "args": "none"}],
    "no-use-before-define": ["error", { "functions": false, "classes": true, "variables": true }],
    "semi": ["error", "never"],
    "space-before-function-paren": "error",
    "space-before-blocks": "error",
  }
}
