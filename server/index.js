import express from "express";
import logger from "morgan";
import { Server } from "socket.io";
import { createServer } from "node:http";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { log } from "node:console";
import {cors} from "cors"

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
    process.exit(1);
  }
}

const port = process.env.PORT ?? 5200;

const app = express();
const server = createServer(app);
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: "https://chatfu-bice.vercel.app",
    methods: ["GET", "POST"]
  }
});



io.on("connection", async (socket) => {
  console.log("A user has connected");
  io.emit("connection");

  socket.on("disconnect", () => {
    console.log("A user has disconnected");
  });

  socket.on("chat message", async (msg) => {

    const username = socket.handshake.auth.username ?? 'anonymous'
    try {


      const database = client.db("Chatfu");
      const messagesCollection = database.collection("messages");
      

      const result = await messagesCollection.insertOne({ content: msg, username:username });
      io.emit("chat message", msg,username);
    } catch (error) {
      console.error("Error al insertar en MongoDB:", error);
      return;
    }
  });

  if(!socket.recovered){
    try {
      const database = client.db('Chatfu');
      const messagesCollection = database.collection('messages');
      
      const messages = await messagesCollection.find().toArray();
      messages.forEach(msg =>{
        socket.emit("chat message", msg.content,msg.username)

      })

    } catch (error) {
        console.log(error);
    }
  }
});


app.use(logger("dev"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});

//  a MongoDB antes de iniciar el servidor
connectToMongoDB();
