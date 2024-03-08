import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
    deleteFromCloudinary,
    uploadToCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "An error occured");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get data from frontend

    const { fullName, email, username, password } = req.body;

    // validation - not empty

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists: username, email

    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    // file checking - avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // upload them to cloudinary, avatar check

    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Error uploading avatar");
    }

    // create user object - create entry in db

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    // check for user creation

    if (!createdUser) {
        throw new ApiError(500, "An error occured while registering the user");
    }
    // return response

    return res
        .status(201)
        .json(new ApiResponse(200, "User registered succesfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
    // get data from user
    const { email, username, password } = req.body;
    // check email or username
    if (!(email || username)) {
        throw new ApiError(400, "Email or username is required");
    }
    // find the user in db
    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // password check
    const isPasswordValid = await user.isPasswordValid(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    // generate access and refresh token

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedinUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // send tokens in cookies to user

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User logged in succesfully", {
                user: loggedinUser,
                refreshToken,
                accessToken,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refreshToken: undefined },
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully", {}));
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordValid(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    /* we did it this way to call the pre hook in the model to hash the password. Moreover
    the findByIdandUpdate method does not call the pre hook*/

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, "User found", req.user));
});

// text updates
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { fullName, email },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "User updated successfully", user));
});

// File updates
const updateUserAvatar = asyncHandler(async (req, res) => {
    const newAvatarLocalPath = req.files?.avatar[0]?.path;

    if (!newAvatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const newAvatar = await uploadToCloudinary(newAvatarLocalPath);

    if (!newAvatar.url) {
        throw new ApiError(500, "Error uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: newAvatar.url },
        },
        { new: true }
    ).select("-password");

    // Delete old image from cloudinary

    const oldAvatar = req.user?.avatar;

    if (!oldAvatar) {
        throw new ApiError(400, "Error uploading avatar");
    }

    const publicId = oldAvatar.split("/").pop().split(".")[0];

    const response = await deleteFromCloudinary(publicId);

    if (response.result !== "ok") {
        throw new ApiError(500, "Error deleting old avatar");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Avatar updated successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const newCoverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!newCoverImageLocalPath) {
        throw new ApiError(400, "Cover Image is required");
    }

    const newCoverImage = await uploadToCloudinary(newCoverImageLocalPath);

    if (!newCoverImage.url) {
        throw new ApiError(500, "Error uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: newCoverImage.url },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "Cover image updated successfully", user));
});

const renewToken = asyncHandler(async (req, res) => {
    try {
        // get refresh token from cookies
        const incomingRefreshToken =
            req.cookies?.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }
        // verify token
        const decodedRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedRefreshToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Token mismatch");
        }
        // generate new access token
        const { newAccessToken, newRefreshToken } =
            await generateAccessAndRefreshTokens(user?._id);

        // send new token to user

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, "Token refreshed successfully", {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                })
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

export {
    registerUser,
    loginUser,
    logoutUser,
    renewToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
};
