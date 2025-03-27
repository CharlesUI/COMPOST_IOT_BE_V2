const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[{1,3}\.{1,3}\.{1,3}\.{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
    },
    title: { type: String, required: true }, // Added title field
    password: { type: String, required: true },
    managedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Reference to User model
    managedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Device" }], // Reference to Device model
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.createToken = function () {
  return jwt.sign(
    { adminId: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};

adminSchema.methods.isMatch = async function (reqPassword) {
  try {
    return await bcrypt.compare(reqPassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false; // Or throw an error if needed
  }
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;