import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import userModel from "./UserModel.ts";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import type { User } from "./UserTypes.ts";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // 1. Validation :-
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  try {
    // Database call
    // const user = await userModel.findOne({ email: email });
    const user = await userModel.findOne({ email });

    if (user) {
      const error = createHttpError(
        400,
        "User already exists with this email.",
      );
      return next(error);
    }
  } catch {
    // catch(err)
    return next(createHttpError(500, "Error while getting user"));
  }

  // 2. Process :-

  // password -> hash
  // password : secret -> ssssss, secret -> ssssss => salt => secret -> sfdfsfsdf, secret -> fgjasdgjs
  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;

  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch {
    // catch(err)
    return next(createHttpError(500, "Error while creating user."));
  }

  try {
    // Token Generation - JWT
    const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    // 3. Response :-
    res.status(201).json({ accessToken: token });
  } catch {
    // catch(err)
    return next(createHttpError(500, "Error while signing the jwt token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // 1. Validation
  if (!email || !password) {
    return next(createHttpError(400, "All fields are required"));
  }

  let user: User | null;

  // 2. Check if user exists
  try {
    user = await userModel.findOne({ email });

    if (!user) {
      return next(createHttpError(404, "User not found."));
    }
  } catch {
    return next(createHttpError(500, "Error while fetching user"));
  }

  // 3. Compare password
  let isMatch: boolean;

  try {
    isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(createHttpError(400, "Username or password incorrect"));
    }
  } catch {
    return next(createHttpError(500, "Error while comparing passwords"));
  }

  try {
    const token = jwt.sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    // 5. Response
    return res.json({ accessToken: token });
  } catch {
    return next(createHttpError(500, "Error while signing the JWT token"));
  }
};

export { createUser, loginUser };
