const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const db = require('../db/db');

passport.use('local', new LocalStrategy({
    usernameField: 'login',
    passwordField: 'password'
}, async (login, password, done) => {

    try { // todo: insert user when singingup
        const { rows } = await db.query('select uskey as key, uslogin as "loginDB", uspassword as "passwordDB" from appuser where lower(uslogin) = lower($1)', [login]);
        if (rows.length > 0) {
            const { passwordDB, key, loginDB } = rows[0];
            const correctPassword = await bcrypt.compare(password, passwordDB);
            if (correctPassword) {
                done(null, { id: key, login: loginDB }); // go to next stage (serializeUser)
            }
            else {
                done(null, false, {message: 'Invalid credentials.\n'});
            }
        }
        else {
            done(null, false, {message: 'Invalid credentials.\n'});
        }
    }
    catch (err) {
        done(new Error('Internal server error.'));
    }
}));

passport.serializeUser((user, done) => { // after finding / creating new user in db
    done(null, user.id); // pass user id to cookies 
});

passport.deserializeUser(async (id, done) => { // when the cookie comes back to us from the browser when make request we receive that id then we find the user that mach to given id
    try { 
        const { rows } = await db.query('SELECT uskey id, uslogin login FROM appuser WHERE uskey = $1', [parseInt(id, 10)]);

        if (rows.length > 0) {
            //const { id, login } = rows[0];
            done(null, rows[0]); // assign user to request object
        }
        else {
            done(new Error(`User with key ${id} not found`));
        }
    } catch (err) {
        done(new Error('Internal server error.'));
    }
});

module.exports = passport;