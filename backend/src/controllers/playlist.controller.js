import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { request } from "http"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description = "" } = req.body
    if (!name) {
        throw new ApiError(400, "Name is required")
    }
    
    const userId = req.user?._id
    if (!userId) {
        throw new ApiError(401, "Unauthorized")
    }

    try {
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

    } catch (error) {
        throw new ApiError(500, "Failed to create playlist.")
    }
})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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
