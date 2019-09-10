/**
 * To change this template use File | Settings | File Templates.
 *
 */
module.exports = AdminUserModel;
function AdminUserModel(){

}
/**
 * 继承自基类MODEl ----> CommonModel
 * @type {*}
 */
var CommonModel = require('./common.model.js');
AdminUserModel.prototype = new CommonModel;

/**
 * 重写数据库配置数组。也可以在 config/sys.config.js 文件中定义，在这里直接调用即可。
 * @type {{host: string, user: string, password: string, database: string}}
 */
//UserModel.prototype.configArray = {'host':'localhost', 'user':'root', 'password':'admin', 'database':'test'};
AdminUserModel.prototype.table = 'qs_admin'; //表名

/**
 * 获取用户列表
 * @param searchFields 查询字段 ，必须是关联数组
 * @param whereCondition 查询条件 ，必须是关联数组
 * @param callback
 */
AdminUserModel.prototype.getUserLists = function(searchFields, whereCondition, callback){
   this.select(this.table, searchFields, whereCondition, callback);
}