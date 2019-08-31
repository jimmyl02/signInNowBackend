const mongoose = require("mongoose");

module.exports = {

    /**
     * The schema for storing sign in sheets
     * 
     * @param name - A string which stores the sheet name
     * @param ownerUsername - A string which stores the name of the owner
     * @param uuid - A string which stores the unique id of the sheet
     * @param sheetID - A string which stores the public sheet ID of a schema
     */
    "signinsheetsSchema": mongoose.Schema(
        {
            "name": String,
            "ownerUsername": String,
            "UUID": String,
            "sheetID": String
        },
        {
            "timestamps": {"createdAt": "startTime", 
                "updatedAt": "updateTime"}
        }
    )

};