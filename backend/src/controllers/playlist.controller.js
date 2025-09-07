import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description = "" } = req.body
    if (!name) {
        throw new ApiError(400, "Name is required")
    }
    
    const userId = req.user?._id
    if (!userId) {
        throw new ApiError(401, "Unauthorized")
    }

    const playlist = await Playlist.create(
        { 
            name, 
            description,
            owner:userId
        }
    )

    return res.status(201).json(
        new ApiResponse(
            201,
            playlist,
            "Playlist created Successfully."
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
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

    const playlists = await Playlist.find({
        owner:user._id
    }).lean()

    const userSummary = {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        avatar: user.avatar
    };

    const mappedPlaylists = playlists.map(tweet => ({
        ...tweet,
        owner: userSummary
    }))

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            mappedPlaylists,
            "Playlists fetched Successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID")
    }

    const playlistAggregation = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            },
        },
        {
            $lookup: {
                from:"users",
                localField:"owner",
                foreignField: "_id",
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
            $lookup: {
                from:"videos",
                localField:"videos",
                foreignField: "_id",
                as:"videoDetails"
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    _id: "$ownerDetails._id",
                    fullName: "$ownerDetails.fullName",
                    username: "$ownerDetails.username",
                    avatar: "$ownerDetails.avatar"
                },
                videos: {
                    $map: {
                        input: "$videoDetails",
                        as: "video",
                        in: {
                            _id: "$$video._id",
                            thumbnail: "$$video.thumbnail",
                            title: "$$video.title",
                            description: "$$video.description"
                        }
                    }
                }
            }
        }
    ])

    const playlist = playlistAggregation[0]

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched Successfully"
        )
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!playlistId || !videoId || !isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Either invalid VideoId or invalid PlaylistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
      throw new ApiError(404, "Playlist not found")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "Video not Found")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(409, "Video already exists in the playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video Added Successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if (!playlistId || !videoId || !isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Either invalid VideoId or invalid PlaylistId")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
      throw new ApiError(404, "Playlist not found")
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(409, "Video does not exists in the playlist")
    }

    playlist.videos.pull(videoId)
    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video Removed Successfully" 
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400,"Invalid playlist ID")
    }
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    
    if(req.user?._id.toString() !== playlist.owner.toString()){
        throw new ApiError(403,"Only owner have authority to delete the playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "Playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400,"Invalid playlist ID")
    }
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    if(!name && !description){
        throw new ApiError(401,"New name or description required")
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set : updateData
        },
        {
            new:true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
