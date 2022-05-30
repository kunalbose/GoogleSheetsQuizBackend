const express = require('express');
const { google } = require("googleapis");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const Quiz = require("./models/Quiz");
const cors = require("cors");
const sheetScheduler = require("./sheetScheduler/sheetCronJob");
const PORT = process.env.PORT || 3800;

app.use(cors({ origin: true }));

mongoose 
 .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true  })   
 .then(() => console.log("Database connected!"))
 .catch(err => console.log(err));

function correctOptSearch(arr, l, r, x){
    for(let i = l; i <= r ; i++){
        if(arr[i] === x){
            return i;
        }
    }
}

sheetScheduler();

app.get("/", (req, res)=>{
    res.send("Hello from backend server");
})

app.get("/storeSheetData", async (req, res)=>{
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();

    const googleSheets = google.sheets({ version: "v4", auth: client });

    
    const spreadsheetId = "1Mjz9tF5Sz2Q3TRvdzloSlDVJNqNgkjSCKwla6QF_7Ps";

    const metaData = await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    });

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: `${metaData.data.sheets[0].properties.title}`,
    });

    for (let i = 1; i < getRows.data.values.length; i++){
        const quizArr = getRows.data.values[i];
        const correctOptionIndex = correctOptSearch(quizArr, 1, 4, quizArr[5]);
        const quizObj = new Quiz({
            question: quizArr[0],
            options:[
                {option: quizArr[1], isAns: correctOptionIndex === 1 ? true: false},
                {option: quizArr[2], isAns: correctOptionIndex === 2 ? true: false},
                {option: quizArr[3], isAns: correctOptionIndex === 3 ? true: false},
                {option: quizArr[4], isAns: correctOptionIndex === 4 ? true: false}
            ],
            explanation: quizArr[6]
        });
        await quizObj.save((err, docs)=>{
            if(err){
                console.log(err, "error creating quizObj");
            }else{
                // res.status(200).send(docs);
                console.log("success", docs);
            }
        })
    }

    res.send(getRows.data.values);
})

app.get("/user/fetchAllQuiz", async (req, res)=>{
    try{
        const quizzes = await Quiz.find().lean();
        if(!quizzes){
            return res.status(404).send("error while fetching quiz");
        }
        return res.status(200).json({result: quizzes});
    }catch(err){
        console.log(err,"error while fetching data catch block");
        return res.status(500).send("Some error occured at line 87 server.js");
    }
})


app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}...`);
});