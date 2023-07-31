const {runQuery} = require(__dirname + "/database.js");

async function tablesInit(){
    await runQuery(`CREATE TABLE users (username varchar(255) PRIMARY KEY, name varchar(255), password varchar(255))`);
    await runQuery(`CREATE TABLE quizzes (quizcode varchar(255) PRIMARY KEY, quizname varchar(255), max_score varchar(255), author varchar(255))`);
}

tablesInit();

