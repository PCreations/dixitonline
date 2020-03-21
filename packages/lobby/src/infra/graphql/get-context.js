export const makeGetContext = ({ dispatchDomainEvents, authorizationService } = {}) => async ({ req }) => ({
  dispatchDomainEvents,
  currentUser: await authorizationService.getCurrentUser(req),
});
