import express from "express";
import { createUser, loginUser } from "./UserController.ts";
import authenticate, { type AuthRequest } from "../Middlewares/authenticate.ts";

const userRouter = express.Router();

// Routes :-

userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);

// Protected route - test if token is valid
userRouter.get("/", authenticate, (req, res) => {
  const _req = req as AuthRequest;
  res.json({ authenticated: true, userId: _req.userId });
});

export default userRouter;
