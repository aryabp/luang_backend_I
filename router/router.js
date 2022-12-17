const express = require('express')
const router = express.Router()
const userController = require('../controller/userController')
const Auth = require('../middleware/auth')
const {urlValidation} = require('../validator')

router.post('/register',urlValidation.cekemailvalid,userController.register)

router.post('/login',userController.login)

router.post('/logout',Auth.verifyToken,userController.logout)

router.post('/verify',Auth.verifyToken,userController.verify)

router.post('/otp',userController.otp)

router.post('/ubah',userController.ubah)

router.post('/hapus',userController.hapus)

router.post('/lupa',userController.lupa)

router.get('/getcategory',userController.getcategory)

router.get('/getproduct',userController.getproduct)

router.post('/insertpesan',userController.insertpesan)

router.post('/getpesan',userController.getpesan)
module.exports = router