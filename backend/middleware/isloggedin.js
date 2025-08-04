import User from "../models/User.model.js";
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

            const user = await User.findOne({_id: refreshDecoded.id});
            console.log(user.email);

            if(!user){
                return res.status(401).json({
                    status: false,
                    message: "unauthorized access",
                });
            }

            const newAccessToken = jwt.sign({id: user._id}, process.env.ACCESSTOKEN_SECRET, {
                expiresIn: process.env.ACCESSTOKEN_EXPIRY,
            });
            const newRefreshToken = jwt.sign({id: user._id}, process.env.REFRESHTOKEN_SECRET, {
                expiresIn: process.env.REFRESHTOKEN_EXPIRY,
            });

            user.refreshToken = newRefreshToken;
            await user.save();

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
            const user = await User.findOne({_id: accessDecoded.id});
            if(!user){
                return res.status(401).json({
                    status: false,
                    message: "unauthorized access",
                });
            }

            const newAccessToken = jwt.sign({id: user._id}, process.env.ACCESSTOKEN_SECRET, {
                expiresIn: process.env.ACCESSTOKEN_EXPIRY,
            });
            const newRefreshToken = jwt.sign({id: user._id}, process.env.REFRESHTOKEN_SECRET, {
                expiresIn: process.env.REFRESHTOKEN_EXPIRY,
            });

            user.refreshToken = newRefreshToken;
            await user.save();

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