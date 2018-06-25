const { is } = require('immutable');
const { $ } = require('./state');

const createViewState$ = selector => $.map(selector).distinctUntilChanged(is);

module.exports = createViewState$;
