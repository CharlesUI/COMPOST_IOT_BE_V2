const express = require("express");
const router = express.Router();

const authenticateUser = require("../middlewares/authenticateUser");

const {
  register,
  login,
  getUsers,
  deleteUser,
  updateUser,
  addDevice,
  clearDevices,
} = require("../controllers/userController");

// Register and Login (no authentication required)
router.route("/register").post(register);
router.route("/login").post(login);

// Routes requiring authentication (using authenticateUser middleware in app.js)
router.route("/").get(getUsers); // Get all users (admin only?)
router.route("/device").post(addDevice).delete(clearDevices); // Add and remove devices
router.route("/").patch(updateUser).delete(deleteUser); // Update and delete own user

module.exports = router;