module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-sass-guidelines',
    'stylelint-config-prettier-scss',
    'stylelint-config-prettier'
  ],
  plugins: ['stylelint-scss', 'stylelint-selector-bem-pattern'],
  rules: {
    indentation: 2,
    'selector-max-compound-selectors': null,
    'selector-no-qualifying-type': null,
    'max-nesting-depth': null
  }
};
