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
    
    const createdTweet = await Tweet.create(
        {
            content,
            owner,
            contentImages:imageUrls
        }
    )

    const tweet = {
        ...createdTweet.toObject(),
        owner: {
            _id: req.user._id,
            fullName: req.user.fullName,
            username: req.user.username,
            avatar: req.user.avatar
        }
    }
    
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
    
    const userSummary = {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        avatar: user.avatar
    }

    const mappedTweets = tweets.map(tweet => ({
        ...tweet,
        owner: userSummary
    }))

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            mappedTweets,
            "User Tweets fetched Successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body
    const contentImages = req.files?.contentImages || []
    const owner = req.user?._id
    
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Please Enter a valid tweet Id")
    }
    if (!content) {
        throw new ApiError(400, "Content is required")
    }
    if (!owner) {
        throw new ApiError(400, "Please login to update tweet")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }

    if (owner.toString() !== tweet.owner.toString()) {
        throw new ApiError ("You are not authorise to Update the tweet")
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
    
    const updateData = {}
    if (content) updateData.content = content
    if (imageUrls) updateData.contentImages = imageUrls

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {$set : updateData},
        {new:true}
    )

    const modifiedTweet = {
        ...updatedTweet.toObject(),
        owner: {
            _id: req.user._id,
            fullName: req.user.fullName,
            username: req.user.username,
            avatar: req.user.avatar
        }
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            modifiedTweet,
            "Tweet updated Successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const owner = req.user?._id

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Please Enter a valid tweet Id")
    }
    if (!owner) {
        throw new ApiError(400, "Please login to Delete tweet")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }
    if (owner.toString() !== tweet.owner.toString()) {
        throw new ApiError ("You are not authorise to Delete the tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Tweet deleted Successfully"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
