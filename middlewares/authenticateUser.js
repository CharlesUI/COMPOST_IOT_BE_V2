const { UnAuthorizedError } = require("../errors/ErrorClass");
const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnAuthorizedError("Authentication invalid");
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("payload: ", payload);
    req.user = payload; // Store payload in req.user
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    throw new UnAuthorizedError("Authentication invalid"); // Throw error for proper handling
  }
};

module.exports = authenticateUser;