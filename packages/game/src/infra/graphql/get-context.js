export const makeGetContext = ({ dispatchDomainEvents, authorizationService, getNowDate } = {}) => async context => ({
  dispatchDomainEvents,
  currentUser: await authorizationService.getCurrentUser(context),
  getNowDate,
});
