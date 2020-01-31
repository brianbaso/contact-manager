import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as bodyParser from "body-parser";

// initalize firebase
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

// initalize express server
const app = express();
const main = express();

// configure the server
main.use("/api/v1", app);
main.use(bodyParser.json());

const cors = require("cors");
app.use(cors());

export const webAPI = functions.https.onRequest(main);

// Create a contact
app.post("/contacts", async (request, response) => {
  try {
    // Get the name and phone number from the request body
    const { name, phoneNumber } = request.body;
    const data = {
      name,
      phoneNumber
    };

    // Create a new collection in the firestore db if needed, otherwise add to
    // the existing colleciton
    const contactRef = await db.collection("contacts").add(data);
    const contact = await contactRef.get();

    // Show what the response will be
    response.json({
      id: contactRef.id,
      data: contact.data()
    });
  } catch (e) {
    response.status(500).send(e);
  }
});

// Get a single contact
app.get("/contacts/:id", async (request, response) => {
  try {
    // grab the id from the http request
    const contactID = request.params.id;

    if (!contactID) throw new Error("Contact ID is required");

    // reference the contact in the contacts collection and set it to a const
    const contact = await db
      .collection("contacts")
      .doc(contactID)
      .get();

    if (!contact.exists) {
      throw new Error("Contact does not exist");
    }

    // return the contact to the client
    response.json({
      id: contact.id,
      data: contact.data()
    });
  } catch (e) {
    response.status(500).send(e);
  }
});

// Get all contacts
app.get("/contacts", async (request, response) => {
  try {
    // create a snapshot of the firestore db
    const contactsQuerySnapshot = await db.collection("contacts").get();

    // create an array for the contacts to go into
    const contacts: { id: string; data: FirebaseFirestore.DocumentData }[] = [];

    // grab every contact in the collection
    contactsQuerySnapshot.forEach(doc => {
      contacts.push({
        id: doc.id,
        data: doc.data()
      });
    });

    // return the array of contacts to the client
    response.json(contacts);
  } catch (e) {
    response.status(500).send(e);
  }
});

// Update a single contact
app.put("/contacts/:id", async (request, response) => {
  try {
    // get the contact id from the request param
    const contactID = request.params.id;

    // get the name/phone number from the request object body
    const name = request.body.name;
    const phoneNumber = request.body.phoneNumber;

    // check if any fields are missing
    if (!contactID) throw new Error("ID is required");
    if (!name) throw new Error("Name is required");
    if (!phoneNumber) throw new Error("Phone number is required");

    // create the object to send to in the request to the server
    const data = {
      name,
      phoneNumber
    };

    // reference the document in the nosql database so that you can update it
    const contactRef = await db
      .collection("contacts")
      .doc(contactID)
      .set(data, { merge: true });

    // return the confirmation that the document changed
    response.json({
      id: contactID,
      data
    });
  } catch (e) {
    response.status(500).send(e);
  }
});

// Delete a single contact
app.delete("/contacts/:id", async (request, response) => {
  try {
    // Grab the contact id from the url
    const contactID = request.params.id;
    if (!contactID) throw new Error("ID is required");

    // delete the document out of the contacts collection
    await db
      .collection("contacts")
      .doc(contactID)
      .delete();

    // delete confirmation response
    response.json({
      id: contactID
    });
  } catch (e) {
    response.status(500).send(e);
  }
});

// Create a message
app.post("/message", async (request, response) => {
  try {
    // Get the message contact
    const { message, recipient } = request.body;
    const data = {
      message,
      recipient
    };

    // Create a new collection in the firestore db if needed
    const msgRef = await db.collection("messages").add(data);
    const msg = await msgRef.get();

    // Show what the response will be
    response.json({
      id: msgRef.id,
      data: msg.data()
    });
  } catch (e) {
    response.status(500).send(e);
  }
});
