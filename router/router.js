const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')
const Auth = require('../middleware/auth')

router.post('/register', userController.register)

router.post('/login',userController.login)

router.post('/logout',Auth.verifyToken,userController.logout)

router.post('/verify',Auth.verifyToken,userController.verify)

router.post('/otp',userController.otp)

router.post('/ubah',userController.ubah)

router.post('/hapus',userController.hapus)

router.post('/lupa',userController.lupa)

module.exports = router