export const makeGetContext = ({ dispatchDomainEvents, authorizationService } = {}) => async context => ({
  dispatchDomainEvents,
  currentUser: await authorizationService.getCurrentUser(context),
});
