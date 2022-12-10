export const {
  pathToRegexp,
  match,
  regexpToFunction,
  tokensToRegexp,
  tokensToFunction,
  parse,
  compile,
} = await (window.SSR
  ? import('@node_modules/path-to-regexp/dist/index.js')
  : import('@node_modules/path-to-regexp/dist.es2015/index.js'));

export default {
  pathToRegexp,
  match,
  regexpToFunction,
  tokensToRegexp,
  tokensToFunction,
  parse,
  compile,
};
