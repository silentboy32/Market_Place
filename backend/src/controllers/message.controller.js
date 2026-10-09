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

    } else {

        // Delete for me
        if (message.isDeletedForEveryone) {
            throw new ApiError(
                400,
                "Message is already deleted for everyone !!"
            );
        }

        await Message.updateOne(
            { _id: messageId },
            { $addToSet: { deletedFor: userId } }
        );
    }


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







// import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/apiError.js";
// import { ApiResponse } from "../utils/apiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import { MessageModel } from "../models/message.model.js"



// const getAllContacts = asyncHandler(async (req , res) => {

//     try {
        
//         const loggedInUser = req.user._id;

        
//         const filteredUsers = await User.find({
//             _id : {
//                 $ne : loggedInUser
//             }
//         }).select("-password -refreshToken")

//         if(!filteredUsers){
//             throw new ApiError(404, "Users not Found !!")
//         }

//         res.status(200).json(
//             new ApiResponse(200, { 

//                 filteredUsers : filteredUsers 
//             } ,
//             "User Fetched Successfully !!")
//         )


//     } catch (error) {
//         throw new ApiError(500, error)        
//     }

// })


// const getAllPartners = asyncHandler(async (req, res) => { })


// const getAllMessageByUser = asyncHandler(async (req, res) => { 

//     try {
        
//         const myId = req.user._id;
//         const { id:userToChatId } = req.params;

//         const Message = await MessageModel.find({
//             $or : [
//                 { senderId : myId , receiverId : userToChatId },
//                 { senderId : userToChatId, receiverId : myId }
//             ]
//         })

//         res.status(200).json(Message)

//     } catch (error) {   
//         console.log("Error in getMessage controller :", error )
//     }
// })


// const sendMessage = asyncHandler(async (req, res) => { 

//     try {
        
//         const { text } = req.body;
//         const { id : receiverId } = req.params;
//         const senderId = req.user._id;


//         const message = new MessageModel({
//             senderId,
//             receiverId,
//             text
//         })

//         console.log("Msg",message)

//         await message.save()

//         res.status(201).json(
//             new ApiResponse(200, message , "Message Send Successfully !!")
//         )

//     } catch (error) {
//         console.log("Error while sending msg :", error )
//     }
// })




// export {

//     getAllContacts,
//     getAllMessageByUser,
//     getAllPartners,
//     sendMessage
// }