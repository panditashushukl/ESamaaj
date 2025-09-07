import {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(400, "Please login to Like.")
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video id")
    }

    const like = await Like.findOne({
        video:videoId,
        likedBy:userId
    })

    let message, result = null
    if (like) {
        await Like.findByIdAndDelete(like._id)
        message = "like removed from Video"
    }
    else {
        result = await Like.create({
            video:videoId,
            likedBy: userId
        })
        message = "like added to Video"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            result,
            message
        )
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(400, "Please login to Like.")
    }

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment id")
    }

    const like = await Like.findOne({
        comment:commentId,
        likedBy:userId
    })

    let message, result = null
    if (like) {
        await Like.findByIdAndDelete(like._id)
        message = "like removed from Comment"
    }
    else {
        result = await Like.create({
            comment:commentId,
            likedBy: userId
        })
        message = "like added to Comment"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            result,
            message
        )
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(400, "Please login to like.")
    }

    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet id")
    }

    const like = await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    let message, result = null
    if (like) {
        await Like.findByIdAndDelete(like._id)
        message = "like removed from Tweet"
    }
    else {
        result = await Like.create({
            tweet:tweetId,
            likedBy: userId
        })
        message = "like added to Tweet"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            result,
            message
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id

  if (!userId) {
    throw new ApiError(400, "Please login to like.")
  }

  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $ne: null }
  }).populate({
        path:"video",
        populate: {
            path:"owner",
            select:"_id username fullName avatar"
        }
    })

  const videos = likedVideos.map(like => like.video);

  res.status(200).json({
    success: true,
    count: videos.length,
    videos
  })
})

const getLikedTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id

  if (!userId) {
    throw new ApiError(400, "Please login to like.")
  }
  const likedTweet = await Like.find({
    likedBy: userId,
    tweet: { $ne: null }
  }).populate({
        path:"tweet",
        populate: {
            path:"owner",
            select:"_id username fullName avatar"
        }
    })
  const tweet = likedTweet.map(like => like.tweet)

  res.status(200).json({
    success: true,
    count: tweet.length,
    tweet
  })
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedTweets
}