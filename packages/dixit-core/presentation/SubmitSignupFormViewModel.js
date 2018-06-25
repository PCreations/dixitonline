const signupFormViewState$ = require('../domain/state/viewState$/signupFormViewState$');

const createSubmitSignupFormViewModel = ({ signupMutation }) => ({
  state$: signupFormViewState$,
  mutations: { signup: signupMutation },
});

module.exports = createSubmitSignupFormViewModel;
