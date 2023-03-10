module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-sass-guidelines',
    'stylelint-config-prettier'
  ],
  plugins: ['stylelint-scss', 'stylelint-selector-bem-pattern'],
  rules: {
    'selector-max-compound-selectors': null,
    'selector-no-qualifying-type': null,
    'max-nesting-depth': null,
    indentation: null,
    'property-no-unknown': null,
    'at-rule-no-unknown': null,
    'custom-property-pattern': null,
    'scss/no-global-function-names': null
  }
};
