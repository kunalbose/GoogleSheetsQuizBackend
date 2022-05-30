const cron = require("node-cron");
const Quiz = require("../models/Quiz");
const { google } = require("googleapis");


function correctOptSearch(arr, l, r, x){
    for(let i = l; i <= r ; i++){
        if(arr[i] === x){
            return i;
        }
    }
}

function sheetScheduler(){
    cron.schedule("0 0 * * * *", async()=>{
        console.log("running job every hour...");
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

        // console.log("here now", metaData);

        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: `${metaData.data.sheets[0].properties.title}`,
        });
        // console.log(getRows.data.values);
        let quizzes = [];
        try{
            quizzes = await Quiz.find().lean();
            if(!quizzes){
                console.log("cron job database error");
            }
        }catch(err){
            console.log(err, "Some error occuredd in cron fetching from database");
        }
        // console.log(quizzes);
        for(let i = 1; i < getRows.data.values.length; i++){
            const currentQuizData = getRows.data.values[i];
            let c = 0;
            for(let j = 0; j < quizzes.length; j++){
                if(currentQuizData[0] === quizzes[j].question){
                    c = c + 1;
                }
            }
            if(c === 0){
                // currentQuizData is not present in the database and is new
                const correctOptionIndex = correctOptSearch(currentQuizData, 1, 4, currentQuizData[5]);
                const currentQuizObj = new Quiz({
                            question: currentQuizData[0],
                            options:[
                                {option: currentQuizData[1], isAns: correctOptionIndex === 1 ? true: false},
                                {option: currentQuizData[2], isAns: correctOptionIndex === 2 ? true: false},
                                {option: currentQuizData[3], isAns: correctOptionIndex === 3 ? true: false},
                                {option: currentQuizData[4], isAns: correctOptionIndex === 4 ? true: false}
                            ],
                            explanation: currentQuizData[6]
                        });
                await currentQuizObj.save((err, docs)=>{
                    if(err){
                        console.log(err, "error creating quizObj");
                    }else{
                        // res.status(200).send(docs);
                        console.log("success", docs);
                    }   
                })
            }
        }
    })
}

module.exports = sheetScheduler;