import { Router } from "express";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userRouter = Router();

// signUP

userRouter.post("/sign-up", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if the user already exists or not
    const userExists = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (userExists) {
      return res.status(411).json({
        error: "User Already exists",
      });
    }
    // sign the jwt token and hash the password

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      {
        id: createdUser.id,
      },
      process.env.JWT_SECRET ?? "SEcret",
    );

    return res.status(200).json({
      message: "Signed Up Succesfully",
      token: `Bearer ${token}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err,
    });
  }
});

userRouter.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if the user already exists or not
    const foundUser = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!foundUser) {
      return res.status(411).json({
        error: "User does not exist",
      });
    }
    // sign the jwt token

    const token = jwt.sign(
      {
        id: foundUser.id,
      },
      process.env.JWT_SECRET ?? "SEcret",
    );

    return res.status(200).json({
      message: "Signed Up Succesfully",
      token: `Bearer ${token}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err,
    });
  }
});

// sginIn

export default userRouter;
