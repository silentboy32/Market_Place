import { app } from "./src/app.js";
import dotenv from "dotenv";

dotenv.config({
    path:"./.env"
})





app.listen(process.env.PORT , () => {
    console.log(`Server is Running on 127.0.0.1:${process.env.PORT}`)
})