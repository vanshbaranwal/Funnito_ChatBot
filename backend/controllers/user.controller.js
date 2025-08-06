import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendVerificationEmail from "../utils/sendmail.utils.js";
import { Stats } from "fs";


// register controller.
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
        const token = crypto.randomBytes(2).toString("hex"); // this will generate a 4 character long string because 1byte = 2hex characters  
        console.log("token created successful");
        const tokenExpiry = Date.now() + 10*60*1000; // the token is set to expire in 10 mins 

        // create a new user 
        const user = await User.create({
            name,
            email,
            password,
            // isverified: true, // this is just for the testing purpose (to bypass the verify controller)
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
                message: "your account is not verified",
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
    
    try {
        // get user id from request object
        const userId = req.user.id;

        // find user by id
        const user = await User.findById(userId).select("-password"); // stopping password to go inside this user here. so thats why the '-'(minus) symbol is there

        // check if user exists
        if(!user){
            return res.status(400).json({
                success: false,
                message: "password is not correct"
            });
        }

        // send response
        return res.status(200).json({
            Status: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isverified: user.isverified,
                role: user.role,
            },
        });


    } catch (error) {
        console.error("error getting user profile", error);
        return res.status(500).json({
            status: false,
            message: "error geting user profile",
        });
    }
};


// logout controller
const logout = async(req, res) => {
    const token = req.cookies.refreshToken;
    if(!token){
        return res.status(401).json({
            status: false,
            message: "unauthorized access",
        });
    }

    try {

        // check if the user is logged inn
        const refreshDecoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET);
        const user = await User.findOne({_id: refreshDecoded.id});

        if(!user){
            return res.status(401).json({
                status: false,
                message: "unauthorized access",
            });
        }

        user.refreshToken = null; // here we are not doing undefined in place of null because this field will be used later
        
        // clear cookie
        res.cookie("accessToken", "", {
            httpOnly: true,
            expires: new Date(0), // date(0) tells the browser that the cookie has already expired. and will cause the browser to delete the cookie immediately.
        });
        res.cookie("refreshToken", "", {
            httpOnly: true,
            expires: new Date(0),
        });


        // send response
        return res.status(200).json({
            status: true,
            message: "user logged out successfully",
        });

    } catch (error) {
        console.error("user log out failed : ", error);
        return res.status(500).json({
            status: false,
            message: "user logout failed"
        });
    }
};


export {register, verify, login, getProfile, logout};