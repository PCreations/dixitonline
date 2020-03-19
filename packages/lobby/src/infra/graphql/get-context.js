export const makeGetContext = ({ dispatchDomainEvents } = {}) => () => ({
  dispatchDomainEvents,
});
