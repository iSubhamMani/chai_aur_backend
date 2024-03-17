import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    getLikedVideos,
    toggleVideoLike,
} from "../controllers/like.controller.js";

const likeRouter = Router();

likeRouter.route("/toggle-like/:videoId").post(verifyToken, toggleVideoLike);
likeRouter.route("/all-likes/:userId").get(verifyToken, getLikedVideos);

export default likeRouter;
