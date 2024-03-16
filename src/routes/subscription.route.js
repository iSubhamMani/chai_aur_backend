import { Router } from "express";
import {
    getSubscribedChannels,
    getUserChannelSubscriber,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();

subscriptionRouter
    .route("/toggle-subscription/:channelId")
    .post(verifyToken, toggleSubscription);

subscriptionRouter
    .route("/all-subscribers/:channelId")
    .get(getUserChannelSubscriber);

subscriptionRouter
    .route("/subscribed-to/:subscriberId")
    .get(getSubscribedChannels);

export default subscriptionRouter;
