const jwt = require('jsonwebtoken')
//const Auth = require('../middleware/auth')
require("dotenv").config()
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const otplib = require('otplib')
const { urlServices } = require('../services')
SECRET = process.env.SECRET

const register = async (req, res, next) => {
    const { username, email, password } = req.body
    try {
        const hash = await bcrypt.hash(password, 10)
        await urlServices.register(username, email, hash)
        res.status(200).send('Data has been updated')
    } catch (err) {
        if (err.code == "23505") {
            res.status(401).send(`username or email already taken, take another`)
        }
        else {
            res.status(401).send(`Invalid Input, require "username","email", "password","status">>'pembeli'`)
        }
    }
}

const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {        
        const user = await urlServices.login(email)
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
        return res.status(500).send(err)
    }
}

const verify = async (req, res, next) => {
    try {
        const { token } = req.body
        const verified = jwt.verify(token, SECRET)
        return res.status(200).json(verified)
    } catch (err) {
        return res.status(500).json({ error: err })
    }
}
const otp = async (req, res, next) => {
    const { email } = req.body
    if (email != undefined) {
        const lihat = await urlServices.otp1(email)
        if (lihat.rowCount != 0) {
            const secret = otplib.authenticator.generateSecret();

            const token = otplib.totp.generate(secret);
            await urlServices.otp2(email,secret,token)
            
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
        const data = await urlServices.ubah1(token)
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
                const user = await urlServices.ubah2(x,token,email)
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
        const data = await urlServices.hapus1(token)
        if (data.rows != '') {
            try {
                const email = data.rows[0].email
                await urlServices.hapus2(email,token)
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
            const data = await urlServices.lupa(token)
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

const getcategory = async (req, res, next) => {
    try {
        const lihat = await urlServices.getcategory()
        res.send(lihat.rows)
    } catch (err) {
        res.send(err)
    }
}
const getproduct = async (req, res, next) => {
    try{
        const {id} = req.body
        const product = await urlServices.getproduct(id)
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