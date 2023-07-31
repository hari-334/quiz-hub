const express = require("express");
const ejs = require("ejs");
const https = require("https");
const bodyParser = require("body-parser");
const app = express();
const {runQuery} = require(__dirname + "/database.js");
const {encryptAndStore, decryptAndCompare} = require(__dirname + "/auth.js");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

let usersName, quizInfo, quiz, quizCode, quizNames, userAnswers, pastScores, score, newQuiz, usersInfo, quizzesInfo, errorMessage;
let username = null;
let numberOfQuestions = '0';

async function initSearch(){
    quizzesInfo = await runQuery(`SELECT quizcode, quizname FROM quizzes`);
    usersInfo = await runQuery(`SELECT username, name FROM users`);
}
initSearch();

function checkAnswers(userAnswers, quiz){
    var score = 0;
    for (var index = 0; index < quiz.length; index++){
            if (quiz[index].correct_answer == userAnswers[index]) {
                score++;
            }
    }
    return score;
}

let characters ='abcdefghijklmnopqrstuvwxyz';
function generateCode(length) {
    var charactersLength = characters.length;
    var result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


async function createQuiz(newQuiz){
    while (true){
        try{
            quizCode = generateCode(8);
            console.log("length: ", quizCode);
            await runQuery(`INSERT INTO quizzes VALUES('${quizCode}', '${quizName}', '${username}', '${Object.keys(newQuiz).length}')`);
            await runQuery(`CREATE TABLE ${quizCode} (question varchar(255), A varchar(255), B varchar(255), C varchar(255), D varchar(255), correct_answer varchar(255))`);
            break;
        }
        catch{

        }
    }
    for (var i = 1; i < Object.keys(newQuiz).length + 1; i++){
        console.log(newQuiz[i]);
        await runQuery(`INSERT INTO ${quizCode} VALUES('${newQuiz[i][0]}', '${newQuiz[i][1]}', '${newQuiz[i][2]}', '${newQuiz[i][3]}', '${newQuiz[i][4]}', '${newQuiz[i][5]}')`);
    }
}

app.get("/", (req, res) => {

    res.redirect("/auth");
})

app.get("/auth", (req, res) => {
    if (req.query.state == 'logout'){
        username = null;
    }
    if (username == null){
        if (req.query.state == 'signup'){
            res.render("auth_signup.ejs");
        } 
        else{
            res.render('auth_signin.ejs');
        }
    }
    else{
        res.redirect(`/user?username=${username}`)
    }
})

app.get("/search", (req, res) => {
    res.render("search.ejs", {usersInfo, quizzesInfo, username, usersName});
})

app.get("/user", async (req, res) => {
    if (username == null){
        res.redirect("/");
    }
    else{
        try{
            displayUsername = req.query.username;
            quizzes = await runQuery(`SELECT * FROM quizzes WHERE author = '${displayUsername}'`);
            console.log(req.body);
            displayUsersName = (await runQuery(`SELECT name FROM users WHERE username = '${displayUsername}'`))[0].name;
            res.render("profile.ejs", {quizzes, usersInfo, quizzesInfo, username, usersName, displayUsername, displayUsersName});
        }
        catch{
            res.redirect(`/`);
        }
    }
})

app.get("/quiz", async (req, res) => {
    if (username == null){
        res.redirect("/");
    }
    else{
        try{
            quizCode = req.query.quizCode;
            console.log(req.query);
            quizInfo = await runQuery(`SELECT * FROM quizzes WHERE quizcode = '${quizCode}'`);
            quiz = await runQuery(`SELECT * FROM ${quizCode}`);
            
            res.render("quiz.ejs", {quizInfo, quiz, usersInfo, quizzesInfo, username, usersName});
        }
        catch{
            res.redirect(`/`);
        }
    }

})

app.get("/scores", async (req, res) => {
    if (username == null){
        res.redirect("/");
    }
    else{
        console.log(username);
        pastScores = await runQuery(`SELECT * FROM ${username}_quizzes`);
        console.log(pastScores);
        quizInfo = await runQuery(`SELECT * FROM quizzes`);
    
        res.render("scores.ejs", {quizInfo, pastScores,usersInfo, quizzesInfo, username, usersName});
    }
})

app.get("/create", (req, res) => {
    if (username == null){
        res.redirect("/");
    }
    else{
    res.render("create.ejs", {quizzes, numberOfQuestions, usersInfo, quizzesInfo, username, usersName});
    }
})

app.post("/", (req, res) => {
    console.log(req.body);
})

app.post("/auth", async (req, res) => {
    console.log("/auth", req.body);
    if (JSON.stringify(req.body) === '{}'){
        res.redirect("/auth?state=signup")
    }
    else{
        if (await decryptAndCompare(req.body.username, req.body.password) == 'Success'){
            username = req.body.username;
            usersName = (await runQuery(`SELECT name FROM users WHERE username = '${username}'`))[0].name;
            res.redirect(`/user?username=${req.body.username}`);
        }
        else{
            errorMessage = 'Invalid username or password. Try again.';
            res.render("auth_error.ejs", {errorMessage});
        }
    }
})

app.post("/signup", async (req, res) => {
    console.log("/signup", req.body);
    if (req.body.password == req.body.repeat){
        if(await encryptAndStore(req.body.username, req.body.password, req.body.name) == 'Success'){
            username = req.body.username;
            usersName = req.body.name;
            await runQuery(`CREATE TABLE ${username}_quizzes (quizcode varchar(255) PRIMARY KEY, score varchar(255));`);
            res.redirect(`/user?username=${username}`);
        }
        else{
            errorMessage = 'Username already taken. Try again.';
            res.render("auth_error.ejs", {errorMessage});
        }
    }
    else{
        errorMessage = 'Passwords did not match. Try again.';
        res.render("auth_error.ejs", {errorMessage});
    }
})

app.post("/user", (req, res) => {
    console.log(req.body);
})

app.post("/quiz", async (req, res) => {
    userAnswers = (req.body);
    score = checkAnswers(userAnswers, quiz);

    try{
        await runQuery(`INSERT INTO ${username}_quizzes VALUES('${quizCode}', '${score}')`);
    } catch{
        await runQuery(`DELETE FROM ${username}_quizzes WHERE quizcode = '${quizCode}'`);
        await runQuery(`INSERT INTO ${username}_quizzes VALUES('${quizCode}', '${score}')`);
    }
    
    res.render("submitted.ejs", {quiz, quizInfo, userAnswers, score, usersInfo, quizzesInfo, username, usersName});//, correctAnswers, score});
})

app.post("/create", (req, res) => {
    console.log("/create");
    console.log(req.body);
    quizName = req.body.quizname;
    numberOfQuestions = req.body.numberofquestions;
    res.render("create2.ejs", {quizName, numberOfQuestions, usersInfo, quizzesInfo, username, usersName});
})

app.post("/created", (req, res) => {
    console.log("/created");
    console.log(req.body);
    newQuiz = req.body;
    createQuiz(newQuiz);
    setTimeout(initSearch, 300);
    console.log("/created", quizzesInfo);
    setTimeout(() => {return}, 300);
    res.redirect("/");
})

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started on PORT 3000");
})