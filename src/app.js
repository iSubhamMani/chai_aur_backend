import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN, // the url from where the requests are coming
        credentials: true,
    })
);

app.use(
    express.json({
        // a middleware function to parse incoming JSON data from HTTP requests
        limit: "16kb",
    })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" })); // a middleware function to parse incoming URL-encoded data from HTTP requests (extended: true allows for rich objects and arrays to be encoded into the URL-encoded format)
app.use(express.static("public")); // a middleware function to serve static files
app.use(cookieParser()); // a middleware function to parse cookies from the HTTP request object

// routes

import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";

// routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

export { app };
