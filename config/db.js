const admin = require('firebase-admin');
const serviceAccount = require('../formulario-if---ft-firebase-adminsdk-u9bim-fd525dbea7.json');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://admin:j4bAB3JN3LBTWJsJ@formulario.ebd59ch.mongodb.net/?retryWrites=true&w=majority&appName=Formulario&tls=true";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

exports.connectToDatabase = () => {
    // MongoDB
    const uri = process.env.MONGO_URI;
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    client.connect()
        .then(() => console.log("Connected successfully to MongoDB"))
        .catch(err => console.error('Failed to connect to MongoDB', err));

    // Firebase
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
};
