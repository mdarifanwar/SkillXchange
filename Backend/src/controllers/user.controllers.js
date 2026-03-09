import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Request } from "../models/request.model.js";
import { Chat } from "../models/chat.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../utils/generateJWTToken.js";
import { uploadOnCloudinary } from "../config/connectCloudinary.js";
import { sendMail } from "../utils/SendMail.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const userDetailsWithoutID = asyncHandler(async (req, res) => {

  return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

export const UserDetails = asyncHandler(async (req, res) => {
  const username = req.params.username;

  const user = await User.findOne({ username: username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const receiverID = user._id;
  const senderID = req.user._id;
  const [request, existingChat] = await Promise.all([
    Request.findOne({
      $or: [
        { sender: senderID, receiver: receiverID },
        { sender: receiverID, receiver: senderID },
      ],
    }).sort({ updatedAt: -1 }),
    Chat.findOne({ users: { $all: [senderID, receiverID] } }),
  ]);

  let status = "Connect";
  if (existingChat) {
    status = "Connected";
  } else if (request) {
    status = request.status;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { ...user._doc, status: status }, "User details fetched successfully"));
});

export const UnRegisteredUserDetails = asyncHandler(async (req, res) => {

  return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
});

export const saveRegUnRegisteredUser = asyncHandler(async (req, res) => {

  const { name, email, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn } =
    req.body;

  if (!name || !email || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }

  if (!email.match(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)) {
    throw new ApiError(400, "Please provide valid email");
  }

  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }

  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }

  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }

  const existingUser = await User.findOne({ username: username });

  if (existingUser) {
    throw new ApiError(400, "Username already exists");
  }

  const user = await UnRegisteredUser.findOneAndUpdate(
    { email: email },
    {
      name: name,
      username: username,
      linkedinLink: linkedinLink,
      githubLink: githubLink,
      portfolioLink: portfolioLink,
      skillsProficientAt: skillsProficientAt,
      skillsToLearn: skillsToLearn,
    }
  );

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }
  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveEduUnRegisteredUser = asyncHandler(async (req, res) => {

  const { education, email } = req.body;
  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }
  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });

  const user = await UnRegisteredUser.findOneAndUpdate({ email: email }, { education: education });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveAddUnRegisteredUser = asyncHandler(async (req, res) => {

  const { bio, projects, email } = req.body;
  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }
  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }

  if (projects.length > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (!project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const user = await UnRegisteredUser.findOneAndUpdate({ email: email }, { bio: bio, projects: projects });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const registerUser = async (req, res) => {
  const {
    name,
    email,
    username,
    linkedinLink,
    githubLink,
    portfolioLink,
    skillsProficientAt,
    skillsToLearn,
    education,
    bio,
    projects,
  } = req.body;

  if (!name || !email || !username || skillsProficientAt.length === 0 || skillsToLearn.length === 0) {
    throw new ApiError(400, "Please provide all the details");
  }
  if (!email.match(/^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/)) {
    throw new ApiError(400, "Please provide valid email");
  }
  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }
  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }
  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }
  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }
  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });
  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }
  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }
  if (projects.length > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (!project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    throw new ApiError(400, "User Already registered");
  }

  const checkUsername = await User.findOne({ username: username });
  if (checkUsername) {
    throw new ApiError(400, "Username already exists");
  }

  const newUser = await User.create({
    name: name,
    email: email,
    username: username,
    linkedinLink: linkedinLink,
    githubLink: githubLink,
    portfolioLink: portfolioLink,
    skillsProficientAt: skillsProficientAt,
    skillsToLearn: skillsToLearn,
    education: education,
    bio: bio,
    projects: projects,
    picture: req.user.picture,
  });

  if (!newUser) {
    throw new ApiError(500, "Error in saving user details");
  }

  await UnRegisteredUser.findOneAndDelete({ email: email });

  const jwtToken = generateJWTToken_username(newUser);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
  // Standardize cookie settings for cross-browser compatibility
  res.cookie("accessToken", jwtToken, { httpOnly: true, expires: expiryDate, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" });
  res.clearCookie("accessTokenRegistration");
  return res.status(200).json(new ApiResponse(200, newUser, "NewUser registered successfully"));
};

export const saveRegRegisteredUser = asyncHandler(async (req, res) => {

  const { name, username, linkedinLink, githubLink, portfolioLink, skillsProficientAt, skillsToLearn, picture } =
    req.body;


  if (
    !name ||
    !username ||
    !Array.isArray(skillsProficientAt) || skillsProficientAt.length === 0 ||
    !Array.isArray(skillsToLearn) || skillsToLearn.length === 0
  ) {
    throw new ApiError(400, "Please provide all the details");
  }

  if (username.length < 3) {
    throw new ApiError(400, "Username should be atleast 3 characters long");
  }

  if (githubLink === "" && linkedinLink === "" && portfolioLink === "") {
    throw new ApiError(400, "Please provide atleast one link");
  }

  const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
  const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
  if ((linkedinLink && !linkedinLink.match(linkedinRegex)) || (githubLink && !githubLink.match(githubRegex))) {
    throw new ApiError(400, "Please provide valid github and linkedin links");
  }

  const user = await User.findOneAndUpdate(
    { username: req.user.username },
    {
      name: name,
      username: username,
      linkedinLink: linkedinLink,
      githubLink: githubLink,
      portfolioLink: portfolioLink,
      skillsProficientAt: skillsProficientAt,
      skillsToLearn: skillsToLearn,
      picture: picture,
    },
    { new: true }
  );

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveEduRegisteredUser = asyncHandler(async (req, res) => {

  const { education } = req.body;

  if (education.length === 0) {
    throw new ApiError(400, "Education is required");
  }

  education.forEach((edu) => {
    if (!edu.institution || !edu.degree) {
      throw new ApiError(400, "Please provide all the details");
    }
    if (
      !edu.startDate ||
      !edu.endDate ||
      !edu.score ||
      edu.score < 0 ||
      edu.score > 100 ||
      edu.startDate > edu.endDate
    ) {
      throw new ApiError(400, "Please provide valid score and dates");
    }
  });

  const user = await User.findOneAndUpdate({ username: req.user.username }, { education: education });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const saveAddRegisteredUser = asyncHandler(async (req, res) => {

  const { bio, projects } = req.body;

  if (!bio) {
    throw new ApiError(400, "Bio is required");
  }

  if (bio.length > 500) {
    throw new ApiError(400, "Bio should be less than 500 characters");
  }

  if (projects.length > 0) {
    projects.forEach((project) => {
      if (!project.title || !project.description || !project.projectLink || !project.startDate || !project.endDate) {
        throw new ApiError(400, "Please provide all the details");
      }
      if (!project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
        throw new ApiError(400, "Please provide valid project link");
      }
      if (project.startDate > project.endDate) {
        throw new ApiError(400, "Please provide valid dates");
      }
    });
  }

  const user = await User.findOneAndUpdate({ username: req.user.username }, { bio: bio, projects: projects });

  if (!user) {
    throw new ApiError(500, "Error in saving user details");
  }

  return res.status(200).json(new ApiResponse(200, user, "User details saved successfully"));
});

export const uploadPic = asyncHandler(async (req, res) => {
  const LocalPath = req.files?.picture[0]?.path;

  if (!LocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const picture = await uploadOnCloudinary(LocalPath);
  if (!picture) {
    throw new ApiError(500, "Error uploading picture");
  }

  res.status(200).json(new ApiResponse(200, { url: picture.url }, "Picture uploaded successfully"));
});

export const uploadCoverImage = asyncHandler(async (req, res) => {
  const localPath = req.files?.coverImage[0]?.path;

  if (!localPath) {
    throw new ApiError(400, "Cover image file is required");
  }
  const coverImage = await uploadOnCloudinary(localPath);
  if (!coverImage) {
    throw new ApiError(500, "Error uploading cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { coverImage: coverImage.url },
    { new: true }
  );

  res.status(200).json(new ApiResponse(200, { url: coverImage.url }, "Cover image uploaded successfully"));
});

export const discoverUsers = asyncHandler(async (req, res) => {

  const webDevSkills = [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "NoSQL",
  ];

  const machineLearningSkills = [
    "Python",
    "Natural Language Processing",
    "Deep Learning",
    "PyTorch",
    "Machine Learning",
  ];

  const users = await User.find({ username: { $ne: req.user.username } });

  if (!users) {
    throw new ApiError(500, "Error in fetching users");
  }
  const usersToLearn = [];
  const webDevUsers = [];
  const mlUsers = [];
  const otherUsers = [];

  // randomly shuffle the users array

  users.sort(() => Math.random() - 0.5);

  users.forEach((user) => {
    if (user.skillsProficientAt.some((skill) => req.user.skillsToLearn.includes(skill)) && usersToLearn.length < 5) {
      usersToLearn.push(user);
    } else if (user.skillsProficientAt.some((skill) => webDevSkills.includes(skill)) && webDevUsers.length < 5) {
      webDevUsers.push(user);
    } else if (user.skillsProficientAt.some((skill) => machineLearningSkills.includes(skill)) && mlUsers.length < 5) {
      mlUsers.push(user);
    } else {
      if (otherUsers.length < 5) otherUsers.push(user);
    }
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { forYou: usersToLearn, webDev: webDevUsers, ml: mlUsers, others: otherUsers },
        "Users fetched successfully"
      )
    );
});

export const sendScheduleMeet = asyncHandler(async (req, res) => {

  const { date, time, username } = req.body;
  if (!date || !time || !username) {
    throw new ApiError(400, "Please provide all the details");
  }

  const user = await User.findOne({ username: username });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const to = user.email;
  const subject = "SkillXchange: Request for Scheduling a meeting";
  
  // Create a proper HTML email
  const message = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #3BB4A1;">Meeting Request</h2>
      <p>Hello <strong>${escapeHtml(user.name)}</strong>,</p>
      <p><strong>${escapeHtml(req.user.name)}</strong> (${escapeHtml(req.user.username)}) has requested a video meeting with you.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${escapeHtml(date)}</p>
        <p><strong>Time:</strong> ${escapeHtml(time)}</p>
      </div>
      
      <p>Please log in to SkillXchange to coordinate further details.</p>
      <p><a href="${FRONTEND_URL}/chats" style="background-color: #3BB4A1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Chats</a></p>
      
      <p>Best regards,<br/>SkillXchange Team</p>
    </div>
  `;


  const sent = await sendMail(to, subject, message);
  
  if (!sent) {
     console.error("Failed to send email in sendScheduleMeet");
     // Even if email fails, we might want to return success to UI or fail. 
     // Usually better to fail so user knows.
     throw new ApiError(500, "Failed to send email notification. Please try again later.");
  }

  return res.status(200).json(new ApiResponse(200, null, "Email sent successfully"));
});
