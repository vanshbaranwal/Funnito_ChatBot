// no need for this file as migated to supabase.




// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         trim: true,
//     },

//     email: {
//         type: String,
//         unique: true, 
//         lowercase: true,
//         required: true,
//     },

//     password: {
//         type: String,
//         required: true,
//         minlength: 4,
//     },

//     isverified: {
//         type: Boolean,
//         default: false,
//     },

//     role: {
//         type: String,
//         emun: ['user', 'admin'],
//         default: 'user',
//     },

//     verificationToken: String,
//     verificationTokenExpiry: Date,
//     refreshToken: String,

// },
//  { timestamps: true }
// );

// userSchema.pre("save", async function(next) {
//     if(this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10)
//         console.log("password hashed");
//         next();
//     }
// });

// userSchema.methods.comparePassword = async function(password) {
//     console.log("password match");
//     return await bcrypt.compare(password, this.password);    
// }

// const User = mongoose.model("User", userSchema);

// export default User;