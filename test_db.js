const pool = require("./src/db/index")
async function testConnection() {
    try {
        const res = await pool.query("SELECT NOW()")
        console.log("db connection at: ",res.rows[0])
    } catch (err) {
        console.error("db connection failed: ",err)
    }
}

testConnection()