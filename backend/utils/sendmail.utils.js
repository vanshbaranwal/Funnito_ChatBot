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
        // const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`; // instead of the url i am sending an otp.

        // email content
        const mailOptions = {
            from: `"Funnito!" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify your email address – Your OTP code",
            text: [
                "Thank you for registering! Please verify your email address to complete your registration.",
                "",
                `Your verification code (OTP) is: ${token}`,
                "",
                "This code will expire in 10 minutes.",
                "If you did not create an account, please ignore this email."
            ].join('\n'),
            html: `
                <p>Thank you for signing up with Funnito! Please verify your email address to complete your registration.</p>
                <h2 style="color: rgb(248,62,62);">Your verification code (OTP): <b>${token}</b></h2>
                <p>This code will expire in 10 minutes.<br>If you did not create an account, please ignore this email.</p>
            `
        };


        // send email
        const info = await transporter.sendMail(mailOptions);
        // console.log("verification email sent : %s ", info.messageId);
        return true;
    } catch(error){
    //   console.error("error sending verification email: ", error);
      return false;   
    }
};


export default sendVerificationEmail;