import { Router } from "express";
import {
    changeCurrentUserPassword,
    getChannelDetails,
    getCurrentUser,
    getWatchHistory,
    loginUser,
    logoutUser,
    registerUser,
    renewToken,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

userRouter.route("/login").post(loginUser);

// protected routes
userRouter.route("/logout").post(verifyToken, logoutUser);
userRouter.route("/renew-token").post(renewToken);

userRouter
    .route("/change-password")
    .post(verifyToken, changeCurrentUserPassword);

userRouter.route("/current-user").get(verifyToken, getCurrentUser);

userRouter.route("/update-account").patch(verifyToken, updateAccountDetails);

userRouter
    .route("/update-avatar")
    .patch(verifyToken, upload.single("avatar"), updateUserAvatar);

userRouter
    .route("/update-cover-image")
    .patch(verifyToken, upload.single("coverImage"), updateUserCoverImage);

userRouter.route("/channel/:username").get(verifyToken, getChannelDetails);

userRouter.route("/history").get(verifyToken, getWatchHistory);

export default userRouter;
