

import { Server } from "socket.io";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";

const initializeSocket = (httpServer, app) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FrontEndUrl,
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Socket authentication
    io.use(async (socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie;

            if (!cookieHeader) {
                return next(new Error("Socket: cookie header missing"));
            }

            const cookies = parse(cookieHeader);
            const token = cookies.accessToken;

            if (!token) {
                return next(new Error("Socket: accessToken cookie missing"));
            }

            const decodedToken = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET
            );

            const user = await User.findById(decodedToken?._id)
                .select("_id");

            if (!user) {
                return next(new Error("Socket: user not found"));
            }

            socket.data.userId = user._id.toString();

            return next();
        } catch {
            return next(new Error("Socket: authentication failed"));
        }
    });

    // Handle socket connections
    io.on("connection", (socket) => {

        // Join the private room for this user
        socket.join(`user:${socket.data.userId}`);

        // Join a conversation room
        socket.on("join_conversation", async (conversationId) => {
            try {
                if (
                    !conversationId ||
                    !mongoose.isValidObjectId(conversationId)
                ) {
                    return socket.emit("socket_error", {
                        message: "Invalid conversation ID"
                    });
                }

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.data.userId
                }).select("_id");

                if (!conversation) {
                    return socket.emit("socket_error", {
                        message: "Conversation not found or access denied"
                    });
                }

                socket.join(conversation._id.toString());
            } catch {
                socket.emit("socket_error", {
                    message: "Unable to join conversation"
                });
            }
        });

        // Send a message
        socket.on("send_message", async ({ conversationId, content }, callback) => {
            try {
                if (
                    typeof conversationId !== "string" ||
                    !mongoose.isValidObjectId(conversationId) ||
                    typeof content !== "string" ||
                    !content.trim()
                ) {
                    return callback?.({
                        success: false,
                        message: "Invalid message data"
                    });
                }

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.data.userId
                }).select("_id");

                if (!conversation) {
                    return callback?.({
                        success: false,
                        message: "Conversation not found or access denied"
                    });
                }

                const message = await Message.create({
                    conversation: conversation._id,
                    sender: socket.data.userId,
                    content: content.trim()
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate("sender", "username fullname");

                const messageData = populatedMessage.toObject();

                // Notify other sockets in the conversation
                socket.to(conversationId).emit(
                    "receive_message",
                    messageData
                );

                // Return the saved message to the sender
                return callback?.({
                    success: true,
                    message: messageData
                });
            } catch {
                return callback?.({
                    success: false,
                    message: "Failed to send message"
                });
            }
        });

    });

    // Make Socket.IO available to Express controllers
    app.set("io", io);

    return io;
};

export { initializeSocket };





// import { Server } from "socket.io";
// import { parse } from "cookie";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import { Message } from "../models/message.model.js";

// import { User } from "../models/user.model.js";
// import { Conversation } from "../models/conversation.model.js";

// const initializeSocket = (httpServer, app) => {
//     const io = new Server(httpServer, {
//         cors: {
//             origin: process.env.FrontEndUrl,
//             credentials: true,
//             methods: ["GET", "POST"]
//         }
//     });

//     // Move your existing io.use(...) authentication
//     // // middleware here, unchanged.


//     io.use(async (socket, next) => {
//         try {
//             const cookieHeader = socket.handshake.headers.cookie;

//             if (!cookieHeader) {
//                 return next(new Error("Socket: cookie header missing"));
//             }

//             const cookies = parse(cookieHeader);
//             const token = cookies.accessToken;

//             if (!token) {
//                 return next(new Error("Socket: accessToken cookie missing"));
//             }

//             const decodedToken = jwt.verify(
//                 token,
//                 process.env.ACCESS_TOKEN_SECRET
//             );

//             const user = await User.findById(decodedToken?._id)
//                 .select("_id");

//             if (!user) {
//                 return next(new Error("Socket: user not found"));
//             }

//             socket.data.userId = user._id.toString();

//             return next();
//         } catch {
//             return next(new Error("Socket: authentication failed"));
//         }
//     });


//     // Move your conversation-room event here.
//     // Add future message events here too.

//     io.on("connection", (socket) => {

        
//         socket.on("join_conversation", async (conversationId) => {
//             try {
//                 if (!conversationId || !mongoose.isValidObjectId(conversationId)) {
//                     return socket.emit("socket_error", {
//                         message: "Invalid conversation ID"
//                     });
//                 }

//                 const conversation = await Conversation.findOne({
//                     _id: conversationId,
//                     participants: socket.data.userId
//                 }).select("_id");

//                 if (!conversation) {
//                     return socket.emit("socket_error", {
//                         message: "Conversation not found or access denied"
//                     });
//                 }

//                 socket.join(conversation._id.toString());
//             } catch {
//                 socket.emit("socket_error", {
//                     message: "Unable to join conversation"
//                 });
//             }
//         });

//         socket.join(`user:${socket.data.userId}`);


//         socket.on("send_message", async ({ conversationId, content }, callback) => {
//             try {
//                 if (
//                     typeof conversationId !== "string" ||
//                     !mongoose.isValidObjectId(conversationId) ||
//                     typeof content !== "string" ||
//                     !content.trim()
//                 ) {
//                     return callback?.({
//                         success: false,
//                         message: "Invalid message data"
//                     });
//                 }

//                 const conversation = await Conversation.findOne({
//                     _id: conversationId,
//                     participants: socket.data.userId
//                 }).select("_id");

//                 if (!conversation) {
//                     return callback?.({
//                         success: false,
//                         message: "Conversation not found or access denied"
//                     });
//                 }

//                 const message = await Message.create({
//                     conversation: conversation._id,
//                     sender: socket.data.userId,
//                     content: content.trim()
//                 });

//                 const populatedMessage = await Message.findById(message._id)
//                     .populate("sender", "username fullname");

//                 const messageData = populatedMessage.toObject();

//                 socket.to(conversationId).emit("receive_message", messageData);

//                 return callback?.({
//                     success: true,
//                     message: messageData
//                 });
//             } catch {
//                 return callback?.({
//                     success: false,
//                     message: "Failed to send message"
//                 });
//             }
//         });

//     });

//     app.set("io", io);

//     return io;
// };

// export { initializeSocket };