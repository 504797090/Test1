var mysql = require('mysql'),
    sql_settings = require('../config/sys.config.js').dbConfig;
var conn;

function handleError () {

    conn = mysql.createConnection(sql_settings);
	
    //���Ӵ���2������
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
        // ��������ӶϿ����Զ���������
						  
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