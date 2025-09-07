import {isValidObjectId} from "mongoose"
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
        filter.isPublished = true
    }

    else if (username) {
        const user = await User.findOne({ username })
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        if (user._id.toString()!==req.user._id.toString()) {
            filter.isPublished = true
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
    const totalPages = Math.ceil(totalVideos / limitNum)

    const pipeline = [
        {
            $match: filter
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                likes: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    fullName: "$ownerDetails.fullName",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar"
                }
            }
        },
        {
            $sort: sortOptions
        },
        {
            $skip: skip
        },
        {
            $limit: limitNum
        }
    ]

    const videos = await Video.aggregate(pipeline)

    res.status(200).json(
        new ApiResponse(
            200,
            {
                currentPage: pageNum,
                totalPages,
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

    if (!description) {
        throw new ApiError(400, "Description can't be empty")
    }

    const owner = req.user?._id
    if (!owner) {
        throw new ApiError(400, "You are not authorise to upload a video")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!thumbnailLocalPath || !videoFileLocalPath) {
        throw new ApiError(400, "Thumbnail and Avatar file is required")
    }
    
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile.url) throw new ApiError(500,"Something went wrong while uploading thumbnail")
    if (!thumbnail.url) throw new ApiError(500,"Something went wrong while uploading thumbnail")

    let duration = videoFile?.duration
    const publicId = videoFile?.public_id || videoFile?.publicId

    if (!duration && publicId) {
        const resource = await cloudinary.api.resource(publicId, { resource_type: "video" })
        duration = resource?.duration
    }

    const video = new Video({
        title,
        description,
        videoFile : videoFile.url,
        thumbnail : thumbnail.url,
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

    const videoAggregation = await Video.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField:"_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: {
                path: "$ownerDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project:{
                _id: 1,
                videoFile: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    fullName: "$ownerDetails.fullName",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar"
                }
            }
        }
    ])

    const video = videoAggregation[0]

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

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

    const thumbnailLocalPath = req.file?.path
    
    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400,"Title or description or thubnail is required is requred to update data")
    }

    let thumbnail
    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!thumbnail.url) throw new ApiError(500,"Something went wrong while uploading thumbnail")
    }
    const updateData = {}
    if (title) updateData.title = title
    if (description) updateData.description = description
    if (thumbnail) updateData.thumbnail = thumbnail.url

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateData
        },
        {new:true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video details updated SuccessFully"
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
