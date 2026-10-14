import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";


const sendMessage = asyncHandler(async (req, res) => {

    const { content } = req.body;

    const { conversationId } = req.params;

    const senderId = req.user._id;


    // Check message content
    if (!content?.trim()) {
        throw new ApiError(
            400,
            "Message content is required !!"
        );
    }


    // Find conversation
    const conversation = await Conversation.findById(
        conversationId
    );


    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found !!"
        );
    }


    // Check whether logged-in user belongs to this conversation
    const isParticipant = conversation.participants.some(
        (participant) =>
            participant.toString() === senderId.toString()
    );


    if (!isParticipant) {
        throw new ApiError(
            403,
            "You are not a participant of this conversation !!"
        );
    }


    // Create message
    const message = await Message.create({

        conversation: conversationId,

        sender: senderId,

        content: content.trim()

    });


    return res.status(201).json(
        new ApiResponse(
            201,
            message,
            "Message sent successfully !!"
        )
    );
});


const getMessages = asyncHandler(async (req, res) => {

    const { conversationId } = req.params;

    const userId = req.user._id;


    // Check conversation
    const conversation = await Conversation.findById(
        conversationId
    );

    if (!conversation) {
        throw new ApiError(
            404,
            "Conversation not found !!"
        );
    }


    // Check whether user belongs to conversation
    const isParticipant = conversation.participants.some(
        (participant) =>
            participant.toString() === userId.toString()
    );

    if (!isParticipant) {
        throw new ApiError(
            403,
            "You are not a participant of this conversation !!"
        );
    }


    // Get messages
    const messages = await Message.find({
        conversation: conversationId,
        deletedFor: { $ne: userId }
    })
    .sort({ createdAt: 1 });


    return res.status(200).json(
        new ApiResponse(
            200,
            messages,
            "Messages fetched successfully !!"
        )
    );
});




const deleteMessage = asyncHandler(async (req, res) => {

    const { conversationId, messageId } = req.params;
    const { deleteFor } = req.body;

    const userId = req.user._id;


    // Validate IDs
    if (
        !mongoose.isValidObjectId(conversationId) ||
        !mongoose.isValidObjectId(messageId)
    ) {
        throw new ApiError(400, "Invalid ID !!");
    }


    // Validate deletion option
    if (!["me", "everyone"].includes(deleteFor)) {
        throw new ApiError(
            400,
            "deleteFor must be 'me' or 'everyone' !!"
        );
    }


    // Find conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        throw new ApiError(404, "Conversation not found !!");
    }


    // Check conversation membership
    const isParticipant = conversation.participants.some(
        (participant) =>
            participant.toString() === userId.toString()
    );

    if (!isParticipant) {
        throw new ApiError(
            403,
            "You are not a participant of this conversation !!"
        );
    }


    // Find message
    const message = await Message.findById(messageId);

    if (!message) {
        throw new ApiError(404, "Message not found !!");
    }


    // Ensure the message belongs to this conversation
    if (message.conversation.toString() !== conversationId) {
        throw new ApiError(
            400,
            "Message does not belong to this conversation !!"
        );
    }


    // Delete for everyone
    // Delete for everyone

    // Delete for everyone
    if (deleteFor === "everyone") {
        // Only the original sender can delete for everyone
        if (message.sender.toString() !== userId.toString()) {
            throw new ApiError(
                403,
                "Only the sender can delete this message for everyone !!"
            );
        }

        if (message.isDeletedForEveryone) {
            throw new ApiError(
                400,
                "Message is already deleted for everyone !!"
            );
        }

        message.content = "This message was deleted";
        message.isDeletedForEveryone = true;
        message.deletedFor = [];

        await message.save();

        // Notify both participants who are connected to this conversation
        const io = req.app.get("io");

        io.to(conversationId).emit("message_updated", {
            conversationId,
            messageId: message._id.toString(),
            content: message.content,
            isDeletedForEveryone: true,
        });
    } else {
        // Delete for me
        await Message.updateOne(
            { _id: messageId },
            { $addToSet: { deletedFor: userId } }
        );

        // Notify only the user who requested this deletion
        const io = req.app.get("io");

        io.to(`user:${userId.toString()}`).emit(
            "message_deleted_for_me",
            {
                conversationId,
                messageId: message._id.toString(),
            }
        );
    }


    // if (deleteFor === "everyone") {

    //     // Only the original sender can delete for everyone
    //     if (message.sender.toString() !== userId.toString()) {
    //         throw new ApiError(
    //             403,
    //             "Only the sender can delete this message for everyone !!"
    //         );
    //     }

    //     if (message.isDeletedForEveryone) {
    //         throw new ApiError(
    //             400,
    //             "Message is already deleted for everyone !!"
    //         );
    //     }

    //     message.content = "This message was deleted";
    //     message.isDeletedForEveryone = true;
    //     message.deletedFor = [];

    //     await message.save();

    // } else {

        // Delete for me — including an already-deleted placeholder
    //     await Message.updateOne(
    //         { _id: messageId },
    //         { $addToSet: { deletedFor: userId } }
    //     );
    // }



    return res.status(200).json(
        new ApiResponse(
            200,
            { messageId, deleteFor },
            deleteFor === "me"
                ? "Message deleted for you !!"
                : "Message deleted for everyone !!"
        )
    );

});



export {
    sendMessage,
    getMessages,
    deleteMessage,
};

