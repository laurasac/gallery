const { Pool } = require('pg')
const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password : process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
})

;(async () => {
    try {
        for(const table of ["Images", "Albums", "Artists"] ){
            await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`)
            console.log(`Drop table ${table}`)
        }

        pool.end()
        
    } catch (error) {
        console.log(error)
    }
})()