// 404 Not Found Handler
export function notFoundHandler(req, res, next) {
  res.status(404).render("error.ejs", {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist.",
    status: 404,
  });
}

// Global Error Handler
export function globalErrorHandler(err, req, res, next) {
  console.error("Error:", err);

  // CSRF Error
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).render("error.ejs", {
      title: "Invalid Request",
      message: "Form has expired. Please refresh and try again.",
      status: 403,
    });
  }

  // Validation Error
  if (err.name === "ValidationError") {
    return res.status(400).render("error.ejs", {
      title: "Validation Error",
      message: err.message,
      status: 400,
    });
  }

  // Database Error
  if (err.code && err.code.startsWith("23")) {
    return res.status(400).render("error.ejs", {
      title: "Database Error",
      message: "A database constraint was violated.",
      status: 400,
    });
  }

  // Default Server Error
  const status = err.status || 500;
  res.status(status).render("error.ejs", {
    title: "Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong. Please try again later."
        : err.message,
    status,
  });
}

//  * Wraps async route handlers to catch errors
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
