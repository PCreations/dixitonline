const Projection = ({
  reduceToQueryResult,
  fromQueryDataToImmutableData,
  getQuery,
  saveQuery,
  getEventsFrom,
}) => async event => {
  const queryResult = fromQueryDataToImmutableData(await getQuery());
  const events = await getEventsFrom(event);
  const updatedQueryResult = events.reduce(reduceToQueryResult, queryResult);
  await saveQuery(updatedQueryResult.toJS());
  notifyChange(updatedQueryResult.toJS());
};

const Query = ({ getQuery, addOnQueryChangeListener }) => ({
  async subscribe(notifyChange) {
    addOnQueryChangeListener(notifyChange(queryResult));
    notifyChange(await getQuery());
  },
});

const FirebaseLobbyQuery = {
  getQuery: () =>
    firebaseDb
      .ref('/views/lobby')
      .once('value')
      .then(snp => snp.val()),
  addOnQueryChangeListener: notifyChange =>
    firebaseDb.ref('/views/lobby').on('value', snp => notifyChange(snp.val())),
};

module.exports.firebaseLobbyProjection = functions.database.ref('/events/${eventId}').onCreate(snapshot => {
  const event = snapshot.val();
  const lobbyProjection = Projection({
    reduceToQueryResult: reduceToLobby,
    fromQueryDataToImmutableData: fromLobbyBlabla,
    getEventsFrom: event =>
      firebaseDb
        .ref('events')
        .from(event.meta.id)
        .once('value')
        .then(snp => snp.val()),
    getQuery: firebaseDb
      .ref('lobby')
      .once('value')
      .then(snp => snp.val()),
    saveQuery: data => firebaseDb.ref('lobby').set(data),
  });
  lobbyProjection(event);
});

module.exports = {
  Query,
};
