import jwt from "jsonwebtoken";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // No token, unauthorized
  if (!token) return res.status(401).json({ error: "Token is required" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    // Token invalid, forbidden
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}

export default authenticateToken;
