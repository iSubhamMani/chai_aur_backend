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
    console.log(req);

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

const updateVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video Id not provided");
    }

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { title, description },
        },
        { new: true }
    );

    if (!video) {
        throw new ApiError(500, "Error updating video details");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Video details updated sucessfully", video));
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const thumbnailLocalPath = req.file?.path;
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(404, "Video Id not provided");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(404, "Thumbnail not provided");
    }

    const newThumbnail = await uploadToCloudinary(thumbnailLocalPath);

    if (!newThumbnail?.url) {
        throw new ApiError(500, "Error uploading thumbnail");
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: { thumbnail: newThumbnail?.url },
    });

    if (!video) {
        throw new ApiError(500, "Error updating thumbnail");
    }

    // remove old thumbnail from cloudinary

    const oldThumbnail = await deleteFromCloudinary(
        getCloudinaryId(video?.thumbnail)
    );

    if (!oldThumbnail) {
        throw new ApiError(500, "Error deleting old thumbnail");
    }

    const updatedVideo = await Video.findById(videoId);

    if (!updatedVideo) {
        throw new ApiError(500, "Error getting new video data");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, "Thumbnail updated sucessfully", updatedVideo)
        );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(404, "No video id provided");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Could not find the video");
    }

    const newVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: { isPublished: !video?.isPublished },
        },
        { new: true }
    );

    if (!newVideo) {
        throw new ApiError(500, "Error toggling published field");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Video status updated sucessfully", newVideo)
        );
});

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

    const options = {
        page,
        limit,
    };

    const pipeline = [
        {
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                ],
            },
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            },
        },
    ];

    const result = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        options
    );

    if (!result) {
        throw new ApiError(500, "Error getting data");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Fetched data sucessfully", result));
});

export {
    publishVideo,
    getVideoById,
    deleteVideo,
    updateVideoDetails,
    updateVideoThumbnail,
    togglePublishStatus,
    getAllVideos,
};
