const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { PubSub } = require('@google-cloud/pubsub');
const { EventEmitter } = require('events');
const serviceAccount = require('./secrets/dixit-firebase-admin.json');
const { default: dixit } = require('./build/dixit');

const TOPIC_NAME = 'dixit_game_events';

const pubsub = new PubSub();

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://dixit-af060.firebaseio.com',
});

// Fonction pour publier les événements
const dispatchDomainEvents = events => {
  events.forEach(async event => {
    const dataBuffer = Buffer.from(JSON.stringify(event));
    try {
      await pubsub.topic(TOPIC_NAME).publish(dataBuffer);
    } catch (err) {
      console.error('Erreur lors de la publication de l’événement:', err);
    }
  });
};

const firestore = firebaseApp.firestore();

exports.api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
  })
  .https.onRequest(async (...args) => {
    const { app } = await dixit({
      firestore,
      firebaseAuth: firebaseApp.auth(),
      dispatchDomainEvents,
      subscribeToDomainEvent: () => {}, // noop in this context
    });

    return app(...args);
  });

exports.processEvent = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
  })
  .pubsub.topic(TOPIC_NAME)
  .onPublish(async message => {
    const eventEmitter = new EventEmitter();
    // Décodage du message Pub/Sub
    const pubsubEvent = JSON.parse(Buffer.from(message.data, 'base64').toString());

    const localDispatchDomainEvents = events =>
      events.map(event => {
        eventEmitter.emit(event.type, event);
      });

    const localSubscribeToDomainEvent = (type, callback) => {
      eventEmitter.on(type, event => {
        return callback(event);
      });
    };

    await dixit({
      firestore,
      firebaseAuth: firebaseApp.auth(),
      dispatchDomainEvents: localDispatchDomainEvents,
      subscribeToDomainEvent: localSubscribeToDomainEvent,
      onlySubscribers: true,
    });

    localDispatchDomainEvents([pubsubEvent]);
  });
