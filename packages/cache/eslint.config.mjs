import antfu from '@antfu/eslint-config';

export default antfu({
  type: 'lib',
  typescript: true,
  formatters: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
});
