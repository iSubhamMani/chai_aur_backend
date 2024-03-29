import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishVideo,
    togglePublishStatus,
    updateVideoDetails,
    updateVideoThumbnail,
} from "../controllers/video.controller.js";

const videoRouter = Router();

videoRouter.route("/publish").post(
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
videoRouter.route("/delete/:videoId").post(verifyToken, deleteVideo);

videoRouter
    .route("/update-details/:videoId")
    .patch(verifyToken, updateVideoDetails);

videoRouter
    .route("/update-thumbnail/:videoId")
    .patch(verifyToken, upload.single("thumbnail"), updateVideoThumbnail);

videoRouter
    .route("/toggle-publish/:videoId")
    .patch(verifyToken, togglePublishStatus);

videoRouter.route("/all-videos").get(verifyToken, getAllVideos);

export default videoRouter;
