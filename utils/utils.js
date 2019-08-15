const db = require('../db/db');

const isExercise = async (name) => {
    try {
        const { rows } = await db.query("SELECT exkey from exercise where lower(exname) = lower($1)", [name]);
        if (rows.length > 0) {
            return true;
        }
        return false;
    }
    catch (e) {
        console.log('error in: isExercise.\n', e);
        return false; // it we pass this be it will fail anyway on insertion
        //throw new Error('Connection problem. Failed to check Exercise.');
    }
}

const isLoginInUse = async (login) => {
    try {
        const { rows } = await db.query("SELECT uskey from appuser where lower(uslogin) = lower($1)", [login]);

        if (rows.length > 0) {
            return true;
            //throw new Error('Login already in use.');
        }
        return false;
    }
    catch (e) {
        console.log('error in: isLoginInUse.\n', e);
        return false; // it we pass this be it will fail anyway on insertion
        //throw new Error('Connection problem. Failed to check login.');
    }
}

const isEmailInUse = async (email) => {

    try {
        const { rows } = await db.query("SELECT uskey from appuser where (usemail) = ($1)", [email]);

        if (rows.length > 0) {
            //throw new Error('Email already in use.');
            return true;
        }
        return false;
    }
    catch (e) {
        console.log('error in: isEmailInUse.\n', e);
        return false; // it we pass this be it will fail anyway on insertion
        //throw new Error('Connection problem. Failed to check email.');
    }
}

/**
 *Check if given param is correct date.
 *
 * @param {String | Date} date
 * @returns {Boolean}
 */
function isCorrectDate(date) {
    if (date instanceof Date) {
        return (!isNaN(date.getTime()));
    }
    else {
        const d = new Date (date);
        if (isNaN(d.getTime())) {
            return false;
        }
        
        if (date.indexOf('GMT') !== -1) { // "Wed, 12 Jun 2019 13:04:42 GMT"
            let parsedDate = d.toUTCString();
            return date === parsedDate;
        }

        let month = d.getMonth()+1;
        if (month < 10) month = "0"+month;    
        let day = d.getDate();
        if (day < 10) day = "0"+day;    
        let parsedDate = d.getFullYear()+'-'+month+'-'+day;
        if (date.length > 10) {
            let hh = d.getHours();
            if (hh < 10) hh = "0"+hh;
            let mm = d.getMinutes();
            if (mm < 10) mm = "0"+mm;
            parsedDate += 'T'+hh+":"+mm;
        }
        return date.substr(0, parsedDate.length) === parsedDate;
    }
}

module.exports = {
    isExercise: isExercise,
    isEmailInUse: isEmailInUse,
    isLoginInUse: isLoginInUse,
    isCorrectDate: isCorrectDate
}