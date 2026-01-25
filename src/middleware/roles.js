export function requireAdmin(req, res, next) {
  // Check if user exists (handled by requireAuth, but safety first)
  if (!req.user) {
    return res.redirect("/");
  }

  // Check Role
  if (req.user.role !== "admin") {
    //Render an error page
    return res.status(403).render("error.ejs", {
      title: "Access Denied",
      message: "You do not have permission to perform this action.",
      status: 403,
    });
  }

  //Allowed
  next();
}
