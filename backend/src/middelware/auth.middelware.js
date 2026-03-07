import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const verifyjwt = asyncHandler(async (req, res, next) => {
    try {

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        // const token = req.header("Authorization")?.replace("Bearer","")

        // console.log(token)

        if (!token) {
            throw new ApiError(401, "Unauthorize Request !!")
        }

        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(401, "Invalid Access Token !!")
        }
        req.user = user;
        next()

        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Accesss Token")
    }

    

})

export { verifyjwt }