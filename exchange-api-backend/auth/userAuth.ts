import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export default async function userAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(403).json({
        message: "token not provided",
      });
    }

    const body = jwt.verify(token, process.env.JWT_SECRET ?? "sec3et");
    const id = (body as JwtPayload).id;
    req.userId = id;
    next();
  } catch (err) {
    return res.status(500).json({
      error: err,
    });
  }
}
