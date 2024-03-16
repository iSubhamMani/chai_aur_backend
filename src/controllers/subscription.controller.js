import { Subscription } from "../models/subscriptions.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const channel = await User.findById(channelId);

    if (!channel) {
        throw new ApiError(400, "Channel not found");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (!isSubscribed) {
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });

        if (!subscription) {
            throw new ApiError(500, "Error subscribing to channel");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Subscribed to channel", subscription));
    } else {
        const unsubscribe = await Subscription.deleteOne({
            subscriber: req.user._id,
            channel: channelId,
        });

        if (!unsubscribe) {
            throw new ApiError(500, "Error unsubscribing from channel");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Unsubscribed from channel", unsubscribe)
            );
    }
});

const getUserChannelSubscriber = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const subscribersList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                subscriber: { $first: "$subscriber" },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Subscribers fetched sucessfully",
                subscribersList
            )
        );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    const subscribedToList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                channel: { $first: "$channel" },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Subscribed channels fetched sucessfully",
                subscribedToList
            )
        );
});

export { toggleSubscription, getUserChannelSubscriber, getSubscribedChannels };
