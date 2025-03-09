const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { PubSub } = require('@google-cloud/pubsub');
const serviceAccount = require('./secrets/dixit-firebase-admin.json');
const { default: dixit } = require('./build/dixit');

const TOPIC_NAME = 'dixit_game_events';

const pubsub = new PubSub();

const domainEventSubscribers = {};

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

const subscribeToDomainEvent = (type, callback) => {
  if (!domainEventSubscribers[type]) {
    domainEventSubscribers[type] = [];
  }
  domainEventSubscribers[type].push(callback);
};

const firestore = firebaseApp.firestore();

const { app } = dixit({
  firestore,
  firebaseAuth: firebaseApp.auth(),
  dispatchDomainEvents,
  subscribeToDomainEvent,
});

exports.api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
  })
  .https.onRequest(app);

exports.processEvent = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '1GB',
  })
  .pubsub.topic(TOPIC_NAME)
  .onPublish(message => {
    // Décodage du message Pub/Sub
    const event = JSON.parse(Buffer.from(message.data, 'base64').toString());
    console.log('Événement reçu:', event);

    // Recherche et appel du callback associé au type d'événement
    const callbacks = domainEventSubscribers[event.type];
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    } else {
      console.warn("Aucun subscriber pour l'événement de type:", event.type);
    }
  });
