const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../secrets.js");
const {
  getAuthTokenFromCookieHeader,
} = require("../utils/auth-cookie.js");

const fetchuser = (req, res, next) => {
  const token =
    getAuthTokenFromCookieHeader(req.headers.cookie || "") ||
    req.header("auth-token");
  if (!token) {
    console.log("token not found");
    return res
      .status(401)
      .json({ error: "Please authenticate using a valid token" });
  } else {
    try {
      const data = jwt.verify(token, JWT_SECRET);
      req.user = data.user;
      next();
    } catch (error) {
      console.error(error.message);
      return res
        .status(401)
        .json({ error: "Please authenticate using a valid token" });
    }
  }
};

module.exports = fetchuser;
