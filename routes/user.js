const router = require('express').Router();
const db = require('../db/db');


router.get('/me/:id', async(req, res, next) => {
    if (req.user.id != parseInt(req.params.id, 10)) {
        res.status(401);
        return next(new Error('Un-Authorized'));
    }

    try {
        const { rows } = await db.query("SELECT uskey, uslogin, usemail, to_char(uscreatedon, 'MM/DD/YYYY') uscreatedon, to_char(usdob, 'MM/DD/YYYY') usdob from AppUser WHERE usKey = $1", [req.params.id]);

        if (rows.length === 0) {
            res.status(204).json({errors: null, user: null});
        }
        else {
            const row = rows[0];
            const user = { 
                id: row.uskey,
                login: row.uslogin,
                email: row.usemail,
                createdOn: row.uscreatedon,
                dob: row.usdob
            }
            res.status(200).json({errors: null, user});
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/id/:id', async(req, res) => {

    try {
        const { rows } = await db.query("SELECT uskey, uslogin, usemail, to_char(uscreatedon, 'MM/DD/YYYY') uscreatedon, to_char(usdob, 'MM/DD/YYYY') usdob from AppUser WHERE usKey = $1", [req.params.id]);

        if (rows.length === 0) {
            res.status(204).json({errors: null, user: null});
        }
        else {
            const row = rows[0];
            const user = { 
                id: row.uskey,
                login: row.uslogin,
                email: row.usemail,
                createdOn: row.uscreatedon,
                dob: row.usdob
            }
            res.status(200).json({errors: null, user});
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/all', async(req, res) => {

    try {
        const { rows } = await db.query('SELECT */*uskey id, uslogin login, usemail email, uscreatedon "createdOn", usdob "dob"*/ from AppUser order by uscreatedon desc', []);

        if (rows.length === 0) {
            res.status(204).json({errors: null, data: []});
        }
        else {

            res.status(200).json({errors: null, data: rows});
        }
    }
    catch (e) {
        res.status(500).send('Internal server error.');
    }
});

router.get('/', async(req, res) => {
    res.status(400).send('Wrong request path');
});


module.exports = router;