import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res, next) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Video Id not provided");
    }

    if (!content) {
        throw new ApiError(400, "Comment cannot be empty");
    }

    const comment = await Comment.create({
        content,
        owner: req.user?._id,
        video: videoId,
    });

    if (!comment) {
        throw new ApiError(500, "Error creating comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Comment added succesfully", comment));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) {
        throw new ApiError(400, "Comment Id not provided");
    }

    if (!content) {
        throw new ApiError(400, "Comment cannot be empty");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: { content },
        },
        { new: true }
    );

    if (!updatedComment) {
        throw new ApiError(500, "Error updating comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Comment updated successfully", updatedComment)
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment Id not provided");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, "Error deleting comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted successfully"));
});

export { addComment, updateComment, deleteComment };
