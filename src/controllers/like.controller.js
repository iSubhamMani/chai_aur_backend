import asyncHandler from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video Id not provided");
    }

    const isLiked = await Like.findOne({
        likedBy: req.user?._id,
        video: videoId,
    });

    if (!isLiked) {
        const like = await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });

        if (!like) {
            throw new ApiError(500, "Error liking the video");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Video liked successfully", like));
    } else {
        const unlike = await Like.deleteOne({
            likedBy: req.user?._id,
            video: videoId,
        });

        if (!unlike) {
            throw new ApiError(500, "Error unliking the video");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Video unliked successfully", unlike));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User Id not provided");
    }

    const allLikes = await Like.aggregate([
        {
            $match: { likedBy: new mongoose.Types.ObjectId(userId) },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
            },
        },
        {
            $addFields: {
                video: { $first: "$video" },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Liked videos fetched successfully", allLikes)
        );
});

export { toggleVideoLike, getLikedVideos };
