import express from "express";
import { getProfile, googleAuth, login, logout, register, verify } from "../controllers/user.controller.js";
import isLoggedIn from "../middleware/isloggedin.js";


const router = express.Router();


router.post("/register", register);
router.post("/verify", verify);
router.post("/login", login);
router.post("/auth/google/callback", googleAuth)
router.get("/get-profile", isLoggedIn, getProfile);
router.post("/logout", isLoggedIn, logout);

export default router;