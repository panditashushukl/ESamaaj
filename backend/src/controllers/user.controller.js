import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const options = {
  httpOnly : true,
  secure : true
}
  

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    console.error("❌ Token generation error:", error);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};


/*
  Steps to register User:
    1. Get user details from frontend.
    2. Validation - not empty
    3. Check if user already exists : username and email.
    4. Check for images and Check for Avatar
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

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImagelocalFilePath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].path) {
      coverImagelocalFilePath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
      throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImagelocalFilePath)

    if (!avatar){
      throw new ApiError(400, "Avatar file is corrupted or not uploaded")
    }

    const user = await User.create({
      fullName,
      avatar: avatar.url,
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

  if (!username && !email) {
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
      $unset: {
        refreshToken: 1 //Removes feild from document
      }
    },
    {
      new:true
    }
  )

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logout Successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res)=>{
  try {
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  
    if (!incomingRefreshToken) {
      throw new ApiError(401,"Unauthorised request")
    }
  
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
    
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }
    
    
    if (incomingRefreshToken!== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token either expired or used");
    }
  
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken: newRefreshToken},
        "Access Token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token");
    
  }

})

const changeCurrentPassword = asyncHandler(async(req,res) => {
  const {oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400,"Invalid old Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "Password Changed Successfully"
    )
  )
})

const getCurrentUser = asyncHandler(async (req,res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(200,req.user,"Current User Fetched Successfully")
  )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
  const {fullName,email} = req.body

  if (!fullName && !email) {
    throw new ApiError(400, "At least one field (fullName or email) must be provided");
  }

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (email) updateData.email = email;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updateData
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    user,
    "Account details updated successfully"
  ))
})

const updateUserAvatar = asyncHandler(async (req,res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError (400, "Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    user,
    "Avatar updated successfully"
  ))
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError (400, "Error while uploading on coverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    user,
    "Cover Image updated successfully"
  ))
})

const getUserCurrentProfile = asyncHandler(async (req,res) => {
  const {username} = req.params

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username:username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as:"subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount:{
          $size : "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond:{
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username:1,
        avatar:1,
        coverImage:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        createdAt:1
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404,"Channel des not exists")
  }

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    channel[0],
    "User Channel fetched Successfully"
  ))
})

const getWatchHistory = asyncHandler(async (req,res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField:"watchHistory",
        foreignField:"_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from:"users",
              localField:"owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner: { $first: "$owner" }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch history fetched Successfully"
    )
  )
})

export {
  registerUser,
  loginUser,
  loggedOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserCurrentProfile,
  getWatchHistory
}