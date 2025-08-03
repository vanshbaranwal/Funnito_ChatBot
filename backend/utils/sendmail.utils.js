import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
// create transport
// mailoptions
// send mail

// transport
const sendVerificationEmail = async (email, token) => {
    try{
        // create email transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === "true",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        // verification url
        const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;

        // email content
        const mailOptions = {
            from: `"Authentication app" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "please verify your email address",
            text: `thank you for registering! Please verify your email address to complete your registration.
            ${verificationUrl}
            This verification link will expire in 10 mins.
            If you did not create an account, please ignore this email.`,
        };

        // send email
        const info = await transporter.sendmail(mailOptions);
        console.log("verification email sent : %s ", info.messageid);
        return true;
    } catch(error){
      console.error("error sending verification email: ", error);
      return false;   
    }
};


export default sendVerificationEmail;