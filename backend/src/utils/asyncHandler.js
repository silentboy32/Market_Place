// import { ApiError } from "./apiError.js"

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
       Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}



const UserLoggedOut = asyncHandler( async (req , res ) => {

    const LogOut = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },{
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    if(!LogOut) {
        throw new ApiError(500, "server error !!")
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User loggedOut Successfully !!")
    )

})

export { asyncHandler }