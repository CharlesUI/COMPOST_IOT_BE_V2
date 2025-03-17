require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();
const cors = require("cors");
const compression = require("compression"); // Added compression

const userRouter = require("./routes/userRouter");
const deviceRouter = require("./routes/deviceRouter");

const notFound = require("./middlewares/notFound");
const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");
const connectDb = require("./db/connect");
const authenticateUser = require("./middlewares/authenticateUser");

app.use(cors()); // Place cors() first
app.use(express.json({ limit: "10kb" })); // Add limit to express.json()
app.use(compression()); // Add compression

//Routes that do not require authentication would be placed here.

app.use("/api/v1/user", userRouter);
app.use("/api/v1/device", deviceRouter); // ALISIN MUNA AUTHENTICATION NG USER

app.use(notFound);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb(process.env.MONGO_LOCAL); // Use MONGO_URI for production
    app.listen(port, console.log(`Server listening on port ${port}`));
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

start();