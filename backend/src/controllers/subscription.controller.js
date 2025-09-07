import {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelUsername} = req.params

    if (!channelUsername) {
        throw new ApiError(400, "Please provide ChannelUsername")   
    }

    const userId = req.user?._id
    const channel = await User.findOne({username: channelUsername})
    const channelId = channel?._id
    

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(401, "Unauthorized: Please login to continue")
    }

    if (!channelId) {
        throw new ApiError(400, "Channel is not Present")
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber:userId 
    })

    let result = null
    let message
    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        message = "Channel Unsubscribed successfully";
    }
    else {
        result = await Subscription.create({
            channel:channelId,
            subscriber:userId
        }) 
        message = "Channel Subscribed successfully";
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

// controller to return subscriber list of a channel
const getChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelUsername} = req.params

    if (!channelUsername) {
        throw new ApiError(400, "Please Provide ChannelUsername")
    }
    const channel = await User.findOne({username: channelUsername}).select("_id")
    
    if (!channel) {
        throw new ApiError(404, "Channel not Found")
    }

    const subscribers = await Subscription.find({
        channel: channel._id
    }).populate("subscriber", "_id username fullName avatar")

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Subscribers fetched Successfully")
    )
    
})

// controller to return channel list to which user has subscribed
const getUserSubscriptions = asyncHandler(async (req, res) => {
    const { username: subscriberUsername } = req.params

    if (!subscriberUsername) {
        throw new ApiError(400, "Please Provide subscriberUsername")
    }
    const subscriber = await User.findOne({username: subscriberUsername}).select("_id")
    
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not Found")
    }

    const channels = await Subscription.find({
        subscriber: subscriber._id
    }).populate("channel", "_id username fullName avatar")

    return res
    .status(200)
    .json(
        new ApiResponse(200, channels, "Channels fetched Successfully")
    )
})

export {
    toggleSubscription,
    getUserSubscriptions,
    getChannelSubscribers
}