import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        unique: true, 
        lowercase: true,
        required: true,
    },

    password: {
        type: String,
        required: true,
        minlength: 4,
    },

    isverified: {
        type: Boolean,
        default: false,
    },

    role: {
        type: String,
        emun: ['user', 'admin'],
        default: 'user',
    },

    verificationToken: String,
    verificationTokenExpiry: Date,
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;