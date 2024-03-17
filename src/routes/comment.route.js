import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    addComment,
    deleteComment,
    updateComment,
} from "../controllers/comment.controller.js";

const commentRouter = Router();

commentRouter.route("/add-comment/:videoId").post(verifyToken, addComment);
commentRouter
    .route("/update-comment/:commentId")
    .patch(verifyToken, updateComment);
commentRouter
    .route("/delete-comment/:commentId")
    .post(verifyToken, deleteComment);

export default commentRouter;
