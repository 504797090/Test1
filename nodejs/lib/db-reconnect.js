var mysql = require('mysql'),
    sql_settings = require('../config/sys.config.js').dbConfig;
var conn;

function handleError () {

    conn = mysql.createConnection(sql_settings);
	
    //连接错误，2秒重试
    conn.connect(function (err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleError , 2000);
        }
    });

    conn.on('error', function (err) {
        console.log('db error', err);
		console.log(err);
		console.log(err.code);
        // 如果是连接断开，自动重新连接
						  
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleError();
        } else {
            throw err;
        }
    });
	//console.log(conn);
}
handleError();

module.exports.getConnection = function () {
    return conn;
};

module.exports.conn = function () {
    return conn;
};

module.exports.escape = function (str) {
    return mysql.escape(str);
};