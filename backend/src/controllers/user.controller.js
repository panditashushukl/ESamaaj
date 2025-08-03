import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens = async (userId) =>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"Something went wrong while while generating refresh and access token")
  }
}

/*
  Steps to register User:
    1. Get user details from frontend.
    2. Validation - not empty
    3. Check if user already exists : username and email.
    4. Check for images and Check for Avtar
    5. Upload on cloudinary
    6. Create user object - create entry in DB
    7. Remove password and refresh token feild from response.
    8. Check for user creation
    9. Return Response else return error
*/

const registerUser = asyncHandler(
  async (req,res) => {
    const {fullName,email,username,password} = req.body
    console.log(fullName,email,username,password);
    if (
      [fullName,email,username,password].some((feild) => feild?.trim() === "")
    ) {
      throw new ApiError(400, "All feilds required")
    }

    if (!email.includes("@")) {
      throw new ApiError(400, "Invalid email address");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,12}$/;
    if (!passwordRegex.test(password)) {
      throw new ApiError(
        400,
        "Password must be 8-12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
    }


    const existedUser = await User.findOne({
      $or: [{ username }, { email }]
    })

    if(existedUser){
      throw new ApiError(409, "User with email or Username already exists")
    }

    const avtarLocalPath = req.files?.avtar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImagelocalFilePath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].path) {
      coverImagelocalFilePath = req.files.coverImage[0].path
    }

    if (!avtarLocalPath) {
      throw new ApiError(400, "Avtar file is required")
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagelocalFilePath)

    if (!avtar){
      throw new ApiError(400, "Avatar file is corrupted or not uploaded")
    }

    const user = await User.create({
      fullName,
      avtar: avtar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user.")
    }

    return res.status(201).json(
      new ApiResponse(200,createdUser,"User Registered Successfully.")
    )
  }
)

/*
  Steps to Login User
    1. Take response from the frontend
    2. Check username or email exist in Database
    3. if username exist match the password
    4. if Password matches login the user else through error
    5. enerate access and refresh Token
    6. Send secure cookies
*/

const loginUser = asyncHandler(async (req, res) => {

  const {email,username,password} = req.body

  if (!username || !email) {
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{username},{email}]
  })

  if (!user) {
    throw new ApiError(400, "User not Found")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password")
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken",refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser,
        accessToken,
        refreshToken
      },
      "User logged In Successfully"
    )
  )

})

/*
  Steps to Logout User
    1. Delete the accessToken and the refreshToken from user side
    2. Also delete the refreshToken from the Database
*/
const loggedOutUser = asyncHandler(async (req,res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new:true
    }
  )

  const options = {
    httpOnly : true,
    secure : true
  }
  
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logout Successfully"))

})

export {
  registerUser,
  loginUser,
  loggedOutUser
}