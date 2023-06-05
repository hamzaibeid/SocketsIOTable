const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { createAdapter } = require("@socket.io/mongo-adapter");
const { MongoClient } = require("mongodb");
app.use(cors());

const server = http.createServer(app);
const mongoURL = 'mongodb://127.0.0.1:27017';
const DB = "socketsTest";
const COLLECTION = "Asset_Development";
let rows = [[]]; 
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
let dbClient;
const main = async () => {
  try {
    const mongoClient = new MongoClient(mongoURL, {
      useUnifiedTopology: true,
    });

    await mongoClient.connect().then(client => {
      dbClient = client;
    });

    console.log("Database connection established");

    const mongoCollection = mongoClient.db(DB).collection(COLLECTION);
    io.adapter(createAdapter(mongoCollection));

    io.on('connection', socket => {
      console.log('A client connected');
    
      // Send initial state to the connected client
      socket.emit('initialState', rows);
    
      // Handle cell value change event
      socket.on('cellValueChange', ({ rowIndex, cellIndex, value }) => {
        if (rows[rowIndex]) {
          rows[rowIndex][cellIndex] = value;
          socket.broadcast.emit('cellValueChange', { rowIndex, cellIndex, value });
        }
      });
    
socket.on('saveData', async ({ rows: updatedRows }) => {
  rows = updatedRows;
  try {
    const db = dbClient.db(DB);
    const collection = db.collection(COLLECTION);
    await collection.deleteMany({}); 

    const documents = rows.map(row => {
      const document = {};
      row.forEach((cell, index) => {
        document[index] = cell;
      });
      return document;
    });

    await collection.insertMany(documents);
    console.log('Data saved:', documents);
    socket.broadcast.emit('dataSaved', rows);
  } catch (error) {
    console.error('Error saving data to MongoDB:', error);
  }
});
  
    socket.on('disconnect', () => {
        console.log('A client disconnected');
      });
    });

    server.listen(3456, () => {
      console.log("Server is listening at port: 3456");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

main();


