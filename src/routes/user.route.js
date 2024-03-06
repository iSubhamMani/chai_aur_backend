import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    renewToken,
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
userRouter.route("/renewToken").post(renewToken);

export default userRouter;
