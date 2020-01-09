import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as bodyParser from "body-parser";

// initalize firebase
admin.initializeApp(functions.config().firebase);

// initalize express server
const app = express();
const main = express();

// configure the server
main.use('/api/v1', app);
main.use(bodyParser.json());

export const webAPI = functions.https.onRequest(main);

app.get('/warm', (req, res) => {
  res.send('Warming up');
})

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
