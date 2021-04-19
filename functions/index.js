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
    eventEmitter.emit(event.type, event);
  });

const subscribeToDomainEvent = (type, callback) => {
  eventEmitter.on(type, event => {
    return callback(event);
  });
};

const firestore = firebaseApp.firestore();

const { app } = dixit({
  firestore,
  firebaseAuth: firebaseApp.auth(),
  dispatchDomainEvents,
  subscribeToDomainEvent,
});

// app.get('/replayLastTurnEvents', (req, res) => {
//   const { turnId } = req.query;
//   firebaseApp
//     .firestore()
//     .collection('turns')
//     .limit(10000)
//     .get()
//     .then(snapshot => {
//       const turns = [];
//       snapshot.forEach(doc =>
//         turns.push(
//           Object.fromEntries(
//             Object.entries(doc.data()).map(([timestamp, jsonEvent]) => [timestamp, JSON.parse(jsonEvent)])
//           )
//         )
//       );
//       fs.writeFile('./turns.json', JSON.stringify(turns, null, 2), (err, _) => {
//         res.json(turns);
//       });
//       // if (!doc.exists) {
//       //   res.status(500).send('Turn not found');
//       // }
//       // const events = Object.entries(doc.data());
//       // events.sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));

//       // const parsedEvents = events.map(([_, e]) => JSON.parse(e));
//       // console.log(JSON.stringify(parsedEvents, null, 2));
//       // const state = parsedEvents.reduce(turnReducer, undefined);
//       // // const [, event] = events[events.length - 1];
//       // // dispatchDomainEvents([events[events.length - 1]]);
//       // res.json(state);
//     });
// });

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
exports.api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
  })
  .https.onRequest(app);
