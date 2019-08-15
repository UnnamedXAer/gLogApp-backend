
module.exports = { 
    db: function () {  
        let db = {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            max: process.env.DB_MAX,
            idleTimeoutMillis: process.env.DB_IDLETIMEOUTMILLIS // how long a client is allowed to remain idle before being closed
        }
        return db;
    }()
};