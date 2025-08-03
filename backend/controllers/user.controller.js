// register controller.
import User from "../models/User.model.js";
import user from "../models/User.model.js";
import crypto from "crypto";

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
            email
        });
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "user already exists",
            });
        }

        // user verification token
        const token = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date.now() + 10*60*60*1000;

        // create a new user 
        const user = await User.create({
            name,
            email,
            password,
            verificationToken: token,
            verificationTokenExpiry: tokenExpiry,
        });

        if(!user){
            return res.status(200).json({
                success: false,
                message: "user not created",
            });
        }

        // send mail
        

    } catch (error) {
        
    }
};

export {register};