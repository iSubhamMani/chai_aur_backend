import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo,
    getVideoById,
    publishVideo,
} from "../controllers/video.controller.js";

const videoRouter = Router();

videoRouter.route("/publish-video").post(
    verifyToken,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishVideo
);

videoRouter.route("/v/:videoId").get(getVideoById);
videoRouter.route("/delete-video/:videoId").post(verifyToken, deleteVideo);

export default videoRouter;
