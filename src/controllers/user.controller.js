import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const generateAccesAndRefreshTokens = async (userId) => {
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
    if (!email || !username) {
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

    const { accessToken, refreshToken } = await generateAccesAndRefreshTokens(
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

export { registerUser, loginUser, logoutUser };
