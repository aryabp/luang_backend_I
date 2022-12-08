//const fs = require('fs');
//const key = fs.readFileSync("./cert/CA/localhost/localhost.decrypted.key");
//const cert = fs.readFileSync("./cert/CA/localhost/localhost.crt");
//const https = require('https')
//Tambahan https localhost


const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const userRouter = require('./router/router')
const {Client} = require('pg')
const bcrypt = require('bcrypt')
const db = require('./db.config/db.config')
require('dotenv').config()

db.connect((err)=>{
    if(err){
        console.error(err)
        return
    }
    console.log('Database Connected')
})

app.use(express.json())
app.use(bodyParser.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended:true}))
app.use(cors({
    origin: [
      'http://localhost:3000',
      'https://modul-17-2-arya-bagaskara-pratama.vercel.app',
      'https://localhost:3000',
      'https://luang.vercel.app',
      'https://luang-orcin.vercel.app'
    ],
    credentials: true
}))


app.use('/',userRouter)

app.get('/',async(req,res)=>{
    try{
        res.status(200).send('Welcome Page')
    }catch (error){
        console.log(error)
    }
})
//const server = https.createServer({key,cert},app)

PORT = process.env.PORT || 8081
//server.listen(PORT, ()=>{console.log(`Application is running on ${PORT}`)})
app.listen(PORT, ()=>{console.log(`Application is running on ${PORT}`)})