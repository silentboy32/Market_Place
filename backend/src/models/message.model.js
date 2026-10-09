
import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        isDeletedForEveryone: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export { Message };


// import mongoose from "mongoose";


// const messageSchema = mongoose.Schema(
//     {
//         conversation : {
//             type : mongoose.Schema.Types.ObjectId,
//             ref : "Conversation",
//             required : true
//         },

//         sender : {
//             type : mongoose.Schema.Types.ObjectId,
//             ref : "User",
//             required : true
//         },

//         content : {
//             type : String,
//             required : true,
//             trim : true
//         }
//     },
//     { timestamps : true }
// );


// const Message = mongoose.model("Message", messageSchema);

// export { Message };