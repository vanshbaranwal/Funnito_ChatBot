import express, { urlencoded } from "express";
import cors from "cors";
import dotenv from "dotenv";
// import db from "./utils/db.js";
import { createClient } from "@supabase/supabase-js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import { timeStamp } from "console";


dotenv.config();

// initialize supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if(!supabaseUrl || !supabaseKey){
    console.error("missing supabase environment variables");
    process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = process.env.PORT || 4000;


app.use(express.json());
app.use(urlencoded({extended: true}));

app.use(cors({
    origin: [process.env.BASE_URL, "http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization' || "application/json"],
    credentials: true, // this is for cookie support
}));
app.use(cookieParser());


app.get("/", (req, res) =>{
    res.send("backend connected to Supabase!");
})

// test supabase connecttion through postman
app.get("/api/health", async (req, res) => {
    try {
        const {data, error} = await supabase
        .from('users')
        .select(`id`)
        .limit(1);


        if(error) throw error;
        
        const{count, error: countError} = await supabase
        .from("users")
        .select("*", {count : 'exact', head: true});

        res.json({
            status: 'connected',
            message: 'supabase connection successful!',
            tableAccess: 'users table accessible',
            totalUsers: countError ? 'unknown' : count || 0,
            timeStamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            status: "error", 
            message: error.message,
            timeStamp: new Date().toISOString()
        });
    }
})

app.use("/api/v1/users", userRoutes);

// db();

app.listen(port, () => {
    console.log(`server running on port ${port} with supabase.`);
})