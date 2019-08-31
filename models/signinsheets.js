const mongoose = require("mongoose");

module.exports = {

    /**
     * The schema for storing sign in sheets
     * 
     * @param name - A string which stores the sheet name
     * @param ownerUsername - A string which stores the name of the owner
     * @param uuid - A string which stores the unique id of the sheet
     */
    "users": mongoose.Schema(
        {
            "name": String,
            "ownerUsername": String,
            "uuid": String
        },
        {
            "timestamps": {"createdAt": "startTime", 
                "updatedAt": "updateTime"}
        }
    )

};