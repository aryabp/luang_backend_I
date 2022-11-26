const { Client } = require('pg')
require('dotenv').config()

const{
    DB_HOST_DEV,
    DB_USER_DEV,
    DB_PASS_DEV,
    DB_NAME_DEV,
    DB_PORT_DEV
} = process.env

const db = new Client({
    host: DB_HOST_DEV,
    user: DB_USER_DEV,
    password: DB_PASS_DEV,
    database: DB_NAME_DEV,
    port: DB_PORT_DEV,
    ssl: {
        rejectUnauthorized: false
      }
})

module.exports = db