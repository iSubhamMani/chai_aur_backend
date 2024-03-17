import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    addVideoToPlaylist,
    createPlayList,
    getPlaylistById,
    getUserPlaylists,
} from "../controllers/playlist.controller.js";

const playlistRouter = Router();

playlistRouter.route("/create-playlist").post(verifyToken, createPlayList);
playlistRouter
    .route("/all-playlist/:userId")
    .get(verifyToken, getUserPlaylists);
playlistRouter
    .route("/add-to-playlist/:videoId/:playlistId")
    .patch(verifyToken, addVideoToPlaylist);
playlistRouter
    .route("/get-playlist/:playlistId")
    .get(verifyToken, getPlaylistById);

export default playlistRouter;
