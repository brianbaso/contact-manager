import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as bodyParser from "body-parser";

let cors_options =
{
  "origin": "*",
  "methods": "*",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}

const cors = require('cors')(cors_options);
const app = express();

app.use(cors);
app.options('*', cors);

// New posts: /users/<user-id>/contacts/<contact map>

// initalize firebase
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

// initalize express server
const main = express();

// configure the server
main.use('/api/v1', app);
main.use(bodyParser.json());

export const webAPI = functions.https.onRequest(main);

// Create a contact
app.post('/users/:user/contacts', async (request, response) => {
  try {

    const userId = request.params.user;

    if (!userId) throw new Error('User ID is required');

    // Get the name and phone number from the request body
    const { name, phoneNumber, address } = request.body;
    const data = {
      name,
      phoneNumber,
      address
    }

    // Create a new collection in the firestore db if needed, otherwise add to
    // the existing colleciton
    const contactRef = await db.collection('users').doc(userId).collection('contacts').add(data);
    const contact = await contactRef.get();

    // Show what the response will be
    response.json({
      id: contactRef.id,
      data: contact.data()
    });

  } catch(e) {
    response.status(500).send(e);
  }
});

// Get a single contact
app.get('/users/:user/contacts/:id', async (request, response) => {
  try {
    // grab the id from the http request
    const contactId = request.params.id;
    const userId = request.params.user;

    if (!contactId) throw new Error('Contact ID is required');
    if (!userId) throw new Error('User ID is required');

    // reference the contact in the contacts collection and set it to a const
    const contact = await db.collection('users').doc(userId).collection('contacts').doc(contactId).get();

    if (!contact.exists) {
      throw new Error ('Contact does not exist');
    }

    // return the contact to the client
    response.json({
      id: contact.id,
      data: contact.data()
    });

  } catch(e) {
    response.status(500).send(e);
  }
});


// Get all contacts
app.get('/users/:user/contacts', async (request, response) => {
  try {

    const userId = request.params.user;

    if (!userId) throw new Error('User ID is required');

    // create a snapshot of the firestore db
    const contactsQuerySnapshot = await db.collection('users').doc(userId).collection('contacts').get();

    // create an array for the contacts to go into
    const contacts:any[] = [];

    // grab every contact in the collection
    contactsQuerySnapshot.forEach((doc) => {
        contacts.push({
          id: doc.id,
          data: doc.data()
        });
      }
    );

    // return the array of contacts to the client
    response.json(contacts);

  } catch(e) {
    response.status(500).send(e);
  }
})

// Update a single contact
app.put('/users/:user/contacts/:id', async (request, response) => {
  try {

    // get the contact id from the request param
    const contactId = request.params.id;
    const userId = request.params.user;

    // get the name/phone number from the request object body
    const name = request.body.name;
    const phoneNumber = request.body.phoneNumber;
    const address = request.body.address;

    // check if any fields are missing
    if (!contactId) throw new Error('ID is required');
    if (!name) throw new Error('Name is required');
    if (!phoneNumber) throw new Error('Phone number is required');
    if (!address) throw new Error('Address is required');
    if (!userId) throw new Error('UserID is required');

    // create the object to send to in the request to the server
    const data = {
      name,
      phoneNumber,
      address
    };

    // reference the document in the nosql database so that you can update it
    await db.collection('users').doc(userId).collection('contacts').doc(contactId).set(data, { merge: true });

    // return the confirmation that the document changed
    response.json({
      id: contactId,
      data
    });

  } catch(e) {
    response.status(500).send(e);
  }
})

// Delete a single contact
app.delete('/users/:user/contacts/:id', async (request, response) => {
  try {
    // Grab the contact id from the url
    const contactId = request.params.id;
    const userId = request.params.user;

    if (!contactId) throw new Error('ID is required');
    if (!userId) throw new Error('User ID is required');

    // delete the document out of the contacts collection
    await db.collection('users').doc(userId).collection('contacts').doc(contactId).delete();

    // delete confirmation response
    response.json({
      id: contactId
    });

  } catch(e) {
    response.status(500).send(e);
  }
});
