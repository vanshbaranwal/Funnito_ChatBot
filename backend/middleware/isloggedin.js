// import User from "../models/User.model.js";
import { supabase } from "../index.js";
import jwt from "jsonwebtoken";

const isLoggedIn = async (req, res, next) => {
    try {
        // get token form cookie
        // const token = req.cookies.jwtToken;
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        // check for access token if yess -> direct login
        // if no access token then check for refresh token if refresh token is there -> provide new access and refresh token 
        // if access and refresh token both not there then ask the user to login again
        if(!accessToken){
            if(!refreshToken){
                return res.status(401).json({
                    status: false,
                    message: "unauthorized access",
                });
            }
            // if refresh token is present
            const refreshDecoded = jwt.verify(refreshToken, process.env.REFRESHTOKEN_SECRET);
            console.log(refreshDecoded.id);

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
            console.log(user.email);

            // generate new token
            const newAccessToken = jwt.sign({id: user.id}, process.env.ACCESSTOKEN_SECRET, {
                expiresIn: process.env.ACCESSTOKEN_EXPIRY,
            });
            const newRefreshToken = jwt.sign({id: user.id}, process.env.REFRESHTOKEN_SECRET, {
                expiresIn: process.env.REFRESHTOKEN_EXPIRY,
            });

            // update users refreshtoken in database
            const {error: updateError} = await supabase
                .from('users')
                .update({refresh_token: newRefreshToken})
                .eq('id', user.id);

            if(updateError){
                throw updateError;
            }

            const cookieOptions = {
                httpOnly: true,
            };

            res.cookie("accessToken", newAccessToken, cookieOptions);
            res.cookie("refreshToken", newRefreshToken, cookieOptions);
            req.user = refreshDecoded;
            next();


        } else{

            // direct login and generate nre access and refresh tokens
            const accessDecoded = jwt.verify(accessToken, process.env.ACCESSTOKEN_SECRET);

            // find user by id using supabase
            const {data: user, error: findError} = await supabase
                .from('users')
                .select('*')
                .eq('id', accessDecoded.id)
                .single();

            if(findError || !user){
                return res.status(401).json({
                    status: false,
                    message: "unauthorized access",
                });
            }

            const newAccessToken = jwt.sign({id: user.id}, process.env.ACCESSTOKEN_SECRET, {
                expiresIn: process.env.ACCESSTOKEN_EXPIRY,
            });
            const newRefreshToken = jwt.sign({id: user.id}, process.env.REFRESHTOKEN_SECRET, {
                expiresIn: process.env.REFRESHTOKEN_EXPIRY,
            });

            // update users refreshtoken in database
            const {error: updateError} = await supabase
                .from('users')
                .update({refresh_token: newRefreshToken})
                .eq('id', user.id);
            
            if(updateError){
                throw updateError;
            }
            
            const cookieOptions = {
                httpOnly: true,
            };

            res.cookie("accessToken", newAccessToken, cookieOptions);
            res.cookie("refreshToken", newRefreshToken, cookieOptions);
            req.user = accessDecoded;
            next();

        }


    } catch (error) {
        console.error("this is the error that is coming : ",error);
        return res.status(500).json({
            success: false,
            message: "internal server error!!"
        });
    }
};

export default isLoggedIn;