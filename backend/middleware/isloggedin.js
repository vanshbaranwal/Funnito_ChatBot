const isLoggedIn = async (req, res, next) => {
    try {
        // get token form cookie
        const token = req.cookies.jwtToken;

        if(!token){
            return res.status(400).json({
                success: false,
                message: "token invalid"
            });
        }

        // verify if token valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
};

export default isLoggedIn;