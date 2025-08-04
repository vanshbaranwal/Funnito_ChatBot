import express, { urlencoded } from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./utils/db.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";


dotenv.config();


const app = express();
const port = process.env.PORT || 4000;


app.use(express.json());
app.use(urlencoded({extended: true}));

app.use(cors({
    origin: process.env.BASE_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());


app.get("/", (req, res) =>{
    res.send("hello world!");
})

app.use("/api/v1/users", userRoutes);

db();
app.listen(port, () => {
    console.log(`example app listening on port ${port}.`);
})