export const handleUseCaseResult = ({ dispatchDomainEvents, result }) => {
  if (result.error) {
    return {
      type: result.error,
    };
  }
  dispatchDomainEvents(result.events);
  return result.value;
};
