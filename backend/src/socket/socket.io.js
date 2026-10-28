
import { Server } from "socket.io";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { Conversation } from "../models/conversation.model.js";

const initializeSocket = (httpServer, app) => {
    // Create the Socket.IO server using your existing frontend URL.
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FrontEndUrl,
            credentials: true,
            methods: ["GET", "POST"],
        },
    });

    // Store active connection counts by user ID.
    // This supports users logged in from multiple tabs or devices.
    const onlineUsers = new Map();

    // Find only users who share a conversation with this user.
    const getConversationPartners = async (userId) => {
        const conversations = await Conversation.find({
            participants: userId,
        }).select("participants");

        // Return unique partner IDs, excluding the current user.
        return [
            ...new Set(
                conversations.flatMap((conversation) =>
                    conversation.participants
                        .map((participant) => participant.toString())
                        .filter((id) => id !== userId)
                )
            ),
        ];
    };

    // Notify connected conversation partners when a user's status changes.
    const sendStatusToContacts = async (userId, isOnline) => {
        try {
            const contactIds = await getConversationPartners(userId);

            for (const contactId of contactIds) {
                // Each user joins their own private room after connecting.
                io.to(`user:${contactId}`).emit("contact_status", {
                    userId,
                    isOnline,
                });
            }
        } catch {
            // Avoid exposing internal database errors to clients.
            // The initial status request can refresh statuses later.
        }
    };

    // IMPORTANT: Authenticate the user BEFORE allowing a socket connection.
    io.use(async (socket, next) => {
        try {
            // Read the cookies sent by the browser during the handshake.
            const cookieHeader = socket.handshake.headers.cookie;

            if (!cookieHeader) {
                return next(new Error("Authentication required"));
            }

            const cookies = parse(cookieHeader);
            const token = cookies.accessToken;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            // Verify the access token using your existing JWT secret.
            const decodedToken = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET
            );

            // Confirm that the account still exists.
            const user = await User.findById(decodedToken?._id)
                .select("_id");

            if (!user) {
                return next(new Error("Authentication failed"));
            }

            // Save the authenticated user's ID for socket event handlers.
            socket.data.userId = user._id.toString();

            // Allow the connection to proceed.
            return next();
        } catch {
            // Reject invalid, expired, or otherwise unusable tokens.
            return next(new Error("Authentication failed"));
        }
    });

    // Run this only after the authentication middleware succeeds.
    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        // Join a private room so this user can receive status updates.
        socket.join(`user:${userId}`);

        // Increase the number of active connections for this user.
        const activeConnections = onlineUsers.get(userId) || 0;
        onlineUsers.set(userId, activeConnections + 1);

        // Notify conversation partners only on the offline -> online change.
        if (activeConnections === 0) {
            sendStatusToContacts(userId, true);
        }

        // Let the frontend request the current statuses of its contacts.
        socket.on("get_contact_statuses", async (callback) => {
            try {
                const contactIds = await getConversationPartners(userId);

                const statuses = contactIds.map((contactId) => ({
                    userId: contactId,
                    isOnline: onlineUsers.has(contactId),
                }));

                callback?.({
                    success: true,
                    statuses,
                });
            } catch {
                callback?.({
                    success: false,
                    message: "Unable to fetch contact statuses",
                });
            }
        });

        // Join a conversation only if the authenticated user belongs to it.
        socket.on("join_conversation", async (conversationId) => {
            try {
                if (
                    !conversationId ||
                    !mongoose.isValidObjectId(conversationId)
                ) {
                    return socket.emit("socket_error", {
                        message: "Invalid conversation ID",
                    });
                }

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId,
                }).select("_id");

                if (!conversation) {
                    return socket.emit("socket_error", {
                        message: "Conversation not found or access denied",
                    });
                }

                // Join the room used for real-time messages in this chat.
                socket.join(conversation._id.toString());
            } catch {
                socket.emit("socket_error", {
                    message: "Unable to join conversation",
                });
            }
        });

        // Save a message and deliver it to the other sockets in the chat.
        socket.on(
            "send_message",
            async ({ conversationId, content } = {}, callback) => {
                try {
                    if (
                        typeof conversationId !== "string" ||
                        !mongoose.isValidObjectId(conversationId) ||
                        typeof content !== "string" ||
                        !content.trim()
                    ) {
                        return callback?.({
                            success: false,
                            message: "Invalid message data",
                        });
                    }

                    // Verify that this user is a participant in the chat.
                    const conversation = await Conversation.findOne({
                        _id: conversationId,
                        participants: userId,
                    }).select("_id");

                    if (!conversation) {
                        return callback?.({
                            success: false,
                            message: "Conversation not found or access denied",
                        });
                    }

                    // Save the message with the authenticated sender ID.
                    const message = await Message.create({
                        conversation: conversation._id,
                        sender: userId,
                        content: content.trim(),
                    });

                    // Include sender details in the event sent to the frontend.
                    const populatedMessage = await Message.findById(message._id)
                        .populate("sender", "username fullname");

                    const messageData = populatedMessage.toObject();

                    // Send the message to other connected members of this room.
                    socket.to(conversationId).emit(
                        "receive_message",
                        messageData
                    );

                    // Return the saved message to the sender via the callback.
                    return callback?.({
                        success: true,
                        message: messageData,
                    });
                } catch {
                    return callback?.({
                        success: false,
                        message: "Failed to send message",
                    });
                }
            }
        );

        // Update the user's connection count when this socket disconnects.
        socket.on("disconnect", () => {
            const currentConnections = onlineUsers.get(userId) || 0;

            if (currentConnections <= 1) {
                // Only mark offline when the user's final connection closes.
                onlineUsers.delete(userId);
                sendStatusToContacts(userId, false);
            } else {
                // Another tab or device is still connected.
                onlineUsers.set(userId, currentConnections - 1);
            }
        });
    });

    // Make Socket.IO accessible to your Express controllers.
    app.set("io", io);

    return io;
};

export { initializeSocket };

