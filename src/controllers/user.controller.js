import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
     // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, email, username, password} = req.body
    
    if (
      [fullName, email, username, password].some(
        (fields) => fields?.trim() === "")
    ) {
        throw new ApiError(400 , "All fields are required")
    }

    const userExist = User.findOne({
        $or: [{username},{email}]
    })

    if(userExist){
        throw new ApiError(409, "Provided Username & Email already Exist")
    }
    
    const avaterLocalPath = req.files?.avatar[0].path

    const coverImageLocalPath = req.files?.coverImage[0].path

    if (!avaterLocalPath) {
        throw new ApiError(400 ,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avaterLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

   const user = User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase()
    })

   const userCreated = User.findById(user._id).select("-password -refreshToken")

   if(!userCreated){
     throw new ApiError(500,  "Something went wrong while registering the user")
   }

   return res.status(201).json(
     new ApiResponse(200 , userCreated,"User registered Successfully")
   )


});

export {registerUser}