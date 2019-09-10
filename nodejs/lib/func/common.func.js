/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-5-9
 * Time: 上午9:52
 * To change this template use File | Settings | File Templates.
 */
/**
 * 获取当前时间 格式：YYYY-MM-dd HH:mm:ss
 * @returns {string}
 */
exports.getNowFormatTime = function () {
    var date = new Date(); seperator1 = "-"; seperator2 = ":"; month = date.getMonth() + 1;
    var strDate = date.getDate(); hour = date.getHours(); minute = date.getMinutes(); second = date.getSeconds();
    var tempArray = new Array(month, strDate, hour, minute, second);
    for(var key in tempArray){
        if(key >= 2){
            if(tempArray[key] >=0 && tempArray[key] <= 9)
                tempArray[key] = '0' + tempArray[key];
        }else{
            if(tempArray[key] >= 1 && tempArray[key] <= 9)
                tempArray[key] = '0' + tempArray[key];
        }
    }
    var currentdate = date.getFullYear() + seperator1 + tempArray[0] + seperator1 + tempArray[1]
        + " " + tempArray[2] + seperator2 + tempArray[3] + seperator2 + tempArray[4];
    return currentdate;
}

/**
 * 获取当前日期   格式：YYYY-MM-dd
 * @returns {number}
 */
exports.getCurrentDate = function(){
    var date = new Date(); seperator1 = "-"; seperator2 = ":"; month = date.getMonth() + 1;
    var strDate = date.getDate();
    var tempArray = new Array(month, strDate);
    for(var key in tempArray){
        if(tempArray[key] >= 1 && tempArray[key] <= 9)
            tempArray[key] = '0' + tempArray[key];
    }
    var currentdate = date.getFullYear() + seperator1 + tempArray[0] + seperator1 + tempArray[1];
    return currentdate;
}

exports.Utf8ToUnicode = function(strUtf8){
	var bstr = "";
	var nTotalChars = strUtf8.length; // total chars to be processed.
	var nOffset = 0; // processing point on strUtf8
	var nRemainingBytes = nTotalChars; // how many bytes left to be converted
	var nOutputPosition = 0;
	var iCode, iCode1, iCode2; // the value of the unicode.
	while (nOffset < nTotalChars) {
		iCode = strUtf8.charCodeAt(nOffset);
		if ((iCode & 0x80) == 0) // 1 byte.
		{
			if (nRemainingBytes < 1) // not enough data
				break;
			bstr += String.fromCharCode(iCode & 0x7F);
			nOffset++;
			nRemainingBytes -= 1;
		}
		else if ((iCode & 0xE0) == 0xC0) // 2 bytes
		{
			iCode1 = strUtf8.charCodeAt(nOffset + 1);
			if (nRemainingBytes < 2 || // not enough data
					(iCode1 & 0xC0) != 0x80) // invalid pattern
			{
				break;
			}
			bstr += String
					.fromCharCode(((iCode & 0x3F) << 6) | (iCode1 & 0x3F));
			nOffset += 2;
			nRemainingBytes -= 2;
		} else if ((iCode & 0xF0) == 0xE0) // 3 bytes
		{
			iCode1 = strUtf8.charCodeAt(nOffset + 1);
			iCode2 = strUtf8.charCodeAt(nOffset + 2);
			if (nRemainingBytes < 3 || // not enough data
					(iCode1 & 0xC0) != 0x80 || // invalid pattern
					(iCode2 & 0xC0) != 0x80) {
				break;
			}
			bstr += String.fromCharCode(((iCode & 0x0F) << 12)
					| ((iCode1 & 0x3F) << 6) | (iCode2 & 0x3F));
			nOffset += 3;
			nRemainingBytes -= 3;
		} else
			// 4 or more bytes -- unsupported
			break;
	}
	if (nRemainingBytes != 0) { // bad UTF8 string.                
		return "";
	}
	return bstr;
}


