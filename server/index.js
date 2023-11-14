import express from "express"
import logger from "morgan"

import { Server, Socket } from "socket.io";

import {createServer} from "node:http"
import { log } from "node:console";

const port = process.env.PORT?? 3000;


const app = express();

const server = createServer(app);

const io = new Server(server);


io.on("connection", (socket) =>{
    console.log("A user has connected");
    io.emit("connection")

    socket.on("disconnect", () =>{
        console.log("A user as disconnected");

    
    })
    socket.on("chat message", (msg) =>{
        io.emit("chat message", msg);
    })
})

app.use(logger('dev'))

app.get("/",(req,res)=> {
    res.sendFile(process.cwd() + "/client/index.html");
})

server.listen(port, () =>{
    console.log(`Servidor corriendo en puertp ${port}`);
})