const { EventEmitter } = require('events');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const serviceAccount = require('./secrets/dixit-firebase-admin.json');
const { default: dixit } = require('./build/dixit');

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://dixit-af060.firebaseio.com',
});

const eventEmitter = new EventEmitter();

const dispatchDomainEvents = events =>
  events.map(event => {
    console.log('dispatching event', event);
    eventEmitter.emit(event.type, event);
  });

const subscribeToDomainEvent = (type, callback) => {
  eventEmitter.on(type, event => {
    console.log('received event', type);
    return callback(event);
  });
};

const firestore = firebaseApp.firestore();

const { app, removeInactivePlayers } = dixit({
  firestore,
  firebaseAuth: firebaseApp.auth(),
  dispatchDomainEvents,
  subscribeToDomainEvent,
});

app.get('/replayLastTurnEvents', (req, res) => {
  const { turnId } = req.query;
  firebaseApp
    .firestore()
    .collection('turns')
    .doc(turnId)
    .collection('events')
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        res.status(500).send('Turn not found');
      }
      const events = [];
      snapshot.forEach(eventDoc => {
        const event = JSON.parse(eventDoc.data().eventData);
        events.push(event);
      });
      dispatchDomainEvents([events[0]]);
      res.json(events[0]);
    });
});

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
  })
  .https.onRequest(app);

exports.removeInactivePlayers = functions.pubsub.schedule('every 1 mins').onRun(async () => {
  console.log('RUNNING REMOVE INACTIVE PLAYERS');
  const gameIds = await firestore
    .collection('lobby-games')
    .where('status', '==', 'WAITING_FOR_PLAYERS')
    .get()
    .then(snp => {
      const ids = [];
      snp.forEach(doc => ids.push(doc.data().id));
      return ids;
    });
  console.log(`Handling ${gameIds.length} games`);
  await Promise.all(gameIds.map(id => removeInactivePlayers({ gameId: id, now: new Date() })));
  return null;
});
