const bcrypt = require("bcrypt");
const {runQuery} = require("./database.js");

// app.use(express.json())
// app.use(express.static("public"));

// app.get('/', async (req, res) => {
//     const users = await runQuery('select * from users');
//     res.sendFile(__dirname+"/src/index0.html");
// })

// app.post('/', async (req, res) => {
//   try {
//     const hashedPassword = await bcrypt.hash(req.body.password, 10)
//     await runQuery(`INSERT INTO users VALUES("${req.body.name}", "${hashedPassword}");`)
//   } 
//   catch {
//     alert("Invalid username or password");
//     console.error("Invalid username or password");
//   }
// })

async function encryptAndStore(username, password, name){
  
  try {
    var hashedPassword = await bcrypt.hash(password, 10)
    await runQuery(`INSERT INTO users VALUES("${username}", "${name}", "${hashedPassword}");`)
    return 'Success';
  } 
  catch {
    return 'Error';
  }
}

async function decryptAndCompare(username, password){
  var user = await runQuery(`SELECT * FROM users WHERE username = '${username}'`)
  // const user = users.find(user => user.name == username)
  if (user == null) {
    return 'Error';
  }
  try {
    if(await bcrypt.compare(password, user[0].password)) {
      return 'Success';
    } else {
      return 'Error';
    }
  } catch {
    return 'Error';
  }
}

module.exports = {
  encryptAndStore,
  decryptAndCompare
}

// app.post('/home', async (req, res) => {
//   const users = await runQuery('select * from users')
//   const user = users.find(user => user.name === req.body.name)
//   if (user == null) {
//     return res.status(400).send('Cannot find user')
//   }
//   try {
//     if(await bcrypt.compare(req.body.password, user.password)) {
//       res.send('Success')
//     } else {
//       res.send('Not Allowed')
//     }
//   } catch {
//     res.status(500).send()
//   }
// })

// app.listen(3000, () => console.log("Server started on port 3000"));