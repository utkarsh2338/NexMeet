import express from "express";
import {createServer} from "node:http";
import {Server} from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import connectToSocket from "./src/controllers/socketManager.js";
import userRoutes from "./src/routes/users.routes.js"; 

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port",(process.env.PORT) || 3000);
app.use(cors());
app.use(express.json({limit:"50kb"}));
app.use(express.urlencoded({extended:true, limit:"50kb"}));

app.use("/api/v1/users", userRoutes);
app.get("/", (req, res) => {
  return res.send("Hello World!");
});

const start = async()=>{
    const connectionDb = await mongoose.connect("mongodb+srv://231165_db_user:H1b84YhGbajdNrSh@cluster0.du1z8uj.mongodb.net/?appName=Cluster0")
    console.log("Database connected");
    app.listen(app.get("port"), () => {
    console.log(`Server is running on port ${app.get("port")}`);
})
}
start();