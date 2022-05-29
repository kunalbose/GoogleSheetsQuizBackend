const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema({
    question:{
        type: String,
        required: true,
    },
    options: {
        type: [
            {
                option: { type: String, required: true },
                isAns: { type: Boolean, required: true }
            }
        ],
        required: true
    },
    explanation: {
        type: String,
        required: true
    }
}, {timestamps: true});

module.exports = mongoose.model('quiz', QuizSchema);