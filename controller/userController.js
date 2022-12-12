const express = require('express')
const db = require('../db.config/db.config')
const jwt = require('jsonwebtoken')
//const Auth = require('../middleware/auth')
//const cookieParser = require('cookie-parser')
require("dotenv").config()
const bcrypt = require('bcrypt')
SECRET = process.env.SECRET
const axios = require('axios')
const nodemailer = require('nodemailer');

const register = async (req, res, next) => {
    const { username, email, password } = req.body
    try {
        const hash = await bcrypt.hash(password, 10)
        await db.query(`insert into users values (DEFAULT, $1, $2, $3,'pembeli')`, [username, email, hash])
        res.status(200).send('Data has been updated')
    } catch (err) {
        if (err.code == "23505") { res.status(401).send(`username or email already taken, take another`) } else {
            res.status(401).send(`Invalid Input, require "username","email", "password","status">>'pembeli'`)
        }

    }
}

const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const data = await db.query(`SELECT * from users WHERE email = $1`, [email])
        const user = data.rows
        if (user.length == 0) {
            res.status(400).json({
                error: "User is not registered, Sign Up first"
            })
        } else {
            bcrypt.compare(password, user[0].password, (err, result) => {
                if (err) {
                    res.status(500).json({
                        error: "Server error"
                    })
                } else if (result === true) {
                    const token = jwt.sign({
                        id: user[0].id,
                        email: user[0].email,
                        username: user[0].username,
                        password: user[0].password
                    }, process.env.SECRET)
                    res.cookie("JWT", token, { expire: new Date() + 9999, httpOnly: true, sameSite: "strict", secure: true }).status(200).json({
                        id: user[0].id,
                        email: user[0].email,
                        username: user[0].username,
                        token: token
                    })
                } else {
                    if (result != true) {
                        res.status(400).json({
                            error: "Enter correct password!"
                        })
                    }
                }
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: "Database error occurred while signing in!"
        })
    }
}

const logout = async (req, res, next) => {
    try {
        return res.clearCookie('JWT').status(200).send('Logout Successfully')
    } catch (err) {
        console.log(err.message)
        return res.status(500).send(err)
    }

}

const verify = async (req, res, next) => {
    try {
        const { token } = req.body
        const verified = jwt.verify(token, SECRET)
        return res.status(200).json(verified)

    } catch (err) {
        console.log(err.message)
        return res.status(500).json({ error: err })
    }
}
const bulk = async (req, res, next) => {

    let transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: true,
        auth: {
            user: 'luang-no-reply@outlook.com',
            pass: '!Luang123'
        }
    });

    // Define the email details
    let mailOptions = {
        from: 'luang-no-reply@outlook.com',
        to: 'aryabagasprox@gmail.com',
        subject: 'Test email using JavaScript',
        text: 'This is a test email sent using JavaScript.'
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
        res.send(info.response)

    } catch (err) {
        console.log(err)
        res.send(err)
    }
}
module.exports = {
    register,
    login,
    logout,
    verify,
    bulk
}