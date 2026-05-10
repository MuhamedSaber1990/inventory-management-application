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

const app = express();
const port = process.env.PORT;

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(routes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
