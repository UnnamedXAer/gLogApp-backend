var router = require('express').Router();
const db = require('../db/db');

router.get('/id/:id', async (req, res) => {
    try {
    const { rows } = await db.query('SELECT bpkey "id", bpname "name" FROM bodyparts where bpkey = $1 order by bpname desc', [req.params.id]);

        if (rows.length == 0) {
            res.status(204).send({
                data: null
            });
        } else {
            res.status(200).send({
                data: rows[0]
            });
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/details/id/:id', function (req, res, next) { // TODO: convert to try catch
    const thatRes = res;
    db.query('SELECT bpkey "id", bpname "name", bpdescription "description" FROM bodyparts where bpkey = $1 order by bpname desc', [req.params.id], (err, res) => {
        if (err) {
            res.status(500);
            return next(err);
        }
        if (res.rows.length == 0) {
            thatRes.status(204).send({
                data: null
            });
        } else {
            thatRes.status(200).send({
                data: rows[0]
            });
        }
    });
});

/* GET all bodyparts. */
router.get('/all', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT bpkey "id", bpname "name", bpdescription "description" FROM bodyparts order by bpname desc', []);
        
        if (rows.length == 0) {
            res.status(204).send({
                data: []
            });
        } else {
            res.status(200).send({
                data: rows
            });
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

module.exports = router;
