import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    deleteFromCloudinary,
    deleteVideoFromCloudinary,
    uploadToCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import getCloudinaryId from "../utils/getCloudinaryId.js";

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoResponse = await uploadToCloudinary(videoFileLocalPath);
    const thumbnailResponse = await uploadToCloudinary(thumbnailLocalPath);

    if (!videoResponse || !thumbnailResponse) {
        throw new ApiError(400, "Error uploading Video");
    }

    // store in db
    const video = await Video.create({
        videoFile: videoResponse?.url,
        thumbnail: thumbnailResponse?.url,
        title,
        description,
        duration: videoResponse?.duration,
        owner: req.user,
    });

    if (!video) {
        throw new ApiError(500, "Error adding video to database");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Video Published sucessfully", video));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video Id not provided");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, "Video found", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    const vidResponse = await deleteVideoFromCloudinary(
        getCloudinaryId(video?.videoFile)
    );

    if (vidResponse.result !== "ok") {
        throw new ApiError(500, "Error deleting video from cloudinary");
    }

    const thumbnailResponse = await deleteFromCloudinary(
        getCloudinaryId(video?.thumbnail)
    );

    if (thumbnailResponse.result !== "ok") {
        throw new ApiError(500, "Error deleting thumbnail from cloudinary");
    }

    // remove from db

    const removeFromDb = await Video.findByIdAndDelete(videoId);

    if (!removeFromDb) {
        throw new ApiError(500, "Error deleting video from database");
    }

    res.status(200).json(new ApiResponse(200, "Video deleted sucessfully"));
});

export { publishVideo, getVideoById, deleteVideo };
