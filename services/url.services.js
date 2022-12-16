const db = require('../db.config/db.config')

const register = async (username, email, hash) => {
    await db.query(`insert into users values (DEFAULT, $1, $2, $3,'pembeli')`, [email, username, hash])
}
const login = async (email) => {
    const data = await db.query(`SELECT * from users WHERE email = $1`, [email])
    return data.rows
}
const otp1 = async (email) => {
    return db.query(`SELECT * from users where email='${email}'`)
}
const otp2 = async (email, secret, token) => {
    await db.query(`DELETE FROM otp where email='${email}'`)
    await db.query(`INSERT INTO otp values('${email}','${secret}','${token}')`)
}
const ubah1 = async (token) => {
    return db.query(`select email from otp where token='${token}'`)
}
const ubah2 = async (x, token, email) => {
    await db.query(x)
    await db.query(`DELETE FROM otp where token='${token}'`)
    return await db.query(`SELECT * from users WHERE email = $1`, [email])
}
const hapus1 = async (token) => {
    return await db.query(`select email from otp where token='${token}'`)
}
const hapus2 = async (email, token) => {
    await db.query(`DELETE FROM users where email='${email}'`)
    await db.query(`DELETE FROM otp where token='${token}'`)
}
const lupa = async (token) => {
    return await db.query(`select  * from users INNER JOIN  otp  ON users.email=otp.email where otp.token='${token}'`)
}
const getcategory = async () => {
    const x = await db.query(`SELECT * from category`)
    return x
}
const getproduct = async (id) => {
    let query = `SELECT * from ((product a INNER JOIN profile b ON a.profileid = b.profileid ) INNER JOIN category c ON a.categoryid = c.categoryid)`
    if (id != undefined && id != '') {
        query += ` WHERE a.productid = ${id}`
    }
    const product = await db.query(query)
    return product
}
module.exports = {
    register,
    login,
    otp1,
    otp2,
    ubah1,
    ubah2,
    hapus1,
    hapus2,
    lupa,
    getcategory,
    getproduct
}