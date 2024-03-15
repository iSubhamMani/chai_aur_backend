import { Subscription } from "../models/subscriptions.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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

export { toggleSubscription };
