import dotenv from "dotenv";
import { createServer } from "node:http";

import { connectedDB } from "./src/db/database.js";
import { initializeSocket } from "./src/socket/socket.io.js";

dotenv.config({ path: "./.env" });

const { app } = await import("./src/app.js");

const startServer = async () => {
    await connectedDB();

    const httpServer = createServer(app);

    initializeSocket(httpServer, app);

    httpServer.listen(process.env.PORT);
};

await startServer();





