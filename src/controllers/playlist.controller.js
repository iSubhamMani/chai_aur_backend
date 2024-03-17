import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose from "mongoose";

const createPlayList = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title) {
        throw new ApiError(400, "Title is required");
    }

    const playlist = await Playlist.create({
        title,
        description,
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError(500, "Error creating playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Playlist created sucessfully", playlist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User Id not provided");
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User playlists fetched sucessfully",
                userPlaylists
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!(playlistId && videoId)) {
        throw new ApiError(400, "Playlist Id and Video Id are both required");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { videos: videoId },
        },
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(500, "Error adding video to playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video added to playlist", playlist));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id not provided");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            },
        },
    ]);

    if (!playlist) {
        throw new ApiError(500, "Error getting playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Playlist fetched successfully", playlist[0])
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params;

    if (!(videoId && playlistId)) {
        throw new ApiError(400, "Playlist Id and Video Id are both required");
    }

    const result = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: new mongoose.Types.ObjectId(videoId) },
        },
        { new: true }
    );

    if (!result) {
        throw new ApiError(500, "Error removing video from playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video removed from playlist", result));
});

const deletePlayList = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id not provided");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(500, "Error deleting playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist deleted succesffully"));
});

export {
    createPlayList,
    getUserPlaylists,
    addVideoToPlaylist,
    getPlaylistById,
    removeVideoFromPlaylist,
    deletePlayList,
};
