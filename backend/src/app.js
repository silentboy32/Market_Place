import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
import path from "path";
import messageRoutes from "./routes/message.route.js";



// Permisions to access server API
app.use(cors({
    origin : process.env.FrontEndUrl,
    credentials : true
}))



// Fix for __dirname in ES Modules
// Serve static files 
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../Frontend/dist")));



app.use(cookieParser());
// User Routes declayed here 
import userRouter from "./routes/user.route.js";

app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({ extended: true , limit:"16kb"}));

app.use("/api/v1/users", userRouter );
app.use("/api/v1/message" , messageRoutes );





app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend","dist","index.html"))
})


app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });

});


// app.use((err, req, res, next) => {
//     const response = {
//         success: false,
//         message: err.message || "Internal Server Error"
//     };

//     if (process.env.NODE_ENV === "development") {
//         response.stack = err.stack;
//     }

//     res.status(err.statusCode || 500).json(response);
// });

export { app };










