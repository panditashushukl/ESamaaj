import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { v2 as cloudinary } from "cloudinary"


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = 'createdAt',
        sortType = 'desc',
        username,
    } = req.query

    if (!query && !username) {
        throw new ApiError(400, "Username or Query is required to get all videos")
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.max(1, parseInt(limit, 10) || 10)
    const skip = (pageNum - 1) * limitNum

    const filter = {}

    if (query) {
        filter.title = { $regex: query, $options: 'i' } 
    }

    if (username) {
        const user = await User.findOne({ username })
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        filter.owner = user._id
    }

    const allowedSortFields = ['createdAt', 'title', 'views', 'likes']
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sort field")
    }

    const sortOptions = {}
    if (sortBy) {
        sortOptions[sortBy] = sortType === 'asc' ? 1 : -1
    }

    const totalVideos = await Video.countDocuments(filter)

    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)

    res.status(200).json(
        new ApiResponse(
            200,
            {
                currentPage: pageNum,
                totalPages: Math.ceil(totalVideos / limitNum),
                totalVideos,
                videos,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            "Videos fetched Successfully"
        )
    )
})


/*
    Steps to Publish a Video:
        1. Verify if title Present
        2. Check weather login user is present or not
        3. Take Path of videoFile and thubnail from multer
        4. Upload video and Thumbnail on cloudinary
        5. Take Video length from cloudinary 
        6. Save everything on database
        7. Return the response
*/
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description = title} = req.body

    if (!title) {
        throw new ApiError(400, "Title of video is Mandatory")
    }

    const owner = req.user?._id
    if (!owner) {
        throw new ApiError(400, "You are not authorise to upload a video")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!thumbnailLocalPath || !videoFileLocalPath) {
        throw new ApiError(400, "Thumbnail and Avatar file is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    let duration = videoFile?.duration
    const publicId = videoFile?.public_id || videoFile?.publicId

    if (!duration && publicId) {
        const resource = await cloudinary.api.resource(publicId, { resource_type: "video" })
        duration = resource?.duration
    }

    const video = new Video({
        title,
        description,
        videoFile,
        thumbnail,
        owner,
        duration
    })
    await video.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video Published Successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }

    const video = await Video.findById(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched Successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }

    if (!title && !description) {
        throw new ApiError(400,"Title or description is requred to update data")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateData
        },
        {new:true}
    )

    return res
    .status(200
    .json(
        new ApiResponse(
            200,
            video,
            "Video details updated SuccessFully"
        )
    )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }
    
    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Video deleted Successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }
    
    const video = await Video.findById(videoId)

    let isPublished
    if (video.isPublished) {
        isPublished = false
    }
    else {
        isPublished = true
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video Publish status updated Successfully"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
