const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../Models/User.js");
const Conversation = require("../Models/Conversation.js");
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require("../secrets.js");

const sanitizeFolder = (folder) => folder.replace(/^\/+|\/+$/g, "");

const sanitizeFilename = (filename) =>
  filename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60) || "upload";

const buildCloudinarySignature = (params, secret) => {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
};

const uploadImage = async (req, res) => {
  const { image, filename, folder = "chatloop" } = req.body;

  if (!image || !filename) {
    return res
      .status(400)
      .json({ error: "Image and filename are required" });
  }

  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Invalid image payload" });
  }

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    return res.status(500).json({
      error: "Cloudinary is not configured on the server",
    });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const cleanFolder = sanitizeFolder(folder);
  const publicId = `${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
  const signature = buildCloudinarySignature(
    {
      folder: cleanFolder,
      public_id: publicId,
      timestamp,
    },
    CLOUDINARY_API_SECRET,
  );

  try {
    const formData = new FormData();
    formData.append("file", image);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("folder", cleanFolder);
    formData.append("public_id", publicId);
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Image upload failed",
      });
    }

    return res.status(200).json({
      imageUrl: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getOnlineStatus = async (req, res) => {
  const userId = req.params.id;
  const requesterId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // If this user has blocked the requester, return offline (sanitized)
    const isBlocked = user.blockedUsers?.some(
      (id) => id.toString() === requesterId,
    );
    res.status(200).json({ isOnline: isBlocked ? false : user.isOnline });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const blockUser = async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user.id;
  if (targetId === myId)
    return res.status(400).json({ error: "Cannot block yourself" });
  try {
    await User.findByIdAndUpdate(myId, {
      $addToSet: { blockedUsers: targetId },
    });
    res.status(200).json({ message: "User blocked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const unblockUser = async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user.id;
  try {
    await User.findByIdAndUpdate(myId, {
      $pull: { blockedUsers: targetId },
    });
    res.status(200).json({ message: "User unblocked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBlockStatus = async (req, res) => {
  const targetId = req.params.id;
  const myId = req.user.id;
  try {
    const [me, them] = await Promise.all([
      User.findById(myId, "blockedUsers"),
      User.findById(targetId, "blockedUsers"),
    ]);
    if (!them) return res.status(404).json({ error: "User not found" });
    const iBlockedThem = me.blockedUsers.some(
      (id) => id.toString() === targetId,
    );
    const theyBlockedMe = them.blockedUsers.some(
      (id) => id.toString() === myId,
    );
    res.status(200).json({ iBlockedThem, theyBlockedMe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const PINNED_EMAIL = "pmsoni2016@gmail.com";

const getNonFriendsList = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const sort = req.query.sort || "name_asc"; // name_asc | name_desc | last_seen_recent | last_seen_oldest
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // IDs already in a conversation with the requester (including the requester themselves)
    const conversations = await Conversation.find({
      members: { $in: [req.user.id] },
    });
    const excludedIds = conversations.flatMap((c) => c.members);

    // Base filter: not in any conversation + not a bot
    const baseFilter = {
      _id: { $nin: excludedIds },
      email: { $not: /bot$/ },
    };

    // Search filter
    if (search) {
      baseFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Sort map
    const sortMap = {
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      last_seen_recent: { lastSeen: -1 },
      last_seen_oldest: { lastSeen: 1 },
    };
    const mongoSort = sortMap[sort] || sortMap.name_asc;

    // When no search: handle pinned user separately so they always appear at top of page 1
    let pinnedUser = null;
    if (!search) {
      pinnedUser = await User.findOne({
        ...baseFilter,
        email: PINNED_EMAIL,
      }).select("-password");
    }

    // Exclude pinned user from main paginated query
    const mainFilter = pinnedUser
      ? { ...baseFilter, _id: { $nin: [...excludedIds, pinnedUser._id] } }
      : baseFilter;

    // Adjust skip/limit on page 1 to account for the pinned slot
    const effectiveLimit = pinnedUser && page === 1 ? limit - 1 : limit;
    const effectiveSkip = pinnedUser && page > 1 ? skip - 1 : skip;

    const [users, total] = await Promise.all([
      User.find(mainFilter)
        .sort(mongoSort)
        .skip(Math.max(0, effectiveSkip))
        .limit(effectiveLimit)
        .select("-password"),
      User.countDocuments(mainFilter),
    ]);

    // Total including the pinned user
    const grandTotal = total + (pinnedUser ? 1 : 0);
    const hasMore = skip + limit < grandTotal;

    res.json({
      users,
      pinnedUser: page === 1 ? pinnedUser : null,
      hasMore,
      total: grandTotal,
      page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateprofile = async (req, res) => {
  try {
    const dbuser = await User.findById(req.user.id);
    const allowedUpdates = {
      name: req.body.name,
      about: req.body.about,
      profilePic: req.body.profilePic,
      emailNotificationsEnabled: req.body.emailNotificationsEnabled,
    };

    if (req.body.newpassword) {
      const passwordCompare = await bcrypt.compare(
        req.body.oldpassword,
        dbuser.password,
      );
      if (!passwordCompare) {
        return res.status(400).json({
          error: "Invalid Credentials",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.newpassword, salt);
      allowedUpdates.password = secPass;
    }

    // Remove undefined keys
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key],
    );

    await User.findByIdAndUpdate(req.user.id, allowedUpdates);
    res.status(200).json({ message: "Profile Updated" });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const anonymisedEmail = `deleted-${crypto.randomUUID()}-${user.email}`;

    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      name: "Deleted ChatLoop User",
      about: "",
      email: anonymisedEmail,
      profilePic:
        "https://ui-avatars.com/api/?name=Deleted+User&background=808080&color=ffffff&bold=true",
      // Wipe login credentials so the account cannot be accessed again
      password: "",
      otp: "",
      otpExpiry: null,
      lastSeen: null,
    });

    res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  uploadImage,
  getOnlineStatus,
  getNonFriendsList,
  updateprofile,
  blockUser,
  unblockUser,
  getBlockStatus,
  deleteAccount,
};
