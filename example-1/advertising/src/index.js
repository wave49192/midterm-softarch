const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");

function connectDb(dbHost, dbName) {
  return mongodb.MongoClient.connect(dbHost, { useUnifiedTopology: true }).then(
    (client) => {
      const db = client.db(dbName);
      return {
        // Return an object that represents the database connection.
        db: db, // To access the database...
        close: () => {
          // and later close the connection to it.
          return client.close();
        },
      };
    }
  );
}

function setupHandlers(microservice) {
  //   const advertisingCollections = microservice.db.collection("ads");
  microservice.app.get("/ads", (req, res) => {
    const mock = [
      {
        name: "Facebook",
        link: "https://www.facebook.com",
      },
      {
        name: "Twitter",
        link: "https://www.Twitter.com",
      },
      {
        name: "Youtube",
        link: "https://www.youtube.com",
      },
      {
        name: "Google",
        link: "https://www.Google.com",
      },
      {
        name: "Udemy",
        link: "https://www.udemy.com/",
      },
    ];
    const randomObject = mock[Math.floor(Math.random() * mock.length)];
    res.json(randomObject);
  });
}

function startHttpServer(dbConn) {
  return new Promise((resolve) => {
    const app = express();
    const microservice = {
      app: app,
      db: dbConn.db,
    };
    app.use(bodyParser.json());
    setupHandlers(microservice);
    const port = (process.env.PORT && parseInt(process.env.PORT)) || 3000;
    const server = app.listen(port, () => {
      microservice.close = () => {
        // Create a function that can be used to close our server and database.
        return new Promise((resolve) => {
          server.close(() => {
            // Close the Express server.
            resolve();
          });
        }).then(() => {
          return dbConn.close(); // Close the database.
        });
      };
      resolve(microservice);
    });
  });
}
//
// Collect code here that executes when the microservice starts.
//
function startMicroservice(dbHost, dbName) {
  return connectDb(dbHost, dbName) // Connect to the database...
    .then((dbConn) => {
      // then...
      return startHttpServer(
        // start the HTTP server.
        dbConn
      );
    });
}

//
// Application entry point.
//
function main() {
  if (!process.env.DBHOST) {
    throw new Error(
      "Please specify the databse host using environment variable DBHOST."
    );
  }

  const DBHOST = process.env.DBHOST;

  if (!process.env.DBNAME) {
    throw new Error(
      "Please specify the databse name using environment variable DBNAME."
    );
  }

  const DBNAME = process.env.DBNAME;

  return startMicroservice(DBHOST, DBNAME);
}

if (require.main === module) {
  // Only start the microservice normally if this script is the "main" module.
  main()
    .then(() => console.log("Microservice online."))
    .catch((err) => {
      console.error("Microservice failed to start.");
      console.error((err && err.stack) || err);
    });
} else {
  // Otherwise we are running under test
  module.exports = {
    startMicroservice,
  };
}
