const router = require('express').Router();
const db = require('../db/db');

/* GET home page. */
router.get('/', async(req, res) => {
 
    let dbStatus = false;
 
    try {
        const { rows } = await db.query("SELECT inet_server_addr() serverIp, inet_server_port() serverPort, inet_client_addr() clientIp , inet_client_port() clientPort");  
        if (rows.length > 0) {
            dbStatus = true;
        }
    }
    catch (e) {
        console.log(e);
    }
    res.render('index', { title: 'devServer' , dbstatus: dbStatus});
});

module.exports = router;