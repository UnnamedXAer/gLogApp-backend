var router = require('express').Router();
const { body, validationResult } = require('express-validator/check');
const db = require('../db/db');
// const format = require('pg-format');
const isCorrectDate = require('../utils/utils').isCorrectDate;


router.post('/', async (req, res, next) => { // todo - validation with express-validator?
    const startTime = req.body.startTime;
    if (!isCorrectDate(startTime)) { // todo send return new Date("2019-05-05T12:57") to get tz
        res.status(500);
        next(new Error("Not all fields were filled correctly."));
    }
    else {
        try {
            const { rows } = await db.query("INSERT INTO TRAINING (trUsKey, trStartTime) VALUES ($1, $2) returning trkey id, trstartTime \"startTime\"", [req.user.id, startTime]);
            res.status(201).send({data: {
                id: rows[0].id,
                startTime: rows[0].startTime.toUTCString()
            }});
        }
        catch (err) {
            res.status(500);
            next(err);
        }
    }
});

router.put('/', async (req, res, next) => { // used to complete / update training
    // todo Validation!
    const { startTime, endTime, comment, id } = req.body;
    try {
        const { rowCount } = await db.query(`UPDATE TRAINING set 
            trstarttime = $1, 
            trendtime = $2, 
            trcomment = $3 
            where trkey = $4 and truskey = $5 returning trkey id`, 
            [
                startTime,
                endTime,
                comment,
                id,
                req.user.id
            ]
        );

        if (rowCount == 0) {
            res.status(401);
            return next(new Error('Un-Authorized.'));
        }

        res.status(200).send({data: rowCount});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.post('/exercise', async (req, res, next) => { // start exercise
    try {
        const { rows } = await db.query(`INSERT INTO trainingexercise (tetrkey, teexkey, testarttime) select trkey, $1, $2 from training
        where  trkey = $3 and truskey = $4 returning tekey "id"`, 
            [req.body.exerciseId, req.body.startTime, req.body.trainingId, req.user.id]
        );

        if (rows.length == 0) {
            res.status(401);
            return next(new Error('Un-Authorized.'));
        }

        res.status(201).send({data: rows[0].id});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.put('/exercise', async (req, res, next) => { // used to update or complete exercise.

    try { // todo on change exercise
        const { rowCount } = await db.query(`UPDATE trainingexercise 
            set teexkey = $1, testarttime = $2, teendtime = $3, tecomment = $4
            from training 
            where tekey = $5 and trkey = $6 and truskey = $7
            returning tekey "id"`, 
            [req.body.exerciseId, req.body.startTime, req.body.endTime, req.body.comment, req.body.id, req.body.trainingId, req.user.id]
        );
        
        if (rowCount == 0) {
            res.status(401);
            return next(new Error('Un-Authorized.'));
        }

        res.status(201).send({data: rowCount});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.delete('/exercise/:id', async (req, res, next) => {
    db.tx(async client => {

        const { rows } = await client.query('SELECT truskey "userId" FROM Training JOIN trainingexercise ON trkey = tetrkey WHERE tekey = $1', [req.params.id]);

        if (rows[0].userId !== req.user.id) {
            res.status(401);
            throw new Error('Un-Authorized.');
        }

        const { rowCount } = await client.query('DELETE FROM trainingset WHERE settekey = $1', [req.params.id]);

        const results = await client.query('DELETE FROM trainingexercise WHERE tekey = $1 RETURNING tekey "id"', [req.params.id]);

        res.status(200).send({data: results.rows[0].id});
    })
    .catch(err => {
        next(err);
    });
});

router.get('/set', async (req, res, next) => {
    try {
        db.query(`select setKey id, settime time, setweight weight, setreps reps, setdrop drop, settempo tempo, setcomment comment from trainingset 
            join trainingexercise on tekey = settekey join training on trkey = tetrkey 
        where settekey = $1, `)
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.post('/set', [
        body("trainingId")
            .exists().withMessage("Could not relate set with training"),
        body("exerciseId")
            .exists().withMessage("Could not relate set with exercise"),
        body("weight")
            .isNumeric().withMessage("Wrong value")
            .custom(value => value <= 999.99).withMessage("Max weight is 999.999")
            .custom(value => (""+value).length <= 6).withMessage("Wrong value."),
        body("reps")
            .isNumeric().withMessage("Wrong value")
            .custom(value => value <= 999).withMessage("Max weight is 999")
            .custom(value => (""+value).length <= 3).withMessage("Wrong value."),
        body("time")
            .custom(value => isCorrectDate(value)).withMessage('Incorrect "set" time')
    ], async (req, res, next) => { // create new set

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(200).send({
            errors: errors.array()
        });
    }

    const params = [
        req.body.exerciseId,
        req.body.weight ? req.body.weight : 0,
        req.body.reps,
        req.body.time,
        req.body.drop,
        req.body.tempo,
        req.body.comment,
        req.body.trainingId,
        req.user.id
    ];

        console.log(params);
    try {
        const { rows } = await db.query(
            `INSERT INTO trainingset (settekey, setweight, setreps, settime, setdrop, settempo, setcomment) 
            select $1, $2, $3, $4, $5, $6, $7 
            from trainingexercise  
            join training on trkey = tetrkey 
            where trkey = $8 and truskey = $9 and tekey = $1
            returning setkey "id"`,
            params
        );

        if (rows.length == 0) {
            res.status(401);
            return next(new Error('Un-Authorized.'));
        }

        res.status(201).send({data: rows[0].id});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.put('/set', async (req, res, next) => { // update set
    const params = [
        // req.params.exerciseId,
        req.body.weight,
        req.body.reps,
        req.body.time,
        req.body.drop,
        req.body.tempo,
        req.body.comment
    ]
    try {
        const { rowCount } = await db.query(`UPDATE trainingset set  
        setweigth = $1, 
        setreps = $2, 
        settime = $3, 
        setdrop = $4, 
        settempo = $5, 
        setcomment = $6`, params); //todo user.id condition

        res.status(rowCount > 0 ? 200 : 204).send({data: rowCount});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.delete('/set/:id', async (req, res, next) => {

    try {
        const results = await db.query('delete from trainingset where setkey = $1', [req.params.id]); // todo add condition with req.user.id
        console.log(results);
        res.status(results.rowCount > 0 ? 200 : 204).send({data: results.rowCount});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/details/id/:id', async(req, res, next) => {

    try {
        const { rows } = await db.query('SELECT trkey id, trstarttime "startTime", trendtime "endTime", truskey "userId", trcomment "comment" FROM training WHERE trkey = $1', [req.params.id]); // todo add condition truskey = req.user.id
        if (rows.length == 0) { 

            res.status(204).send({data: null});
        }
        else {
            res.status(200).send({data: rows[0]});
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/not-completed', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT trkey id, trstarttime "startTime" from training where truskey = $1 and trendTime is null', [req.user.id]);

        if (rows.length == 0) {
            res.status(204).send({data: null});
        }
        else {
            res.send({data: rows});
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/:id/exercises/', async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT 
            tekey "id", 
            testarttime "startTime", 
            teendtime "endTime", 
            tecomment "comment", 
            teexkey "exerciseId", 
            exname "name", 
            exsetsUnit "setsUnit"
            FROM trainingexercise JOIN exercise ON teexkey = exkey 
            WHERE tetrKey = $1 ORDER BY testarttime`, [req.params.id]);

        if (rows.length == 0) {
            return res.status(204).send({data: null});
        }

        let exercises = rows.map(x => ({
            id: x.id,
            startTime: x.startTime,
            endTime: x.endTime,
            comment: x.comment,
            exercise: {
                id: x.exerciseId,
                name: x.name,
                setsUnit: x.setsUnit
            },
            sets: []
        }));
        for (let i = exercises.length-1; i >= 0; i--) {
            const { rows } = await db.query('SELECT setkey "id", settime "time", setweight "weight", setreps "reps", setdrop "drop", settempo "tempo", setcomment "comment" from trainingset where settekey = $1 ORDER BY settime', [exercises[i].id]);

            exercises[i].sets = rows.map(x => { // convert n.00 => n 
                x.weight = Number(x.weight);
                x.reps = Number(x.reps);
                return x;
            });
            exercises[i].sets = rows;
        }

        res.status(200).send({data: exercises});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/x', async (req, res, next) => {
    
            res.send({x: new Date("2019-04-29T12:57")});

});

module.exports = router;
