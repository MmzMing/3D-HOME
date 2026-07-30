export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'declaration-block-no-redundant-longhand-properties': null,
    // Component styles are intentionally grouped in shared global stylesheets.
    'no-descending-specificity': null,
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
      { message: 'Use kebab-case class names.' },
    ],
  },
};
