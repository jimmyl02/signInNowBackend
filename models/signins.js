const mongoose = require("mongoose");

module.exports = {

    /**
     * The schema for storing sign ins
     * 
     * @param name - A string which stores the user's name
     * @param sheetUuid - A string which stores the unique id of the sheet the sign in belongs to
     */
    "signinsSchema": mongoose.Schema(
        {
            "name": String,
            "sheetUUID": String
        },
        {
            "timestamps": {"createdAt": "startTime", 
                "updatedAt": "updateTime"}
        }
    )

};