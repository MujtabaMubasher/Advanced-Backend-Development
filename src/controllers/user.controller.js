import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

 const generateAccessAndRefreshToken = async (userId) => {
   try {
     const user = await User.findById(userId);
     const accessToken = await user.regenerateAccessToken();
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
    const {email, username, password} = req.body
     
    if (!email || !username) {
       throw new ApiError(400 , "Username and Email is required")
    }

    const user =  await User.findOne({
      $or: [{email},{username}]
    })

    if (!user) {
      throw new ApiError(404, 'User does not exist')
    }
     
   const isPasswordValid = await user.isPasswordCorrect(password)
   
   if (!isPasswordValid) {
       throw new ApiError(401, "Invalid user credentials")
   }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select('-passwaord -refrshToken')
    
    const options = {
      httpOnly: true,
      secure: true
    }

    return res
     .status(200)
     .cookie("accessToken",accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
      200,
      {
         user: loggedInUser, accessToken, refreshToken
      },
      "User logged In Successfully"
     )
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

export {
  registerUser,
  loginUser,
  logoutUser
}