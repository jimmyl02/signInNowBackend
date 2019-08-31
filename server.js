/**
 * SignInNow Backend Server
 * A server to handle requests to concerning signups
 * 
 * @author Jimmy Li
 * @version 1.0
 */

//Imports
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const uuidv4 = require("uuid/v4");

//Load schemas and modules
const usersModule = require("./models/users.js");
const usersSchema = usersModule.usersSchema;
const signinsModule = require("./models/users.js");
const signinsSchema = signinsModule.signinsModule;
const signinsheetsModule = require("./models/users.js");
const signinsheetsSchema = signinsheetsModule.signinsheetsModule;

//Load definitions
dotenv.config();

const app = express();
app.use(bodyParser.json());

/**
 * Middleware to enable CORS
 */
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, X-Requested-With");
    next();
});

/**
 * Connect to mongoDB
 */
mongoose.connect("mongodb://localhost:27017/signinnow");
const mongooseCon = mongoose.connection;
mongooseCon.on("error", console.error);
mongooseCon.once("open", () => {
    console.log("Connected to mongod server");
});

/**
 * Define mongo collections
 */
const users = mongoose.model("users", usersSchema);
const signins = mongoose.model("users", signinsSchema);
const signinsheets = mongoose.model("users", signinsheetsSchema);

//Routes
/**
 * Route to create an account
 * 
 * @param username - The username of the user
 * @param email - The email of the user
 * @param password - The password to assign the user
 */
app.post("/api/register", (req, res) => {
    const body = req.body;
    if(body.hasOwnProperty("username") && body.hasOwnProperty("email") && body.hasOwnProperty("password")){
        const hashedPassword = bcrypt.hashSync(body.password, 8);
        users.find(
            {"username": body.username},
            (err, docs) => {
                if(err) return res.status(500).send({"error": err});
                if(docs.length){
                    return res.status(405).send({"error": "Report with same name already exists"});
                }else{
                    //Create the new user
                    users.create({"username": body.username,
                        "email": body.password,
                        "password": hashedPassword}, (errCreate, doc) => {
                        if(err) return res.status(500).send({"error": errCreate});
                            
                        const token = jwt.sign({"id": body.username}, process.env.JWT_SECRET, {
                            "expiresIn": 86400
                        });

                        return res.status(200).send({"auth": true,
                            "token": token});
                    });
                }
            }
        );
    }
});