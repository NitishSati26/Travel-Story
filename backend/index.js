import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import upload from "./multer.js";
import authenticateToken from "./utilities.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "./models/user.model.js";
import TravelStory from "./models/travelStory.model.js";

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Database connection failed:", err));

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*" }));

// Create Account
app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: true,
      message: "All fields are required",
    });
  }

  try {
    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(400).json({
        error: true,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT access token
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "72h", // 1 hour expiration time for the access token
      }
    );

    return res.status(201).json({
      error: false,
      user: { fullName: newUser.fullName, email: newUser.email },
      accessToken,
      message: "User created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }

  const user = await User.findOne({
    email,
  });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const accessToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "72h",
    }
  );

  return res.json({
    error: false,
    message: "Login Successful",
    user: { fullName: user.fullName, email: user.email },
    accessToken,
  });
});

// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  const isUser = await User.findOne({ _id: userId });

  if (!isUser) {
    return res.sendStatus(401);
  }

  return res.json({
    user: isUser,
    message: "",
  });
});

// Route to handle image upload
// app.post("/image-upload", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ error: true, message: "No image uploaded" });
//     }

//     const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;

//     res.status(201).json({ imageUrl });
//   } catch (error) {
//     res.status(500).json({ error: true, message: error.message });
//   }
// });

// Delete an image from uploads folder
app.delete("/delete-image", async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res
      .status(400)
      .json({ error: true, message: "ImageUrl parameter is required" });
  }

  try {
    // Extract the file name from the imageUrl
    const fileName = path.basename(imageUrl);

    // Define the path
    const filePath = path.join(__dirname, "uploads", fileName);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Delete the file from the upload folder
      fs.unlinkSync(filePath);
      res.status(200).json({ message: "Image deleted successfully" });
    } else {
      res.status(200).json({ error: true, message: "Image not found" });
    }
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Server static files from the uploads and assets directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Add Travel Story
app.post(
  "/add-travel-story",
  authenticateToken,
  upload.single("imageUrl"),
  async (req, res) => {
    const { title, story, visitedLocation, visitedDate } = req.body;
    const imageUrl = req.file;
    const { userId } = req.user;

    // Validate required fields
    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
      return res
        .status(400)
        .json({ error: true, message: "All fields are required." });
    }

    // Convert visitedDate from miliseconds to Date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));
    const fileName = `http://localhost:8000/uploads/${imageUrl.filename}`;
    console.log(fileName);

    try {
      const travelStory = new TravelStory({
        title,
        story,
        visitedLocation,
        userId,
        imageUrl: fileName,
        visitedDate: parsedVisitedDate,
      });

      await travelStory.save();
      res
        .status(201)
        .json({ story: travelStory, message: "Added Successfully" });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  }
);

// Get All Travel Stories
app.get("/get-all-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const travelStories = await TravelStory.find({ userId: userId }).sort({
      isFavorite: -1,
    });
    res.status(200).json({ stories: travelStories });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

// Edit Travel Story
app.put("/edit-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
  const { userId } = req.user;

  // console.log("Request Body:", req.body);

  // Validate required fields
  if (!title || !story || !visitedLocation || !visitedDate) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required." });
  }

  // Convert visitedDate from miliseconds to Date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));

  try {
    // Find the travel story by ID and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    const placeholderImgUrl = `http://localhost:8000/assets/placeholder.png`;

    travelStory.title = title;
    travelStory.story = story;
    travelStory.visitedLocation = visitedLocation;
    travelStory.imageUrl = imageUrl || placeholderImgUrl;
    travelStory.visitedDate = parsedVisitedDate;

    await travelStory.save();
    res.status(200).json({ story: travelStory, message: "Update Successful" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Delete Travel Story
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const travelStory = await TravelStory.findById({ _id: id, userId: userId });
    if (!travelStory) {
      return res.status(404).json({
        error: true,
        message: "Couldn't find Travel Story" + req.params.id,
      });
    }
    await travelStory.deleteOne({ _id: id, userId: userId });

    //Extract the travel story from the database
    const imageUrl = travelStory.imageUrl;
    const filename = path.basename(imageUrl);

    // Delete the file path
    const filePath = path.join(__dirname, "uploads", filename);

    // Delete the image file from the uploads folder
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error("Failed to delete image file:", error);
      }
    });
    return res.status(200).json({
      message: "Success to delete travel story",
    });
  } catch (error) {
    return res.status(500).json({ error: true, message: error.message });
  }
});

// Update isFavourite
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { isFavourite } = req.body;
  const { userId } = req.user;

  try {
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });

    if (!travelStory) {
      return res
        .status(404)
        .json({ error: true, message: "Travel story not found" });
    }

    travelStory.isFavourite = isFavourite;

    await travelStory.save();
    res.status(200).json({ story: travelStory, message: "Update Successful" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Search travel stories
app.get("/search", authenticateToken, async (req, res) => {
  const { query } = req.query;
  const { userId } = req.user;

  if (!query) {
    res.status(404).json({ error: true, message: "query is required" });
  }

  try {
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocation: { $regex: query, $options: "i" } },
      ],
    }).sort({
      isFavourite: -1,
    });

    res.status(200).json({ stories: searchResults });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Filter travel stories by date range
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  const { userId } = req.user;

  try {
    // Ensure startDate and endDate are valid numbers before converting to Date objects
    const start = startDate ? new Date(parseInt(startDate)) : null;
    const end = endDate ? new Date(parseInt(endDate)) : null;

    if (start && isNaN(start.getTime())) {
      throw new Error("Invalid startDate");
    }
    if (end && isNaN(end.getTime())) {
      throw new Error("Invalid endDate");
    }

    // Build the query conditionally
    const dateFilter = {};
    if (start) dateFilter.$gte = start;
    if (end) dateFilter.$lte = end;

    const filteredStories = await TravelStory.find({
      userId: userId,
      ...(Object.keys(dateFilter).length > 0 && { visitedDate: dateFilter }),
    }).sort({ isFavourite: -1 });

    res.status(200).json({ stories: filteredStories });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});

export default app;
