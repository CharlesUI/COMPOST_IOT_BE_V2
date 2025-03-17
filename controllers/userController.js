const { StatusCodes } = require("http-status-codes");
const User = require("../model/User");
const Device = require("../model/Device");
const {
  BadRequestError,
  UnAuthorizedError,
  NotFoundError,
} = require("../errors/ErrorClass");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  console.log("Register body", req.body);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError("User with this email already exists");
    }

    const user = await User.create({ username, email, password });
    const token = user.createToken();

    res.status(StatusCodes.CREATED).json({
      token,
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      throw new BadRequestError(
        `Validation failed: ${errorMessages.join(", ")}`
      );
    }
    throw error;
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  console.log("Login body", req.body);

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnAuthorizedError("Invalid credentials");
  }

  const isPasswordCorrect = await user.isMatch(password);
  if (!isPasswordCorrect) {
    throw new UnAuthorizedError("Invalid credentials");
  }

  const token = user.createToken();

  res.status(StatusCodes.OK).json({
    token,
    _id: user._id,
    username: user.username,
    email: user.email,
    devices: user.devices,
  });
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords
    res.status(StatusCodes.OK).json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    throw error;
  }
};

const updateUser = async (req, res) => {
  const { userId } = req.user; // Get userId from authenticated user
  const { username, email } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new NotFoundError(`No user with id : ${userId}`);
    }

    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      throw new BadRequestError(
        `Validation failed: ${errorMessages.join(", ")}`
      );
    }
    throw error;
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundError(`No user with id : ${userId}`);
    }

    res.status(StatusCodes.OK).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    throw error;
  }
};

const addDevice = async (req, res) => {
  console.log(req.body)
  const { deviceNumber, userId } = req.body;

  if (!deviceNumber) {
    throw new BadRequestError("Device number is required");
  }

  // Validate the device number pattern
  const pattern = /^CMPST[A-Z0-9]{5}$/;
  if (!pattern.test(deviceNumber)) {
    throw new BadRequestError("Invalid device number pattern. Must be CMPST*****");
  }

  try {
    const device = await Device.findOne({ deviceNumber });
    if (!device) {
      throw new NotFoundError(`Device with number ${deviceNumber} not found`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }

    if (user.devices.includes(deviceNumber)) {
      throw new BadRequestError("Device already added to user");
    }

    user.devices.push(deviceNumber);
    await user.save();

    res.status(StatusCodes.OK).json({ message: "Device added successfully" });
  } catch (error) {
    console.error("Add device error:", error);
    throw error;
  }
};

const clearDevices = async (req, res) => {
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  const { userId } = req.body;

  console.log("USER ID", req.body)
  const user = await User.findById(userId);

  if (!user) {
    throw new UnAuthorizedError('Invalid credentials');
  }

  user.devices = []; // Clear the devices array
  await user.save();

  res.status(StatusCodes.OK).json({ user }); // Send back the updated user object
};

module.exports = {
  register,
  login,
  getUsers,
  deleteUser,
  updateUser,
  addDevice,
  clearDevices,
};
