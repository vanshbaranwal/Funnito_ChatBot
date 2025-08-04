// register controller.
import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendVerificationEmail from "../utils/sendmail.utils.js";


const register = async(req, res) => {
    // get user data from req body
    const {name, email, password} = req.body;

    // validate data
    if(!name || !email || !password){
        return res.status(400).json({
            success: false,
            message: "all fields are required.",
        });
    }

    // password check
    if(password.length<4){
        return res.status(400).json({
            success: false,
            message: "password length should be greater than 4.",
        });   
    }

    try {
        // if existing user
        const existingUser = await User.findOne({
            email,
        });
        console.log("existing user");
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "user already exists",
            });
        }

        // user verification token
        const token = crypto.randomBytes(32).toString("hex");
        console.log("token created successful");
        const tokenExpiry = Date.now() + 10*60*60*1000;

        // create a new user 
        const user = await User.create({
            name,
            email,
            password,
            verificationToken: token,
            verificationTokenExpiry: tokenExpiry,
        });
        console.log("user created success", user);

        if(!user){
            return res.status(200).json({
                success: false,
                message: "user not created",
            });
        }

        // send mail
        await sendVerificationEmail(user.email, token);
        console.log("email sent successful");

        // response to user
        return res.status(200).json({
            success: true,
            message: "user registered successfully, now you have to verify your email.",
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: true,
            message: "internal server error",
        });
    }
};

// verify controller
const verify = async (req, res) => {
    try {
        // get token from params
        const token = req.params.token;
        
        // get user
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: {$gt: Date.now()}, // gt here means greaterthan which says that if the date.now is greater than the time when the message was send.
        })

        // is user existing
        if(!user){
            return res.status(200).json({
                success: false,
                message: "token invalid",
            });
        }

        user.isverified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "user account is verified",
        })
    } catch (error) {
        return res.status(500).json({
            success: true,
            message: "internal server error",
        });
    }
};

// login controller
const login = async (req, res) => {
    // get user data
    const {email, password} = req.body;

    // validate
    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: "all fields required",
        });
    }

    try {
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                success: false,
                message: "user not found",
            });
        }

        // check if the user is verified
        if(!user.isverified){
            return res.status(400).json({
                success: false,
                message: "user not found",
            });
        }

        // check password
        const isPasswordMatch = await user.comparePassword(password);
        console.log("password match", isPasswordMatch);
        if(!isPasswordMatch){
            return res.status(400).json({
                success: false,
                message: "incorrect password",
            });
        }

        // jwt token for the user to access protected routes
        const accessToken = jwt.sign({id: user._id}, process.env.ACCESSTOKEN_SECRET, {
            expiresIn: process.env.ACCESSTOKEN_EXPIRY,
        });
        const refreshToken = jwt.sign({id: user._id}, process.env.REFRESHTOKEN_SECRET, {
            expiresIn: process.env.REFRESHTOKEN_EXPIRY,
        });
        
        user.refreshToken = refreshToken; // storing the above refreshtoken in the refreshtoken that we created in the User.model file.
        await user.save();
        
        // set cookie
        const cookieOptions = {
            // expires: new Date(Date.now() + 24*60*60*1000),
            httpOnly: true, // this will save us from XSS attack
        }
        res.cookie("accessToken", accessToken, cookieOptions);
        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "login successful!",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "internal server error",
        });
    }
};

// get profile controller
const getProfile = async (req, res) => {
    // get user id from request object
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password"); // stopping password to go inside this user here. so thats why the '-'(minus) symbol is there

    if(!user){
        return res.status(400).json({
            success: false,
            message: "password is not correct"
        });
    }

    return res.status(200).json({
        success: true,
        message: "user profile acccess"
    });
};

export {register, verify, login, getProfile};