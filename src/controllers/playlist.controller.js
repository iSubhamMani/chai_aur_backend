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

export { createPlayList, getUserPlaylists, addVideoToPlaylist };
