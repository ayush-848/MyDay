const mongoose = require('mongoose');

const changelogSchema = new mongoose.Schema({
    versionNumber: {
        type: String,
        required: true
    },
    updatedOn: {
        type: Date,
        required: true
    },
    featureDetails: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Changelog', changelogSchema);
