import { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.model.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const contentImages = req.files?.contentImages || []
    const owner = req.user?._id

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    if (!owner) {
        throw new ApiError(400, "Please login to tweet")
    }
    
    let imageUrls = []
    if (Array.isArray(contentImages) && contentImages.length > 0) {
        for (const file of contentImages) {
            try {
                const uploadedImage = await uploadOnCloudinary(file.path)
                if (uploadedImage?.url) {
                    imageUrls.push(uploadedImage.url)
                }
            } catch (err) {
                throw new ApiError(500, err.message || "Error uploading image")
            }
        }
    }
    
    const tweet = await Tweet.create(
        {
            content,
            owner,
            contentImages:imageUrls
        }
    )
    
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet Created Successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {username} = req.params
    const user = await User.findOne({
        username
    })
        
    if (!user?._id) {
        throw new ApiError(
            400,
            "Username not found"
        )
    }
    
    const tweets = await Tweet.find({
        owner:user._id
    }).lean()
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "User Tweets fetched Successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
