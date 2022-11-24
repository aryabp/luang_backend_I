const express = require('express')
const db = require('../db.config/db.config')
const jwt = require('jsonwebtoken')
//const Auth = require('../middleware/auth')
//const cookieParser = require('cookie-parser')
require("dotenv").config()
const bcrypt = require('bcrypt')
SECRET = process.env.SECRET

const register = async (req,res,next) => {
    const {username,email,password} = req.body
    try{
        const hash = await bcrypt.hash(password)
        await db.query(`insert into unhan_modul_17 values (DEFAULT, $1, $2, $3)`,[username,email,hash])
        res.status(200).send('Data has been updated')
    }catch(err){
        res.status(401).send('Invalid Input, require "username","email" and "password"')
    }
}

const login = async (req,res,next) =>{
    const {email,password}=req.body;
    try{
        const data = await db.query(`SELECT * from unhan_modul_17 WHERE email = $1`,[email])
        const user = data.rows
        if(user.length == 0 ){
            res.status(400).json({
                error : "User is not registered, Sign Up first"
            })
        }else{
            bcrypt.compare(password, user[0].password,(err,result)=>{
                if(err){
                    res.status(500).json({
                        error:"Server error"
                    })
                }else if(result === true){
                    const token = jwt.sign({
                        id: user[0].id,
                        email: user[0].email,
                        username: user[0].username,
                        password: user[0].password
                    },process.env.SECRET)
                    res.cookie("JWT",token,{httpOnly: true, sameSite:"strict"}).status(200).json({
                        id: user[0].id,
                        email: user[0].email,
                        username: user[0].username
                    })
                }else{
                    if(result != true){
                        res.status(400).json({
                            error:"Enter correct password!"
                        })
                    }
                }
            })
        }
    }catch(err){
        console.log(err)
        res.status(500).json({
            error:"Database error occurred while signing in!"
        })
    }
}

const logout = async (req,res,next) => {
    try{
        return res.clearCookie('JWT').status(200).send('Logout Successfully')
    }catch (err){
        console.log(err.message)
        return res.status(500).send(err)
    }

}

const verify = async (req,res,next) =>{
    try{
        const{email}=req.body
        const data = await db.query(`SELECT * from unhan_modul_17 where email=$1`,[email])
        const user = data.rows
        return res.status(200).json({
            id:user[0].id,
            username:user[0].username,
            email:user[0].email,
            password:user[0].password
        })
    }catch (err){
        console.log(err.message)
        return res.status(500).json({error:err})
    }
}

module.exports = {
    register,
    login,
    logout,
    verify
}