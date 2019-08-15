const router = require('express').Router();
const randomstring = require('randomstring');
const fs = require('fs-extra');
const path = require('path');
const { body, validationResult } = require('express-validator/check');
const multer = require('multer');
const format = require('pg-format');

const { isExercise } = require('../utils/utils');
const db = require('../db/db');
  
var upload = multer({
    limits: { 
        fileSize: 50 * 1024 * 1024,  // x MB upload limit
        files: 1                    // 1 file
    },
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            //let login = req.body.login;
            let _path = `./images/temp_exercisePhoto/`;
            fs.ensureDirSync(_path);
            cb(null, _path);
        },
        filename: (req, file, cb) => {
            let fileExtension;
            switch (file.mimetype) {
                case 'image/png':
                    fileExtension = '.png';
                    break;
                case 'image/jpeg':
                    fileExtension = '.jpg';
                    break;
                case "image/gif":
                    fileExtension = '.gif';
                    break;
                default:
                    cb(new Error('Wrong file extension.'));
                    return;
                    break;
            }
            
            cb(null, Date.now() + "_" + randomstring.generate(5) + fileExtension);
            console.log('uploaded');
        }
    })
});

router.post('/new', [
        upload.single('file'),
        body('name')
            .trim()
            .escape()
            .exists().withMessage('Name is required.')
            .isLength({min: 2, max: 50}).withMessage('Exercise name must be 2+ chars long.')
            .custom(async value => !(await isExercise(value))).withMessage('Exercise already exists.')
            .custom(value => new RegExp(/^[A-Z0-9\s+]*$/i).test(value)).withMessage('The name may only contain letters, numbers and spaces.'),
        body('description')
            .escape()
            .exists().withMessage('Description is required.')
            .not().isEmpty().withMessage('Description is required.')
            .isLength({max: 500}),
        body('ytUrl')
            .optional({checkFalsy: true}).isURL(),
        body('setUnit')
            .custom(value => (value == "1" || value == "2")).withMessage('Wrong value in "Sets Unit".'),
        body('engagedParties')
            .custom(value => JSON.parse(value).findIndex(x => parseInt(x, 10) != x) == -1).withMessage('Wrong values in "Engaged Parties"'),
        body('accessory4Exercise')
            .custom(value => JSON.parse(value).findIndex(x => parseInt(x, 10) != x) == -1).withMessage('Wrong values in "Accessories for this exercise"'),
        body('exerciseIsAccessoryForExercises')
            .custom(value => JSON.parse(value).findIndex(x => parseInt(x, 10) != x) == -1).withMessage('Wrong values in "This exercise is accessory for:"'),
    ], 
    async (req, res, next) => {
        // const userId = req.user.id;
        // console.log(req.body);
        const errors = validationResult(req);
        let errorsArray = errors.array();
        const file = req.file;
        if (file && file.size > 2 * 1024 * 1024) { // check file size
            errorsArray.push({
                location: "req",
                msg: "File size limit is 2MB.",
                param: "file",
                value: null
            })
        }
        console.log(errorsArray);
        
        if (errorsArray.length > 0) {
            res.status(200).json({errors: errorsArray, data: null});
        }
        else {
            const { name, description, engagedParties, accessory4Exercise, exerciseIsAccessoryForExercises, ytUrl, setUnit } = req.body;
            const filename = file ? file.filename : null;
        // Insertion
            db.tx(async (client) => {
                // try {
                    const { rows } = await client.query({
                        text: "INSERT INTO exercise (exname, exdescription, eximgname, exyturl, exsetsUnit, excreatedby) VALUES ($1, $2, $3, $4, $5, $6) returning exkey", 
                        values: [
                            name,
                            description,
                            filename,
                            ytUrl,
                            setUnit,
                            req.user.id
                        ]
                    });
                    const insertedExerciseId = rows[0].exkey;

                    let engagedPartiesValues = [];
                    eval(engagedParties).forEach(x => {
                        engagedPartiesValues.push([insertedExerciseId, x]);
                    });

                    // engaged parties
                    if (engagedPartiesValues.length > 0) {
                        await client.query(
                            format("INSERT INTO bodypartsengaged (bpeexkey, bpebpkey) VALUES %L", engagedPartiesValues)
                        );
                    }

                    // accessory for this exercise.
                    let accessory4ExerciseValues = [];
                    eval(accessory4Exercise).forEach(x => { 
                        accessory4ExerciseValues.push([insertedExerciseId, x]);
                    });

                    // this exercise is accessory for..
                    eval(exerciseIsAccessoryForExercises).forEach(x => {
                        accessory4ExerciseValues.push([x, insertedExerciseId]);
                    });

                    if (accessory4ExerciseValues.length > 0) {
                        await client.query( // TODO here foreign keys
                            format("INSERT INTO  exerciseaccessories (eaexkey, eaaccessoryexkey) VALUES %L", accessory4ExerciseValues) // params as array?
                        );
                    }

                    if (file) {
                        const imagesPath = path.resolve(__dirname, '../images');
                        const imgPath = imagesPath + `/exercisePhoto/${name}/`;
                        const tmpImgPath = `${imagesPath}/temp_exercisePhoto/${filename}`;
                        // copy file if validation and insertion passed.
                        fs.ensureDirSync(imgPath); // create path if not exists.
                        fs.copyFileSync(tmpImgPath, imgPath + filename);
                        fs.unlink(imgPath + filename, (err) => console.log('file remove err: ', _err)); // async
                        fs.unlink(tmpImgPath, (err) => console.log('file remove err: ', _err));// async
                    }

                    res.status(201).send({errors: null, data: insertedExerciseId});
            })
            .catch (err => {
                res.status(500);
                next(err);
                if (file) {
                    fs.unlink(`${path.resolve(__dirname, '../images')}/temp_exercisePhoto/${req.file.filename}`,
                        (_err) => console.log('file remove err: ', _err)); // async
                }
            });
        }
});

router.get('/id/:id', async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT exkey "id", exname "name" FROM exercise WHERE exKey = $1 ', [req.params.id]);

        if (rows.length == 0) {
            res.status(204).send({data: null});
        } else {
            res.status(200).send({data: rows[0]});
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/details/id/:id', async (req, res, next) => {

    try {
        const { rows } = await db.query(`SELECT 
            exkey id, 
            exName "name", 
            exdescription description, 
            eximgname "imgName", 
            exytURL "ytUrl", 
            exsetsUnit "setsUnit", 
            uslogin "createdBy", 
            excreatedon "createdOn"
            FROM exercise JOIN appuser ON excreatedby = uskey
            WHERE exKey = $1 `, [req.params.id]);

        if (rows.length == 0) {
            res.status(204).send({data: null});
        } else {
            const row = rows[0];
            res.status(200).send({data: row});
        }
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});


router.get('/name/:name', async (req, res, next) => {
    const name = req.params.name.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');

    try {
        const { rows } = await db.query("SELECT exkey \"id\", exName \"name\", exsetsUnit \"setsUnit\" FROM exercise WHERE lower(exname) like lower($1)||'%' ", [name]);

        res.status(200).json({data: rows});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/details/name/:name', async (req, res, next) => {
    const name = req.params.name.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
    try {
        const { rows } = await db.query("SELECT exkey, exName, exdescription, eximgpath, exytURL, exsetsUnit, usid, to_char(excreatedon, 'MM/DD/YYYY') FROM exercise WHERE lower(exname) like lower($1)||'%' ", [name]);
            
        res.status(200).send({data: rows});
    }
    catch (e) {
        res.status(500);
        next(err);
    }
});

router.get('/check-exists', async (req, res) => {
    res.status(200).json({
        inUse: await isExercise(req.query.value)
    });
});

/* GET all exercises. */
router.get('/all', async (req, res, next) => {

    try {
        const { rows } = await db.query(`SELECT 
            exkey "id", 
            exname "name", 
            exdescription description, 
            eximgname imgPath, 
            exyturl ytUrl, 
            exsetsunit setUnit, 
            exkey createdBy, 
            to_char(excreatedon, 'MM/DD/YYYY')  createdOn
            FROM exercise order by exkey desc /*exname desc*/`, []);

        res.status(rows.length == 0 ? 204 : 200).send({data: rows});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/:id/photo/', async (req, res, next) => {
    setTimeout(async () => { // todo settimeout (used to check spinner on front)
        try {
            const { rows } = await db.query('SELECT exname "name", eximgname "imgName" FROM Exercise WHERE exkey = $1', [req.params.id]);
            const filePath = `${path.resolve(__dirname, '../images')}/exercisePhoto/${rows[0].name}/${rows[0].imgName}`;
            fs.exists(filePath, (exists) => {
                if (exists) {
                    console.log(filePath);
                    res.status(200).sendFile(filePath);
                }
                else {
                    res.status(204).send(); // no file on disk, clear value in bd.
                    db.query('UPDATE exercise SET eximgname = null WHERE exkey = $1', [req.params.id])
                        .catch(err => console.log('No file on disk (db field cleared) - error: ', err));
                }
            });
        }
        catch (err) {
            res.status(500);
            next(err);
        }
    }, 1);
});

module.exports = router;