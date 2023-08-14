var sql = require('mssql');
//2.
var config = {
    server: '103.21.58.193',
    database: 'Finance',
    user: 'dailythandal',
    password: 'Temp@987#',
    // charset: 'utf8mb4',
    port: 1433,
    "options": {
        "trustServerCertificate": true,
        "encrypt": false,
}
};

async function query(query) {
    try {
      await sql.connect(config);
      const result = await sql.query(query);
      return result.recordset;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

var dbConn = new sql.ConnectionPool(config);
dbConn.connect();
var RequestDatabase = new sql.Request(dbConn);
module.exports = {
    RequestDatabase: RequestDatabase,
    query: query
};