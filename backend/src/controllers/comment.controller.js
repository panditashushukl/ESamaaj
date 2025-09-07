import { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const skip = (pageNumber - 1) * limitNumber

    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 }) 
        .skip(skip)
        .limit(limitNumber)
        .populate('owner', 'username avatar fullName _id') 
        .lean()

    const totalComments = await Comment.countDocuments({ video: videoId })

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                pagination: {
                    total: totalComments,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalComments / limitNumber)
                }
            },
            "Comments fetched successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user?._id
    const {content} = req.body
    if (!userId) {
        throw new ApiError(400, "Please login to Comment.")
    }
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video id")
    }
    if (!content) {
        throw new ApiError(400, "Please Provide comment content")
    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Requested Video is not present on the Server")
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner: userId
    })

    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment added successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Video id")
    }
    if (!content) {
        throw new ApiError(400, "Please Enter the content to Edit")
    }
    const comment = await Comment.findById(commentId)

     if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    
    if (req.user?._id.toString() !== comment.owner.toString()) {
        throw new ApiError(400, "You are not authorise to update that comment")
    }

    const UpdatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {content},
        {new:true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            UpdatedComment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Video id")
    }

    const comment = await Comment.findByIdAndDelete(commentId)

    if (!comment) {
        throw new ApiError(404, "requested Comment not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Comment Deleted successfully"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
