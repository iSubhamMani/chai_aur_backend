import { Router } from "express";
import { toggleSubscription } from "../controllers/subscription.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();

subscriptionRouter
    .route("/toggle-subscription/:channelId")
    .post(verifyToken, toggleSubscription);

export default subscriptionRouter;
