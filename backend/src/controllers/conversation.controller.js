
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

const createConversation = asyncHandler(async (req, res) => {

    const { participantId } = req.body;

    if (!participantId) {
        throw new ApiError(
            400,
            "Participant ID is required !!"
        );
    }


    // Logged-in user
    const currentUserId = req.user._id;


    // User cannot create a conversation with himself
    if (currentUserId.toString() === participantId.toString()) {
        throw new ApiError(
            400,
            "You cannot create a conversation with yourself !!"
        );
    }


    // Check whether conversation already exists
    const existingConversation = await Conversation.findOne({
        participants: {
            $all: [currentUserId, participantId]
        }
    });


    if (existingConversation) {
        return res.status(200).json(
            new ApiResponse(
                200,
                existingConversation,
                "Conversation already exists !!"
            )
        );
    }


    // Create new conversation
    const conversation = await Conversation.create({
        participants: [
            currentUserId,
            participantId
        ]
    });


    return res.status(201).json(
        new ApiResponse(
            201,
            conversation,
            "Conversation created successfully !!"
        )
    );
});


const getMyConversations = asyncHandler(async (req, res) => {

    const userId = req.user._id;

    const conversations = await Conversation.find({
        participants: userId
    })
        .populate("participants", "username fullname")
        .lean();

    const conversationsWithLastMessage = await Promise.all(
        conversations.map(async (conversation) => {

            const lastMessage = await Message.findOne({
                conversation: conversation._id
            })
                .sort({ createdAt: -1 })
                .lean();

            return {
                ...conversation,
                lastMessage
            };
        })
    );

    conversationsWithLastMessage.sort((a, b) => {
        const timeA = a.lastMessage
            ? new Date(a.lastMessage.createdAt).getTime()
            : new Date(a.createdAt).getTime();

        const timeB = b.lastMessage
            ? new Date(b.lastMessage.createdAt).getTime()
            : new Date(b.createdAt).getTime();

        return timeB - timeA;
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            conversationsWithLastMessage,
            "Conversations fetched successfully !!"
        )
    );
});

export {
    createConversation,
    getMyConversations,
};
