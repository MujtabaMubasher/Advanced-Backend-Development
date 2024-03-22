import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import Jwt  from "jsonwebtoken";

 const generateAccessAndRefreshToken = async (userId) => {
   try {
     const user = await User.findById(userId);
     const accessToken = await user.generateAccessToken();
     const refreshToken = await user.generateRefreshToken();

     user.refreshToken = refreshToken;
     await user.save({ validateBeforeSave: false });

     return { accessToken, refreshToken };
   } catch (error) {
     throw new ApiError(
       500,
       "Something went wrong while generating referesh and access token"
     );
   }
 };

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

  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new ApiError(409, "Provided Username & Email already Exist");
  }

  const avaterLocalPath = req.files?.avatar[0]?.path;
  // console.log("avartar", req.files);
  // console.log(avaterLocalPath);
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath 

  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
      
    coverImageLocalPath = req.files.coverImage[0].path
  }

  // console.log(coverImageLocalPath);

  if (!avaterLocalPath) {
    throw new ApiError(400, "Avatar LocalPath is required");
  }

  const avatar = await uploadOnCloudinary(avaterLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log(coverImage);

  if (!avatar) {
    throw new ApiError(400, "Avatar object response required from cloudinary");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    userName: username.toLowerCase(),
    password,
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User registered Successfully"));
});


 const loginUser = asyncHandler(async (req, res) => {
   // req body -> data
   // username or email
   // find the user
   // password check
   // access and referesh token
   // send cookie
   const { email, userName, password } = req.body;

    //  console.log(email);
    //  console.log(userName);

   if (!email && !userName) {
     throw new ApiError(400, "Username and Email is required");
   }
   // Here is an alternative of above code based on logic discussed in video:
   // if (!(username || email)) {
   //     throw new ApiError(400, "username or email is required")

   // }
   const user = await User.findOne({
     $or: [{ email }, { userName }],
   });

   if (!user) {
     throw new ApiError(404, "User does not exist");
   }

   const isPasswordValid = await user.isPasswordCorrect(password);

   if (!isPasswordValid) {
     throw new ApiError(401, "Invalid user credentials");
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
     user._id
   );

   const loggedInUser = await User.findById(user._id).select(
     "-passwaord -refrshToken"
   );

   const options = {
     httpOnly: true,
     secure: true,
   };

   return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json( new ApiResponse(
       200,
       {
         user: loggedInUser,
         accessToken,
         refreshToken,
       },
       "User logged In Successfully"
     ));
 })

 const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
     req.user._id,
     {
       /**
        $set:{
          refreshToken: undefined
        }
        */
       $unset: {
         refreshToken: 1, // this removes the field from document
       },
     },
     {
       new: true,
     }
   );

   const options = {
     httpOnly: true,
     secure: true,
   };

   return res
     .status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "User logged Out"));
 });
 const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken =
     req.cookie.refreshToken || req.body.refreshToken;
   if (!incomingToken) {
     throw new ApiError(401, "unauthurized request");
   }

   try {
     const decodedToken = Jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
     );

     if (!decodedToken) {
       throw new ApiError(401, "Unable to varify refrsh token");
     }

     const user = User.findById(decodedToken._id);

     if (!user) {
       throw new ApiError(401, "Invalid Refresh Token");
     }

     if (incomingRefreshToken !== user?.refreshToken) {
       throw new ApiError(401, "Refresh token is expired or used");
     }

     const { accessToken, newRefreshToken } =
       await generateAccessAndRefreshToken();

     const options = {
       httpOnly: true,
       secure: true,
     };

     res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json(
         new ApiResponse(
           200,
           {
             accessToken,
             refreshToken: newRefreshToken,
           },
           "Access Token Refreshed"
         )
       );
   } catch (error) {
     throw new ApiError(401, error?.message || "Invalid refresh token");
   }
 });

 const changePassword = asyncHandler(async (req,res)=>{
  const {oldPassword, newPassword} = req.body

  if (!oldPassword || !newPassword) {
    throw new ApiError(401,"All fields are required")
  }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
      throw new ApiError(400, " Invalid Password")
    }

    user.password = newPassword
     
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, "Password Changed Successfully"))

 })

 const getCurrentUser = asyncHandler(async (req, res) => {
  return res
  .status(200),
  json(new ApiResponse(200, req.user, "User Fetched Successfully"))
 })

 const updateAccountDetails = asyncHandler(async (req, res)=>{
  const {fullName, email} = req.body
   if (!fullName || !email) {
     throw new ApiError(400, "All fields are required")
   }
    const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
          fullName,
          email: email
      }
    },
    {
      new: true
    }
   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "Account Details Updated Successfully"))
 })

 const updateAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path;
   if (!avatarLocalPath) {
     throw new ApiError(401, " Avatar file is Required");
   }

   //TODO: delete old image - assignment

   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if (!avatar) {
     throw new ApiError(401, " Unable to upload Avartar on Cloudinary");
   }

   const user = await User.findByIdAndUpdate(
     req.user?._id,
     {
       $set: {
         avatar: avatar.url,
       },
     },
     {
       new: true,
     }
   ).select("-password");

   return res
     .status(200)
     .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
 });
 const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, " CoverImage file is Required");
  }

  //TODO: delete old image - assignment

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(401, " Unable to upload coverImage on Cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) =>{
  const {username} = req.params
  
  if (!username?.trim()) {
     throw new ApiError(400, 'username is missing')
  }

  const channel = await User.aggregate([
      {
        $match:{
          userName: username?.toLowerCase()
        }
      },
      {
        $lookup:{
          from : "subscriptions",
          localField: _id,
          foreignField: "channel",
          as: "subscribers"
        }
      },

      {
        $lookup:{
          from: "subscriptions",
          localField: _id,
          foreignField: subscriber,
          as: "subscribedTo"
        }
      },
      {
        $addFields:{
          subscriberCount:{
            $size: "$subscribers"
          },

          channelSubscribedToCount: {
            $size: "$subscribedTo"
          },

          isSubscribed:{
            $cond: {
              if: {$in: [req.user?._id,"$subscribers.subscriber" ]},
              then: true,
              else: false,
            }
          }
        }
      },
      {
        $project:{
          fullName: 1,
          userName: 1,
          subscriberCount: 1,
          channelSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1
        }
      }
  ])


  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists")
  }
   // console.log(channel);
  return res
   .status(200)
   .json(new ApiResponse(200, channel[0], "User Channel  Fetched Successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile
}