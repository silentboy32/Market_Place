import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MessageModel } from "../models/message.model.js"



const getAllContacts = asyncHandler(async (req , res) => {

    try {
        
        const loggedInUser = req.user._id;

        
        const filteredUsers = await User.find({
            _id : {
                $ne : loggedInUser
            }
        }).select("-password -refreshToken")

        if(!filteredUsers){
            throw new ApiError(404, "Users not Found !!")
        }

        res.status(200).json(
            new ApiResponse(200, { 

                filteredUsers : filteredUsers 
            } ,
            "User Fetched Successfully !!")
        )


    } catch (error) {
        throw new ApiError(500, error)        
    }

})


const getAllPartners = asyncHandler(async (req, res) => { })


const getAllMessageByUser = asyncHandler(async (req, res) => { 

    try {
        
        const myId = req.user._id;
        const { id:userToChatId } = req.params;

        const Message = await MessageModel.find({
            $or : [
                { senderId : myId , receiverId : userToChatId },
                { senderId : userToChatId, receiverId : myId }
            ]
        })

        res.status(200).json(Message)

    } catch (error) {   
        console.log("Error in getMessage controller :", error )
    }
})


const sendMessage = asyncHandler(async (req, res) => { 

    try {
        
        const { text } = req.body;
        const { id : receiverId } = req.params;
        const senderId = req.user._id;


        const message = new MessageModel({
            senderId,
            receiverId,
            text
        })

        console.log("Msg",message)

        await message.save()

        res.status(201).json(
            new ApiResponse(200, message , "Message Send Successfully !!")
        )

    } catch (error) {
        console.log("Error while sending msg :", error )
    }
})




export {

    getAllContacts,
    getAllMessageByUser,
    getAllPartners,
    sendMessage
}