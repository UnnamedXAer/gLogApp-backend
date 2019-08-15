const router = require('express').Router();
const { body, validationResult } = require('express-validator/check');
const format = require('pg-format');
const path = require('path');
const fs = require('fs-extra');
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const multer = require('multer');
const passport = require('passport');

const { isEmailInUse, isLoginInUse } = require('../../utils/utils');
const db = require('../../db/db');

var upload = multer({
    limits: {
        fileSize: 20 * 1024 * 1024,  // x MB upload limit
        files: 1                    // 1 file
    },
    storage: multer.diskStorage({ // https://internodejs.com/blogs/node-js/file-type-validations-in-expressjs-multer
        destination: (req, file, cb) => {
            //let login = req.body.login;
            let _path = `./images/temp_userPhoto/`;
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


router.get('/check-exists', async (req, res, next) => {
    const name = req.query.name;
    const value = req.query.value;
    res.status(200).json({
        inUse: (name === 'login' ? await isLoginInUse(value) : await isEmailInUse(value))
    });
});

// prepended by /auth
router.post('/register', [ // req.body is not here
        upload.single('file'),
        body('login')
            .exists().withMessage('Login is required.')
            .trim()
            .escape()
            .isLength({ min: 2, max: 50 }).withMessage('Login must be 2+ chars long.')
            .custom(async value => !(await isLoginInUse(value))).withMessage('Login already in use.'),
        body('email')
            .exists().withMessage('Email is required.')
            .isEmail().withMessage('Wrong email format.')
            .normalizeEmail()
            .custom(async value => !(await isEmailInUse(value))).withMessage('Email already in use.'),
        body('password', "Password must be 6+ chars long, contain number and uppercase and lowercase letter.")
            .matches(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/))
            .custom((value, { req }) => {
                if (value !== req.body.passwordConfirmation) {
                    return Promise.reject('Password confirmation does not match password.');
                }
                return true;
            }),
        body('passwordConfirmation', "Password confirmation is required.")
            .exists()
            .not().isEmpty(),
        body('dob')
            .custom(value => {
                if (value && isNaN(Date.parse(value))) {
                    return Promise.reject('Wrong date.');
                }
                return true;
            })
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        let errorsArray = errors.array();

        const file = req.file;
        if (file) {
            if (file.size > (2 * 1024 * 1024)) {
                errorsArray.push({
                    //location: "req",
                    msg: "File size limit is 2MB.",
                    param: "file",
                    value: null
                });
            }
        }
        console.log({
            errors: errorsArray,
            results: null
        });

        if (errorsArray.length > 0) {
            res.status(200).json({
                errors: errorsArray,
                results: null
            });
            if (file) {
                fs.unlink(`${path.resolve(__dirname, '../images')}/temp_userPhoto/${file.filename}`,
                    (err) => console.log(err)); // async
            }
        }
        else {

            const { login, email, password, dob } = req.body;

            const hash = await bcrypt.hash(password, bcrypt.genSaltSync(10));
            console.log(hash);

            try {
                let imagesPath = "";
                let imgPath = "";
                let tmpImgPath = "";
                if (file) {
                    imagesPath = path.resolve(__dirname, '../../images');
                    imgPath = imagesPath + `/userPhoto/${login}/`;
                    tmpImgPath = `${imagesPath}/temp_userPhoto/${file.filename}`;
                }
                const sql = format(
                    'INSERT INTO appuser (uslogin, usemail, uspassword, usdob, usimgname, uscreatedon) VALUES (%L) returning uskey as id',
                    [login, email, hash, (dob ? dob: null), (file ? file.filename : null), new Date()] // TODO default pg data do not set time (just date)
                );
                const { rows } = await db.query(sql);

                if (file) {
                    try {   // copy file if validation and insertion passed.
                        fs.ensureDirSync(imgPath); // create path if not exists.
                        fs.copyFileSync(tmpImgPath, imgPath + file.filename);
                    }
                    catch (err) {
                        console.log('user/register (insert into appuser) error: ', err);
                        if (rows.length > 0) {
                            try {
                                const results = await db.query('delete from appuser where key = $1', [rows[0].id]);
                                console.log('user/register -copy foto failed - deleted user: ', results)
                            }
                            catch (err) {
                                console.log('auth/register/ - copy photo failed -> delete user failed with err: ', err);
                            }
                        }
                        res.status(500); // TODO: mb transaction and rollback;
                        return next(err);
                    }
                    finally {
                        fs.unlink(tmpImgPath, (err) => console.log(err)); // async
                    }
                }

                passport.authenticate('local', {}, (err, user, info) => {
                    if (err) {
                        res.status(500);
                        return next(err);
                    }
                    if (info || !user) 
                        return res.status(200).json({wrongCredentials: (info.message ? info.message : 'Invalid credentials.')});
    
                    req.login(user, (err) => {
                        console.log(`  req.session.passport: ${JSON.stringify(req.session.passport)}`);
                        console.log(`  req.user: ${JSON.stringify(req.user)}`);
            
                        if (err){
                            res.status(500);
                            return next(err);
                        }
            
                        res.status(201).send({results: user});
                    })
                })(req, res, next);
            }
            catch (err) {
                // res.status(500).json({message: 'Internal server error'});
                if (file) {
                    fs.unlink(tmpImgPath, (err) => console.log(err)); // async
                    fs.unlink(imgPath + file.filename, (err) => console.log(err));
                }
                res.status(500);
                next(new Error('Internal server error.'));
            }
        }
});

router.post('/login', [
        body('login')
            .exists().withMessage('Login is required.')
            .trim()
            .escape(),
        body('password')
            .exists().withMessage('Password is required')
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        let errorsArray = errors.array();
        console.log(errorsArray);
        if (errorsArray.length > 0) {
            res.status(200).json({ errors: errorsArray, user: null });
        }
        else {

            passport.authenticate('local', {}, (err, user, info) => {

                if (err) {
                    res.status(500);
                    return next(err);
                }

                if(info || !user) {
                    return res.status(200).json({errors: [{msg: 'Invalid credentials.'}], user: null});
                }

                req.login(user, (err) => {
       
                    if (err) {
                        res.status(500);
                        return next(err);
                    }
                    console.log('process.env.SESSION_EXPIRATION_AFTER = '+ process.env.SESSION_EXPIRATION_AFTER);
                    setTimeout(
                        () => console.log('Session Expired.')
                        ,
                        new Date().getTime()+(process.env.SESSION_EXPIRATION_AFTER * 60 * 60 * 1000) - Date.now());

                    return res.status(201).send({errors: null, user: user, expirationDate: new Date().getTime()+(process.env.SESSION_EXPIRATION_AFTER * 60 * 60 * 1000)});
                })
            })(req, res, next);
        }
});


router.get('/amiallowed', async (req, res, next) => { // TODO remove
    if (!req.isAuthenticated()) {
        return res.status(401).send({message: 'Un authorized access.'});
    } 
    try {
        const { rows } = await db.query('select * from appuser where uskey = $1', [req.user.id]);
        if (rows.length > 0)
            res.status(200).json({data: rows});
        else
            res.status(204).json({data: rows});
    }
    catch (err) {
        res.status(500);
        next(err);
    }
});

router.get('/logout', async (req, res, next) => {
    const user = req.user;
    req.logout();
    res.status(200).send({message: 'Logged out.'});
    console.log('/user/logout/ ', user);
});

module.exports = router;