import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as bodyParser from "body-parser";
import algoliasearch from "algoliasearch";

// initalize firebase
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

// initalize express server
const app = express();
const main = express();

// configure the server
main.use("/api/v1", app);
main.use(bodyParser.json());

export const webAPI = functions.https.onRequest(main);

const ALGOLIA_APP_ID = "B1JJN0FQXD";
const ALGOLIA_API_KEY = "43e46f3981e262a43fc2a0c433d79b21";
const ALGOLIA_INDEX_NAME = "new_contacts";

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const index = client.initIndex("contacts");

export const sendCollectionToAlgolia = functions.https.onRequest((req, res) => {
  // This array will contain all records to be indexed in Algolia.
  // A record does not need to necessarily contain all properties of the Firestore document,
  // only the relevant ones.
  const algoliaRecords: any[] = [];

  // Retrieve all documents from the COLLECTION collection.
  admin
    .firestore()
    .collection("contacts")
    .get()
    .then(docs => {
      docs.forEach(doc => {
        const user = doc.data();
        user.objectID = doc.id;

        console.log(user);
        algoliaRecords.push(user);
      });

      index.saveObjects(algoliaRecords, (err: any, content: any) => {
        res.status(200).send(content);
      });
    })
    .catch(e => console.log(e));
});

// Create a contact
app.post("/contacts", async (request, response) => {
  try {
    // Get the name and phone number from the request body
    const { name, phoneNumber, address } = request.body;
    const data = {
      name,
      phoneNumber,
      address
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
    const contactId = request.params.id;

    if (!contactId) throw new Error("Contact ID is required");

    // reference the contact in the contacts collection and set it to a const
    const contact = await db
      .collection("contacts")
      .doc(contactId)
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
    const contacts: any[] = [];

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
    const contactId = request.params.id;

    // get the name/phone number from the request object body
    const name = request.body.name;
    const phoneNumber = request.body.phoneNumber;
    const address = request.body.address;

    // check if any fields are missing
    if (!contactId) throw new Error("ID is required");
    if (!name) throw new Error("Name is required");
    if (!phoneNumber) throw new Error("Phone number is required");
    if (!address) throw new Error("Address is required");

    // create the object to send to in the request to the server
    const data = {
      name,
      phoneNumber,
      address
    };

    // reference the document in the nosql database so that you can update it
    await db
      .collection("contacts")
      .doc(contactId)
      .set(data, { merge: true });

    // return the confirmation that the document changed
    response.json({
      id: contactId,
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
    const contactId = request.params.id;

    if (!contactId) throw new Error("ID is required");

    // delete the document out of the contacts collection
    await db
      .collection("contacts")
      .doc(contactId)
      .delete();

    // delete confirmation response
    response.json({
      id: contactId
    });
  } catch (e) {
    response.status(500).send(e);
  }
});
