import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const {channelUsername} = req.params

    if (!channelUsername) {
        throw new ApiError (400, "Username is required")
    }

    const channel = await User.findOne({
        username: channelUsername
    })

    if (!channel) {
        throw new ApiError(400, "Channel does not exists.")
    }

    const channelId = channel._id

    const totalSubscribers = await Subscription.countDocuments({ channel: channelId })

    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' },
                totalVideos: { $sum: 1 }
            }
        }
    ])

    const { totalViews = 0, totalVideos = 0 } = videoStats[0] || {}

    const videos = await Video.find({ owner: channelId }).select('_id')
    const videoIds = videos.map(v => v._id)

    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } })
    const {username, fullName, avatar, coverImage} = channel
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                channelId,
                username,
                fullName,
                avatar,
                coverImage,
                totalSubscribers,
                totalVideos,
                totalViews,
                totalLikes
            },
            "Channel Stats fetched Successfully"
        )
    );
})


const getChannelVideos = asyncHandler(async (req, res) => {
    const {channelUsername} = req.params

    if (!channelUsername) {
        throw new ApiError (400, "Username is required")
    }

    const user = await User.findOne({
        username: channelUsername
    })

    if (!user) {
        throw new ApiError(400, "Channel does not exists.")
    }

    const videos = await Video.find({
        owner:user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Videos fetched Successfully"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
}