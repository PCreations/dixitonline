const createViewState$ = require('./createViewState$');
const authSelector = require('../selectors/authSelector');

const signupFormViewState$ = createViewState$(authSelector);

module.exports = signupFormViewState$;
