import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();

// Fix for __dirname in ES Modules
const __dirname = path.resolve();

// Serve static files 
// app.use(express.json());
app.use(express.static(path.join(__dirname, "../Frontend/dist")));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend","dist","index.html"))
})


export { app };










