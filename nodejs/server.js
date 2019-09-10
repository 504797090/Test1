var express = require('express'),
    app = express(),
    //server = require('http').createServer(app),
    //io = require('socket.io').listen(server),
    users = [];


var CONFIG = require('./config/sys.config.js');
var customFunc = require(CONFIG.LIB_PATH + '/func/common.func.js');

var io = require('socket.io').listen(8002,{
  'log level':1
});
console.log('-------------------------------------------------------------------');
console.log('server started on port:'+ 8002);
console.log('-------------------------------------------------------------------');

//一个客户端连接的字典，当一个客户端连接到服务器时，
//会产生一个唯一的socketId，该字典保存socketId到用户信息（昵称等）的映射
var connectionList = {};

var rooms = ['weixin'];
function isInRooms(roomname){
	for(arr in rooms){
		if (  rooms[arr] == roomname )
		{
			return true;
		}
	}
	return false;
}

var db = require(__dirname + "/lib/db-reconnect");
//var conn = db.conn();
console.log("=-======================");
//var database = require(__dirname + "/lib/database");
//var db = database.getConnection();

var connect = require('connect')
var cookie = require('cookie');

var Iconv = require('iconv').Iconv;
var iconv = new Iconv('UTF-8', 'ASCII//IGNORE');



function log0(str){
	console.log(customFunc.getNowFormatTime() + " : "+str);
}


io.set('authorization', function(handshakeData, callback){
	//var cookieParser = require('cookie-parser');
	//log0("go  authorization");
	if (!handshakeData.headers.cookie)
    {
		return callback('no found cookie', false);
    }
	var cookies = handshakeData.headers.cookie;
	try{
		cookies = cookie.parse(decodeURIComponent(cookies));
	}
	catch(e){
		log0(e);
	}
	
	var connect_sid = cookies['PHPSESSID'];
	//log0("PHPSESSID = "+connect_sid);
	if (connect_sid) {
		var uid ;
		//handshakeData.session = connect_sid;
		//callback(null, true);
		var nowtime  = Date.now();
		nowtime = parseInt(nowtime / 1000) - 3600*24*2; //2天内
		var sql  = "SELECT l.admin_id,admin.realname,admin.purview,admin.weixinopenid,admin.b_qq_openid FROM login_list as l left join qs_admin as admin on l.admin_id = admin.admin_id WHERE admin.status = 1 and session_id = " + db.escape(connect_sid) +" and login_time >= " + nowtime + " limit 1;";
	    log0("authorization sql");
		db.conn().query(sql, function(err, results) {
			if (err) {
				log0(" query err " + Date.now());
				throw err;
			}
			if (results.length <= 0){
				log0("session is not login in 2 day");
				return callback('session is not login in 2 day',false);  
			}
			else {
				log0("admin id :"+results[0].admin_id);
				uid = results[0].admin_id;
			}
			
			if( uid ){
				//log0(" login in " + Date.now());
				handshakeData.uid = uid;
				handshakeData.session = connect_sid;  
				return callback(null,true);  
			}else{  
				return callback('userid is empty',false);  
			} 

		});
	}
	else {
		log0(" nosession " + Date.now()); 
		callback('nosession');
	}
});

io.sockets.on('connection', function(socket) {
	//console.log(socket);
	var socketId = socket.id;
    connectionList[socketId] = {
		socket: socket
	};

    socket.on('login', function(token,roomname) {
		if (!isInRooms(roomname))
		{
			socket.emit('error','no this room');
		}
		var nowtime  = Date.now();
		nowtime = parseInt(nowtime / 1000) - 60;
		var sql  = "SELECT l.admin_id,admin.realname,admin.purview,admin.weixinopenid,admin.b_qq_openid FROM login_list as l left join qs_admin as admin on l.admin_id = admin.admin_id WHERE admin.status = 1 and checkStr = " + db.escape(token) +" and login_time >= " + nowtime + " limit 1;";
		db.conn().query(sql, function(err, results) {
			if (err) {
			   throw err;
			}
			//log0(results.length);
			if (results.length <= 0){
				socket.emit('loginfail');
			}
			else {
				//检查是否已登录
				//todo
				socket.join(roomname);
				socket.userIndex = users.length;
				var nickname = results[0].realname;
				socket.nickname = nickname;
				users.push(nickname);
				socket.emit('loginSuccess',nickname);
				customFunc.getNowFormatTime();
				
				log0(iconv.convert(nickname)+" login in");
			 
				io.sockets.emit('system', nickname, users.length, 'login');
			}
			//log0("results:"+results);
		});
    });
    //user leaves
    socket.on('disconnect', function() {
        users.splice(socket.userIndex, 1);
        socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
    });
    //new message get
    socket.on('postMsg', function(msg) {
        //socket.broadcast.emit('newMsg',msg);
    });

	//通知消息
    socket.on('notice', function(msg) {
        socket.broadcast.emit('notice',msg);
    });

    //new image get
    socket.on('img', function(imgData, color) {
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
});

//检查新用户
var k = 0;
function checkNewUser(){
	//log0(new Date());
	k =  k+1;
	//var sql  = "SELECT COUNT(*) AS num FROM wx_user_wait_vie as waituser left join wx_user as user on user.id = waituser.userid where adminid=0 and kefuid = 0 ";
	var sql  = "SELECT  waituser.* FROM wx_user_wait_vie as waituser left join wx_user as user on user.id = waituser.userid where adminid=0 and kefuid = 0 limit 1";
		db.conn().query(sql, function(err, results) {
			if (err) {
			   throw err;
			}
			if (results.length == 1){
				var userid = results[0].userid;
				if (userid>0)
				{
					//计算分配的客服 max( (1-d.status) * d.lasttime ) t
					//var kefu_sql = "SELECT s.kefu_id,MAX( d.status ) s, max(case when d.status = 0 then d.lasttime else 0 end) t FROM  `qs_admin_status` s LEFT JOIN qs_admin_dialogue d ON s.kefu_id = d.kefu_id WHERE s.`status` =1 GROUP BY s.kefu_id ORDER BY s,t";
					var kefu_sql ="SELECT s.kefu_id,max(case when (ir.`addtime` is null and up.replaytime > (UNIX_TIMESTAMP(NOW()) - 500)) then 1 else 0 end) s, max(ir.`addtime`) t FROM  `qs_admin_status` s left join wx_user_p up on s.kefu_id = up.kefuid left join `i_rates` ir on up.kefuid = ir.`kefuid`and up.userid = ir.`wx_userid` WHERE  s.status = 1 and ((type = 'evaluate' and up.replaytime < ir.`addtime` ) or ir.`addtime` is null ) group by s.kefu_id ORDER BY s,t";
					var addTime = results[0].addtime;
					var timestamp = Date.parse(new Date())/1000;
					var interval_time = 60*2;
					var kefu_id = 0;
					db.conn().query(kefu_sql, function(err2, kefus) {
						if (err2) {
							throw err2;
						}
						var kefu_num = kefus.length;
						if ( kefu_num >0){
							var k = Math.floor((timestamp - addTime)/interval_time)%kefu_num;
							kefu_id = kefus[k].kefu_id;
							io.sockets.emit('newUser',userid+','+kefu_id);
							db.conn().query("update wx_user set kefuid = "+kefu_id+" where id="+userid+" LIMIT 1", function(err, results) {})
							db.conn().query("update wx_user_p set kefuid = "+kefu_id+",bind_time = "+timestamp+" where userid="+userid+" LIMIT 1", function(err, results) {})
							
							k = 0;
							log0("newUser id:"+userid+","+k+","+kefu_id);
							return;
						}else{
							io.sockets.emit('newUser',userid+','+kefu_id);
							log0("newUser id:"+userid);
						}
					});
					
				}else{
					if (k%6 == 0) // 20秒
					{
						io.sockets.emit('noUser');
					}
				}
			}else{
				if (k%6 == 0) // 20秒
				{
					io.sockets.emit('noUser');
				}
			}
		});
	//var t = "" +k;
	//io.sockets.emit('system', t, connectionList.length, 'login');
}
setInterval(checkNewUser,3000);


//系统消息监控
function msgMonitor(){
	var sql  = "SELECT * FROM i_msg where issend = 0 LIMIT 1"; //未发送到消息
		db.conn().query(sql, function(err, results) {
			if (err) {
			   throw err;
			}
			if (results.length == 1){
				var msg_id = results[0].id;
				var touser = results[0].touser;
				var msg_content = results[0].content;
				if (touser==0) //全局消息
				{
					io.sockets.emit('notice',msg_content);
					db.conn().query("update i_msg set issend = 1 where id="+msg_id+" LIMIT 1", function(err, results) {})
				}
			}
		});
}
setInterval(msgMonitor,5000); //消息监控

//定时监控用户是否下线
function checkAdminStatus(){
	var sql  = "SELECT kefu_id FROM qs_admin_status where `status` =1 AND lasttime < UNIX_TIMESTAMP(NOW()) - 20 "; //已下线会员
		db.conn().query(sql, function(err, results) {
			if (err) {
			   throw err;
			}
			if (results.length >0){
				for(k in results){
					var kefu_id = results[k].kefu_id;
					db.conn().query("update qs_admin_status set status = 0 where kefu_id = "+kefu_id, function(err, results) {})
					db.conn().query("update qs_admin_dialogue set status = 0 where kefu_id = "+kefu_id, function(err, results) {})
				}
			}
		});
}
setInterval(checkAdminStatus,3000); //客服在线监控