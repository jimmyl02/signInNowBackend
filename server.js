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
const randomstring = require("randomstring");
const uuidv4 = require("uuid/v4");

//Load schemas and modules
const usersModule = require("./models/users.js");
const usersSchema = usersModule.usersSchema;
const signinsModule = require("./models/signins.js");
const signinsSchema = signinsModule.signinsSchema;
const signinsheetsModule = require("./models/signinsheets.js");
const signinsheetsSchema = signinsheetsModule.signinsheetsSchema;

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
const signins = mongoose.model("signins", signinsSchema);
const signinsheets = mongoose.model("signinsheets", signinsheetsSchema);

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
                    return res.status(405).send({"error": "User with same name already exists"});
                }else{
                    //Create the new user
                    users.create({"username": body.username,
                        "email": body.email,
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
    }else{
        return res.status(400).send("Incorrrect parameters");
    }
});

/**
 * Route to login to an account
 * 
 * @param username - The username of the user
 * @param password - The password to assign the user
 */
app.post("/api/login", (req, res) => {
    const body = req.body;
    if(body.hasOwnProperty("username") && body.hasOwnProperty("password")){
        users.findOne({"username": body.username}, (err, doc) => {
            if(err) return res.status(500).send("Internal server error");
            if(!doc) return res.status(404).send("Username was not found");

            const passwordIsValid = bcrypt.compareSync(body.password, doc.password);
            if(!passwordIsValid) return res.status(401).send({"auth": false,
                "token": null});

            const token = jwt.sign({"id": body.username}, process.env.JWT_SECRET, {
                "expiresIn": 86400
            });

            return res.status(200).send({"auth": true,
                "token": token});
        });
    }else{
        return res.status(400).send("Incorrrect parameters");
    }
});

/**
 * Route to add to sign in sheet
 *
 * @param sheetid - The ID of the sign in sheet
 * @param name - The name of the student
 */
 
app.post("/api/signin", (req, res) => {
    const body = req.body;
    if(body.hasOwnProperty("sheetid") && body.hasOwnProperty("name")){
        signinsheets.findOne(
            {"sheetID": body.sheetid},
            (err, doc) => {
                if(err) return res.status(500).send("Internal server error");
                if(!doc) return res.status(404).send("SheetID was not found");

                signins.create(
                    {"name": body.name,
                        "sheetUUID": doc.UUID}, 
                    (errCreate, docCreate) => {
                        if(err) return res.status(500).send({"error": errCreate});

                        return res.status(200).send({"signedin": true});
                    }
                );

            }
        );
    }
});

/**
 * Route to add to sign in sheet
 *
 * @param sheetname - The name of the new sheet
 * @param jwt - The JWT of the person attempting to accewss data
 */

app.post("/api/createsheet", (req, res) => {
    const body = req.body;
    if(body.hasOwnProperty("sheetname") && body.hasOwnProperty("jwt")){
        jwt.verify(body.jwt, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return res.status(500).send("Failed to authenticate");
 
            //User has been authorized
            const randomUUID = uuidv4();
            const randomID = randomstring.generate(7);
            signinsheets.create(
                {"name": body.sheetname,
                    "ownerUsername": decoded.id,
                    "UUID": randomUUID,
                    "sheetID": randomID},
                (errCreator, doc) => {
                    if(err) return res.status(500).send({"error": errCreator});

                    return res.status(200).send({"sheetid": randomID});
                }
            );
        });
    }else{
        return res.status(400).send("Incorrrect parameters");
    }
});

/**
 * Route to add to sign in sheet
 *
 * @param sheetuuid - The uuid of the sheet (given only to the owner)
 * @param jwt - The JWT of the person attempting to accewss data
 */

app.post("/api/getsignins", (req, res) => {
    const body = req.body;
    if(body.hasOwnProperty("sheetuuid") && body.hasOwnProperty("jwt")){
        jwt.verify(body.jwt, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return res.status(500).send("Failed to authenticate");
 
            signinsheets.find(
                {"ownerUsername": decoded.id,
                    "UUID": body.sheetuuid},
                (errFind, docs) => {
                    if(errFind) return res.status(405).send({"error": err});
                    if(docs.length > 0){
                        //There exists a signinsheet with given UUID and Owner (from JWT)
                        signins.find(
                            {"sheetUUID": body.sheetuuid},
                            (errFindSignins, docsSignins) => {
                                if(errFindSignins) return res.status(405).send({"error": err});
            
                                return res.status(200).send(docsSignins);
             
                            }
                        );
                    }
                }
            );
        });
    }else{
        return res.status(400).send("Incorrrect parameters");
    }
});

/**
 * Route to get sign in sheets owned by jwt
 *
 * @param jwt - The JWT of the person attempting to accewss data
 */
app.post("/api/getsheets", (req, res) => {
    const body = req.body;
    if(body.hasOwnProperty("jwt")){
        jwt.verify(body.jwt, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return res.status(500).send("Failed to authenticate");
 
            signinsheets.find(
                {"ownerUsername": decoded.id},
                (errFind, docs) => {
                    if(errFind) return res.status(405).send({"error": err});
                    
                    return res.status(200).send(docs);
                }
            );
        });
    }else{
        return res.status(400).send("Incorrrect parameters");
    }
});

/**
 * Route to update the sheetid of a sheetuuid
 *
 * @param sheetuuid - The uuid of the sheet (given only to the owner)
 * @param jwt - The JWT of the person attempting to accewss data
 */
app.post("/api/updatecode", (req, res) => {
    const body = req.body;
    if(body.hasOwnProperty("sheetuuid") && body.hasOwnProperty("jwt")){
        jwt.verify(body.jwt, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return res.status(500).send("Failed to authenticate");
 
            const randomID = randomstring.generate(7);

            signinsheets.findOneAndUpdate(
                {"ownerUsername": decoded.id,
                    "UUID": body.sheetuuid},
                {"sheetID": randomID},
                {"upsert": false},
                (errFind, doc) => {
                    if(errFind) return res.status(405).send({"error": err});
                    
                    if(doc){
                        return res.status(200).send({"updatedCode": randomID});
                    }else{
                        return res.status(404).send("Sheet was not found");
                    }
                }
            );
        });
    }else{
        return res.status(400).send("Incorrrect parameters");
    }
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log("Example app listening on port " + port + "!");
});