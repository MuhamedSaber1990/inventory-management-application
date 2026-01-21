// Main Express server configuration
import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";

dotenv.config();

import routes from "./src/routes/index.js";

import {
  notFoundHandler,
  globalErrorHandler,
} from "./src/middleware/errorHandler.js";

// Initialize environment variables and Express application
const app = express();
const port = process.env.PORT;

// Configure middleware for parsing requests, static files, and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  })
);
app.use(routes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
