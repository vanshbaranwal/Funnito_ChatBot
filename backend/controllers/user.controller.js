import { supabase } from "../index.js";
// import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import sendVerificationEmail from "../utils/sendmail.utils.js";
import { Stats } from "fs";
import { asyncWrapProviders } from "async_hooks";


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

        const {data : existingUser, error: findError} = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if(findError && findError.code !== 'PGRST116'){     //PGRST116 means no rows found
            throw findError;
        }
        
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "user already exists",
            });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // user verification token
        const token = crypto.randomBytes(2).toString("hex"); // this will generate a 4 character long string because 1byte = 2hex characters  
        console.log("token created successfully");
        const tokenExpiry = new Date(Date.now() + 10*60*1000).toISOString(); // the token is set to expire in 10 mins and TOISOSTRING is used for supabase 

        // create a new user 
        const {data: user, error: insertError} = await supabase
            .from('users')
            .insert([{
                name,
                email,
                password: hashedPassword,
                isverified: false,
                // isverified: true, // this is just for the testing purpose (to bypass the verify controller)
                verification_token: token,
                verification_token_expiry: tokenExpiry,
            }])
            .select()
            .single();

        if(insertError){
            throw insertError;
        }

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
        // get token from body
        const token = req.body.token;
        
        // get user with valid token
        const {data: user, error: findError} = await supabase
            .from("users")
            .select("*")
            .eq('verification_token', token)
            .gt('verification_token_expiry', new Date().toISOString())  // gt here means greaterthan which says that if the date.now is greater than the time when the message was send.
            .single();
        
        // is user existing
        if(findError || !user){
            return res.status(400).json({
                success: false,
                message: "token invalid or expired",
            });
        }

        // update user verification status
        const {error : updateError} = await supabase
            .from('users')
            .update({
                isverified: true,
                verification_token: null,
                verification_token_expiry: null,
            })
            .eq('id', user.id);

        if(updateError){
            throw updateError;
        }

        return res.status(200).json({
            success: true,
            message: "user account is verified",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
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
        const {data: user, error: findError} = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if(findError || !user){
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
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        console.log("password match", isPasswordMatch);

        if(!isPasswordMatch){
            return res.status(400).json({
                success: false,
                message: "incorrect password",
            });
        }

        // jwt token for the user to access protected routes
        const accessToken = jwt.sign({id: user.id}, process.env.ACCESSTOKEN_SECRET, {
            expiresIn: process.env.ACCESSTOKEN_EXPIRY,
        });
        const refreshToken = jwt.sign({id: user.id}, process.env.REFRESHTOKEN_SECRET, {
            expiresIn: process.env.REFRESHTOKEN_EXPIRY,
        });
        
        // update user with refreshtoken 
        const {error: updateError} = await supabase 
            .from('users')
            .update({refresh_token: refreshToken}) // storing the above refreshtoken in the refresh_token that we created in the User.model file.
            .eq('id', user.id);

        if(updateError){
            throw updateError;
        }
        
        // set cookie
        const cookieOptions = {
            httpOnly: true, // this will save us from XSS attack
        }
        res.cookie("accessToken", accessToken, cookieOptions);
        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "login successful!",
        });

    } catch (error) {
        console.log(error.message);
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

        // find user by id exclude password
        const {data: user, error} = await supabase 
            .from('users')
            .select('id, name, email, isverified, role')
            .eq('id', userId)
            .single();

        // check if user exists
        if(error || !user){
            return res.status(400).json({
                success: false,
                message: "user not found"
            });
        }

        // send response
        return res.status(200).json({
            Status: true,
            user: {
                id: user.id,
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
            message: "error getting user profile",
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

        const {data: user, error: findError} = await supabase
            .from('users')
            .select('*')
            .eq('id', refreshDecoded.id)
            .single();

        if(findError || !user){
            return res.status(401).json({
                status: false,
                message: "unauthorized access",
            });
        }

        // clear refresh token in database
        const {error: updateError} = await supabase
            .from('users')
            .update({refresh_token: null})
            .eq('id', user.id);

        if(updateError){
            throw updateError;
        }
        
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