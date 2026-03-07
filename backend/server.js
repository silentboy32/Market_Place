import { app } from "./src/app.js";
import dotenv from "dotenv";
import { connectedDB } from "./src/db/database.js";


dotenv.config({
    path:"./.env"
})


connectedDB()
.then((result) => {
    app.listen(process.env.PORT , () => {
        console.log(`Server is Running on 127.0.0.1:${process.env.PORT}`)
    })
    
}).catch((err) => {
    console.log("Something Went wrong :",err)
});

