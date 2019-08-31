const mongoose = require("mongoose");

module.exports = {

    /**
     * The schema for storing users
     * 
     * @param username - A string which stores the user's name
     * @param email - A string which stores the user's email
     * @param password - A string which stores the hashed password of the user
     */
    "usersSchema": mongoose.Schema(
        {
            "username": String,
            "email": String,
            "password": String
        },
        {
            "timestamps": {"createdAt": "startTime", 
                "updatedAt": "updateTime"}
        }
    )

};