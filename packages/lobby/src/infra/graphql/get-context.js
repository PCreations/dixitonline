export const makeGetContext = ({ dispatchDomainEvents, authorizationService } = {}) => async () => ({
  dispatchDomainEvents,
  currentUser: await authorizationService.getCurrentUser(),
});
