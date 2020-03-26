export const makeHandleUseCaseResult = ({ dispatchDomainEvents, result }) => graphQLResultField => {
  if (result.error) {
    return {
      type: result.error,
    };
  }
  dispatchDomainEvents(result.events);
  return {
    [graphQLResultField]: result.value,
  };
};
