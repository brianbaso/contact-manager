import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as bodyParser from "body-parser";

// initalize firebase
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

// initalize express server
const app = express();
const main = express();

// configure the server
main.use('/api/v1', app);
main.use(bodyParser.json());

export const webAPI = functions.https.onRequest(main);

// Create a contact
app.post('/contacts', async (request, response) => {
  try {
    // Get the name and phone number from the request body
    const { name, phoneNumber } = request.body;
    const data = {
      name,
      phoneNumber
    }

    // Create a new collection in the firestore db if needed, otherwise add to
    // the existing colleciton
    const contactRef = await db.collection('contacts').add(data);
    const contact = await contactRef.get();

    // Show what the response will be
    response.json({
      id: contactRef.id,
      data: contact.data()
    });

  } catch(e) {
    response.status(500).send(error);
  }
});
