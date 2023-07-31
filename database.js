const mysql2 = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql2.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

// let result = await pool.query("USE test");
// result = await pool.query("CREATE TABLE users (username varchar(255), password varchar(255))");
async function runQuery(query){
    var result = await pool.query(query);
    return result[0];
}

module.exports = {
    runQuery
}