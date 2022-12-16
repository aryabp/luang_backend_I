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
const otplib = require('otplib');

const register = async (req, res, next) => {
    const { username, email, password } = req.body
    try {
        const hash = await bcrypt.hash(password, 10)
        await db.query(`insert into users values (DEFAULT, $1, $2, $3,'pembeli')`, [email, username, hash])
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
                        userid: user[0].userid,
                        email: user[0].email,
                        username: user[0].username,
                        password: user[0].password,
                        status: user[0].status
                    }, process.env.SECRET)
                    res.cookie("JWT", token, { expire: new Date() + 9999, httpOnly: true, sameSite: "strict", secure: true }).status(200).json({
                        userid: user[0].userid,
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
const otp = async (req, res, next) => {

    const { email } = req.body
    if (email != undefined) {
        const lihat = await db.query(`SELECT * from users where email='${email}'`)
        if (lihat.rowCount != 0) {
            const secret = otplib.authenticator.generateSecret();

            const token = otplib.totp.generate(secret);

            await db.query(`DELETE FROM otp where email='${email}'`)
            await db.query(`INSERT INTO otp values('${email}','${secret}','${token}')`)

            let transporter = nodemailer.createTransport({
                host: process.env.SERVICE_SMTP,
                port: process.env.SERVICE_PORT,
                secure: false,
                auth: {
                    user: process.env.SERVICE_MAIL,
                    pass: process.env.SERVICE_PASS
                }
            });
            //luang.services@outlook.com
            //luang-no-reply@outlook.com
            // Define the email details
            let mailOptions = {
                from: `Luang services <${process.env.SERVICE_MAIL}>`,
                to: `<${email}>`,
                subject: 'Message from Luang',
                text: `Your token verification is ${token}`,
                html: `<h2>Your token verification is ${token}</h2>`
            };
            try {
                const info = await transporter.sendMail(mailOptions);
                res.send(`Token telah dikirim cek email anda maupun di spam`)
            } catch (err) {
                res.send(err)
            }
        } else {
            res.send('Email tidak ditemukan')
        }
    } else {
        res.send('masukkan input "email" terdaftar')
    }
}
const ubah = async (req, res, next) => {
    const { username, password, token } = req.body
    if (token != undefined && token != '') {
        const data = await db.query(`select email from otp where token='${token}'`)
        if (data.rows != '') {
            try {
                const email = data.rows[0].email
                let x = 'UPDATE users SET '
                let c = 0
                if (username != undefined && username != '') {
                    x += `username = '${username}' `
                    c = 1
                }
                if (password != undefined && password != '') {
                    if (c == 1) { x += ',' }
                    const hash = await bcrypt.hash(password, 10)
                    x += `password = '${hash}' `
                }
                x += `WHERE email='${email}'`
                await db.query(x)
                await db.query(`DELETE FROM otp where token='${token}'`)
                const user = await db.query(`SELECT * from users WHERE email = $1`, [email])
                const tokenJWT = jwt.sign({
                    userid: user.rows[0].userid,
                    email: user.rows[0].email,
                    username: user.rows[0].username,
                    password: user.rows[0].password,
                    status: user.rows[0].status
                }, process.env.SECRET)
                res.status(200).json({
                    userid: user.rows[0].userid,
                    email: user.rows[0].email,
                    username: user.rows[0].username,
                    token: tokenJWT
                })
            } catch (err) {
                res.send('masukkan "username" dan/atau "password" ')
            }
        } else {
            res.status(400).send('kode OTP tidak valid')
        }
    } else {
        res.send('belum mendapatkan "token" ? dapatkan di /otp')
    }
}
const hapus = async (req, res, next) => {
    const { token } = req.body
    if (token != undefined && token != '') {
        const data = await db.query(`select email from otp where token='${token}'`)
        if (data.rows != '') {
            try {
                const email = data.rows[0].email
                await db.query(`DELETE FROM users where email='${email}'`)
                await db.query(`DELETE FROM otp where token='${token}'`)
                res.send('data berhasil dihapus')
            } catch (err) {
                res.send(err)
            }
        } else {
            res.send('kode OTP tidak valid')
        }
    } else {
        res.send('belum mendapatkan "token" ? dapatkan di /otp')
    }
}

const lupa = async (req, res, next) => {
    const { token } = req.body
    if (token != undefined && token != '') {
        try {
            const data = await db.query(`select  * from users INNER JOIN  otp  ON users.email=otp.email where otp.token='${token}'`)
            const tokenJWT = jwt.sign({
                userid: data.rows[0].userid,
                email: data.rows[0].email,
                username: data.rows[0].username,
                password: data.rows[0].password,
                status: data.rows[0].status
            }, process.env.SECRET)
            res.status(200).json({
                userid: data.rows[0].userid,
                email: data.rows[0].email,
                username: data.rows[0].username,
                token: tokenJWT
            })
        } catch (err) {
            res.send('Error')
        }
    } else {
        res.send('belum mendapatkan "token" ? dapatkan di /otp')
    }
}

const getcategory = async (req,res,next) =>{
    try{
        const lihat = await db.query(`SELECT * from category`)
        res.send(lihat.rows)
    }catch(err){
        res.send(err)
    }
}

const getproduct = async (req,res,next) =>{
    try{
        const {id} = req.body
        let query = `SELECT * from ((product a INNER JOIN profile b ON a.profileid = b.profileid ) INNER JOIN category c ON a.categoryid = c.categoryid)`
        if (id != undefined && ''){
            query+= ` WHERE a.product = ${id}`
        }
        const product = await db.query(query)
        res.send(product.rows)
    }catch(err){
        res.send(err)
    }
}



module.exports = {
    register,
    login,
    logout,
    verify,
    otp,
    ubah,
    hapus,
    lupa,
    getcategory,
    getproduct
}