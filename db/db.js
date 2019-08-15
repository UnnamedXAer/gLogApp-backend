const { Pool } =  require('pg');
const config = require('../config/config');

const pool = new Pool(config.db);

async function tx(callback) {
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            try {
                await callback(client);
                await client.query('COMMIT');
            } catch (e) {
                console.log('Transaction Error: \n', e);
                client.query('ROLLBACK');
                throw e; // to catch in routes and set status/use next(err);
            }
        }
        finally {
            client.release();
        }
    }
    catch (e) { // TODO: remove this try.. catch if not needed.
        throw e;
    }
}

module.exports = {
    query: (text, params) => pool.query(text, params),
    tx: tx
}