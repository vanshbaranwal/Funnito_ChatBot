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
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    const emailRegex_register = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // validate data
    if(!name || !email || !password){
        return res.status(400).json({
            success: false,
            message: "all fields are required.",
        });
    }

    // uername validation
    if(!nameRegex.test(name)){
        // console.log("name validation error is coming.");
        return res.status(400).json({
            success: false,
            message: "username should only contain letters, numbers and underscores.",
        });
    }

    // email validation
    if(!emailRegex_register.test(email)){
        return res.status(400).json({
            success: false,
            message: "enter a valid email address.",
        });
    }

    // password check validation
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
        const hashedPassword = await bcrypt.hash(password, 10); // 10 here tells bcrypt how many times it should process the hashing algorithm. Higher number = more secure, but also slower, 10 is standard.

        // user verification token
        const token = crypto.randomInt(1000, 9999); // this will generate a 4 digit random number..  
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
    const emailRegex_login = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // validate
    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: "all fields required",
        });
    }
    
    // email validation
    if(!emailRegex_login.test(email)){
        return res.status(400).json({
            success: false,
            message: "enter a valid email address.",
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

        // 
        if(user.auth_provider === 'google'){
            return res.status(400).json({
                success: false,
                message: "please use google sign-in for this account."
            })
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

// google oauth controller
const googleAuth = async(req, res) => {
    try {
        // get the token from authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // bearer token
        if(!token){
            return res.status(401).json({
                success: false,
                message: "no access token provided",
            });
        }

        // get user info from supabase using the token
        const {data: {user: googleUser}, error} = await supabase.auth.getUser(token);

        if(error || !googleUser){
            return res.status(401).json({
                success: false,
                message: "invalid token or google authentication failed"
            });
        }

        // chech if user exists in your custom users table
        const {date: existingUser, error: findError} = await supabase
            .from('users')
            .select('*')
            .eq('email', googleUser.email)
            .single();

        let user = existingUser;

        // if user doesnt exist create them 
        if(findError && findError.code === 'PGRST116'){ // no rows found
            const {data: newUser, error: insertError} = await supabase
                .from('users')
                .insert([{
                    name: googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || googleUser.email.split('@')[0],
                    email: googleUser.email,
                    password: null, // no password for google users
                    isverified: true, // google users are auto verified
                    google_id: googleUser.id, // store google id
                    auth_provider: 'google'
                }])
                .select()
                .single();

            if(insertError){
                console.error('error creating user: ', insertError);
                throw insertError;
            }
            user = newUser;
        } else if(findError){
            throw findError;
        }

        // if user exists but was created via email, update to allow google auth
        if(user && !user.auth_provider){
            await supabase
                .from('users')
                .update({
                    google_id: googleUser.id,
                    auth_provider: 'google',
                    isverified: true
                })
                .eq('id', user.id);
        }

        // generate your custom JWT token same as login
        const accessToken = jwt.sign({id: user.id}, process.env.ACCESSTOKEN_SECRET, {
            expiresIn: process.env.ACCESSTOKEN_EXPIRY,
        });
        const refreshToken = jwt.sign({id: user.id}, process.env.REFRESHTOKEN_SECRET, {
            expiresIn: process.env.REFRESHTOKEN_EXPIRY,
        });

        // update user with refreshtoken
        const {error: updateError} =  await supabase
            .from('users')
            .update({refresh_token: refreshToken})
            .eq('id', user.id);

        if(updateError){
            throw updateError;
        }

        // set cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };
        res.cookie("accessToken", accessToken, cookieOptions);
        res.cookie("refreshToken", refreshToken, cookieOptions);

        res.status(200).json({
            success: true,
            message: "google login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isverified: user.isverified,
                auth_provider: user.auth_provider
            }
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "internal server error",
        });
    }
};


export {register, verify, login, getProfile, logout, googleAuth};