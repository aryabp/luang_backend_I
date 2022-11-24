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
app.use(cors())


app.use('/',userRouter)

app.get('/',async(req,res)=>{
    try{
        res.send('Welcome Page')
    }catch (error){
        console.log(error)
    }
})


PORT = process.env.PORT || 1004
app.listen(PORT, ()=>{console.log(`Application is running on ${PORT}`)})