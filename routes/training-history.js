var router = require('express').Router();
const db = require('../db/db');



router.get('/details/id/:id', async (req, res) => {

    try {
        const { rows } = await db.query("SELECT trkey id, trstarttime startTime, trendtime endTime,  from training WHERE trKey = $1", [req.params.id]);
        if(rows.length > 0) {

            const row = rows[0];
            res.status(200).send(row);
        }
        else {
            res.status(500).send('Search for training failed.')
        }
    }
    catch (e) {

    }
});


router.delete('/:id', async (req, res, next) => {

    setTimeout(() => { db.tx(async client => {
        const { rows } = await client.query('SELECT truskey "userId" FROM Training WHERE trkey = $1', [req.params.id]);
        if (rows[0].userId !== req.user.id) {
            res.status(401);
            throw new Error('Un-Authorized.');
        }

        await client.query(`DELETE FROM trainingSet USING trainingExercise WHERE setTeKey = teKey and tetrkey = $1`, [req.params.id]);
        await client.query('DELETE FROM trainingexercise WHERE tetrkey = $1', [req.params.id]);
        const results = await client.query('DELETE FROM training WHERE trkey = $1 RETURNING trkey "id"', [req.params.id]);


        res.status(200).send({data: results.rows[0].id});
    })
    .catch (err => {
        res.status(500);
        next(err);
    });}, 2000);
});

router.get('/', async (req, res, next) => {

    try {
        const { rows } = await db.query(`SELECT 
            trkey id, 
            trstarttime "startTime", 
            trendtime "endTime", 
            trComment "comment",
            (select count(tekey) from trainingexercise where tetrkey = trkey) as "exercisesCnt"
            from training WHERE trusKey = $1
            order by trstarttime desc`, [req.user.id]); // use join and group by trkey to try improve performance

        res.status(rows.length > 0 ? 200 : 204).send({data: rows});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/:id/exercises/', async (req, res, next) => {

    try { //todo check if userId match training exercise id
        const { rows } = await db.query(`SELECT 
            tekey "id",
            testarttime "startTime",
            teendtime "endTime",
            tecomment "comment",
            exname "name",
            exkey "exerciseId",
            /* case exsetunit when 1 then 'Kg' when 2 then 's' end "setUnit" */
            exsetsunit "setsUnit"
            FROM trainingexercise
            JOIN exercise on teexkey = exkey
            WHERE tetrkey = $1
            ORDER BY testarttime asc
        `, [req.params.id]); // use join and group by trkey to try improve performance

        const rowsLen = rows.length;
        if (rowsLen > 0) {
            for (let i = 0; i < rowsLen; i++) {
                rows[i].sets = (await db.query(`
                    SELECT
                    setkey "id",
                    settime "time",
                    setweight "weight",
                    setreps "reps",
                    setdrop "drop",
                    settempo "tempo",
                    setcomment "comment"
                    FROM trainingset 
                    WHERE settekey = $1 order by settime asc`, [rows[i].id])).rows;      
            }

            res.status(200).send({data: rows});
        } 
        else {
            res.status(204).send();
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

// // get data for given exercise for current user in date range
// router.get('/exercise-hist/:id', async (req, res, next) => {

//     try {
//         const { rows } = await db.query(`SELECT 
//             tekey "id",
//             testarttime "startTime",
//             teendtime "endTime",
//             /* case exsetunit when 1 then 'Kg' when 2 then 's' end "setUnit" */
//             exsetsunit "setsUnit"
//             FROM trainingexercise
//             JOIN exercise on teexkey = exkey
//             JOIN training on tetrkey = trkey
//             WHERE truskey = $1
//                 and exkey = $2
//                 and testarttime between $3, $4
//             ORDER BY testarttime ASC
//         `, [req.params.id, req.params.id, req.query.from, req.query.to]);

//         const rowsLen = rows.length;
//         if (rowsLen > 0) {
//             for (let i = 0; i < rowsLen; i++) {
//                 rows[i].sets = (await db.query(`
//                     SELECT
//                     setkey "id",
//                     settime "time",
//                     setweight "weight",
//                     setreps "reps",
//                     --setdrop "drop",
//                     --settempo "tempo",
//                     --setcomment "comment"
//                     FROM trainingset 
//                     WHERE settekey = $1 ORDER BY settime ASC`, [rows[i].id])).rows;      
//             }

//             res.status(200).send({data: rows});
//         } 
//         else {
//             res.status(204).send();
//         }
//     }
//     catch (err) {
//         res.status(500);
//         next(err);
//     }
// });

module.exports = router;