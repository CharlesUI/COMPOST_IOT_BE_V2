require("dotenv").config();

require("express-async-errors");

const express = require("express");

const app = express();

const cors = require("cors");

const compression = require("compression"); // Added compression

const adminRouter = require("./routes/adminRouter");

const userRouter = require("./routes/userRouter");

const deviceRouter = require("./routes/deviceRouter");

const notifRouter = require("./routes/notifRouter");

const notFound = require("./middlewares/notFound");

const errorHandlerMiddleware = require("./middlewares/errorHandlerMiddleware");

const connectDb = require("./db/connect");

const authenticateUser = require("./middlewares/authenticateUser");

app.use(cors()); // Place cors() first

app.use(express.json({ limit: "10kb" })); // Add limit to express.json()

app.use(compression()); // Add compression

//Routes that do not require authentication would be placed here.

app.get("/", (req, res) => res.send("Express on Vercel"));

app.use("/api/v1/admin", adminRouter);

app.use("/api/v1/user", userRouter);

app.use("/api/v1/device", deviceRouter); // ALISIN MUNA AUTHENTICATION NG USER

app.use("/api/v1/notification", notifRouter);

app.use(notFound);

app.use(errorHandlerMiddleware);

// const port = process.env.PORT || 5000; // Not needed in Vercel

// const start = async () => {
//   try {
//     await connectDb(process.env.MONGO_LOCAL); // Use MONGO_URI for production

//     app.listen(port, console.log(`Server listening on port ${port}`));
//   } catch (error) {
//     console.error("Database connection error:", error);
//   }
// };

// start(); // Do not start the server directly in Vercel

const start = async () => {
  try {
    const mongoUri =
      process.env.NODE_ENV === "production"
        ? process.env.MONGO_URI
        : process.env.MONGO_LOCAL;
    await connectDb(mongoUri);
    console.log(process.env.NODE_ENV)
    console.log("Database connected");
    // No app.listen() here for Vercel
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

// Call start() only if not running on Vercel (e.g., during local development)
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  start().then(() => {
    app.listen(port, console.log(`Server listening on port ${port}`));
  });
} else {
  start(); // Still call start to attempt connection on Vercel
}

module.exports = app; // Export the Express app instance
