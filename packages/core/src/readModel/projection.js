const Projection = ({
  handledEventTypes,
  reduceToQueryResult,
  fromQueryDataToImmutableData,
  getQuery,
  saveQuery,
  getEventsFrom,
  notifyChange,
}) => async event => {
  if (!handledEventTypes.includes(event.type)) {
    return;
  }
  const queryResult = fromQueryDataToImmutableData(await getQuery());
  const events = await getEventsFrom(event);
  const updatedQueryResult = events.reduce(reduceToQueryResult, queryResult);
  await saveQuery(updatedQueryResult.toJS());
  notifyChange(updatedQueryResult.toJS());
};

module.exports = {
  Projection,
};
