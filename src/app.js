const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

app.use("/tenants", async (req, res)=>{
    try {
        const result = await pool.query("SELECT * FROM tenants")
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ error : "db error"})
    }
})

module.exports = app;