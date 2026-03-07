
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";


// Code for generate Tokens 
const generateAccessTokenAndRefreshToken = async(userId) => {

    try{

        const user = await User.findById(userId)


        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken =  refreshToken
        await user.save({ validateBeforeSave : false })

    
        return { accessToken , refreshToken }


    } catch(error){
        throw new ApiError(500, "Something went wrong while gernerating refresh and access token !!")
    }
}

// User Registered code here
const UserRegister = asyncHandler(async (req, res) => {
    // Get user details from frontend
    // All fields Requered 
    // Check if user already exist 
    // Remove password and refresh token field from response 
    // return response
    

    // Values Destructured 
    const { username, fullname, email, password } = req.body;

    // console.log(`Username : ${username} Fullname : ${fullname} Email : ${email} Password : ${password}`);


    // checks no fiels are empty
    if (
        [username, fullname, email, password ].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All Fields are Required !!");
    }

    // Checks user doesn't exists already !! 
    const existedUser = await User.findOne({
        $or : [{ username },{ email }]
    })
    
    
    if (existedUser){
        throw new ApiError(409, "User Already exists !!");
    }



    const user = await User.create({
        username : username.toLowerCase(),
        fullname,
        email,
        password
    })
    // console.log(user._id)
    const createdUser = await User.findById(user._id).select(
        "-password  -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user !! ")
    }

    res.status(201).json(
        new ApiResponse(200, "User Register Successfully !!")
    )



});

// User login code here 
const UserLogin = asyncHandler( async (req, res) => {
    // Take username or email and password
    // Check user exist or not 

    const { username, email, password } = req.body;

    if(
        [username || email , password ].some((fields) => fields?.trim() === "")
    ){
        throw new ApiError(309, "All Fields are Requred !!")
    }

    // Existed User or Email Check 
    const user = await User.findOne({
        $or : [{username} , {email}]
    })

    if (!user) {
        throw new ApiError(404, "User not Found !!")
    }


    // Existed Password Checks 
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    

    if (!isPasswordCorrect){
        throw new ApiError(404 , "User not Found !!")
    }


    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken , options )
    .cookie("refreshToken", refreshToken , options )   
    .json(

        new ApiResponse(200, {
            user : loggedInUser , accessToken
        }, 
        "User LoggedIn Successfully !!")
        
    )

})


const UserLoggedOut = asyncHandler( async (req , res ) => {

    User.findByIdAndUpdate(
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

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User loggedOut Successfully !!")
    )

})



export {
    UserRegister,
    UserLogin,
    UserLoggedOut
}


