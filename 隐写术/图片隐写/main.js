var maxMessageSize=1000;function $_(id){return document.getElementById(id)}function importImage(){var reader=new FileReader();reader.onload=function(event){$_("secret_text").value="";$_("secret_pwd").value="";$_("result_image_output").src="";$_("encode_tip").innerHTML="";var img=new Image();img.onload=function(){var ctx=$_("result_image").getContext("2d");ctx.canvas.width=img.width;ctx.canvas.height=img.height;ctx.drawImage(img,0,0)};img.src=event.target.result};reader.readAsDataURL($_("origin_image").files[0])}
function encode(){
    var message=$_("secret_text").value;
    var password=$_("secret_pwd").value;
    if(password==""){
        alert("密码不能为空");
        return;
    }
    var output=$_("result_image_output");
    var result_image=$_("result_image");
    var ctx=result_image.getContext("2d");
    if(password.length>0){
        message=sjcl.encrypt(password,message)
    }else{
        message=JSON.stringify({text:message})
    }
    var pixelCount=ctx.canvas.width*ctx.canvas.height;
    if((message.length+1)*16>pixelCount*4*0.75){
        alert("需要隐藏的文本信息相对于图片来说太长了。可以减少文字信息，或者加大图片！");
        return
    }
    if(message.length>maxMessageSize){
        alert("需要隐藏的信息太长，最大为："+maxMessageSize+".");
        return
    }
    var imgData=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    encodeMessage(imgData.data,sjcl.hash.sha256.hash(password),message);
    ctx.putImageData(imgData,0,0);
    output.src=result_image.toDataURL();
    $_("encode_tip").innerHTML="带有加密信息的图片已经生成<br/>点击下方图片就可以保存哦~";
    document.querySelector('.resdiv').classList.add('resbox');
}function selectEncodeImage(){var reader=new FileReader();reader.onload=function(event){$_("decode_pwd").value="";$_("messageDecoded").innerHTML="";var img=new Image();img.onload=function(){var ctx=$_("decode_result_image").getContext("2d");ctx.canvas.width=img.width;ctx.canvas.height=img.height;ctx.drawImage(img,0,0)};img.src=event.target.result};reader.readAsDataURL($_("decode_image").files[0])}
function decode(){
    var password=$_("decode_pwd").value;
    if(password==""){
        showDecodeError("请填写密码！")
    }
    var passwordFail="密码错误";
    var ctx=$_("decode_result_image").getContext("2d");
    var imgData=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
    var message=decodeMessage(imgData.data,sjcl.hash.sha256.hash(password));
    var obj=null;
    try{
        obj=JSON.parse(message)
    }catch(e){
        if(password.length>0){
            showDecodeError(passwordFail)
        }
    }
    if(obj){
        if(obj.ct){
            try{
                obj.text=sjcl.decrypt(password,message)
            }catch(e){
                showDecodeError(passwordFail)
            }
        }
        var escChars={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;","\n":"<br/>"};
        var escHtml=function(string){
            return String(string).replace(/[&<>"'\/\n]/g,function(c){return escChars[c]})
        };
        showDecodeSuccess("图片中隐藏的信息为：<br/><span class='green' id='DeMsg'>"+escHtml(obj.text)+"</span><br><button id='DeBtn'>复制解密内容</button>")
    }
}
var getBit=function(number,location){return((number>>location)&1)};var setBit=function(number,location,bit){return(number&~(1<<location))|(bit<<location)};var getBitsFromNumber=function(number){var bits=[];for(var i=0;i<16;i++){bits.push(getBit(number,i))}return bits};var getNumberFromBits=function(bytes,history,hash){var number=0,pos=0;while(pos<16){var loc=getNextLocation(history,hash,bytes.length);var bit=getBit(bytes[loc],0);number=setBit(number,pos,bit);pos++}return number};var getMessageBits=function(message){var messageBits=[];for(var i=0;i<message.length;i++){var code=message.charCodeAt(i);messageBits=messageBits.concat(getBitsFromNumber(code))}return messageBits};var getNextLocation=function(history,hash,total){var pos=history.length;var loc=Math.abs(hash[pos%hash.length]*(pos+1))%total;while(true){if(loc>=total){loc=0}else{if(history.indexOf(loc)>=0){loc++}else{if((loc+1)%4===0){loc++}else{history.push(loc);return loc}}}}};function encodeMessage(colors,hash,message){var messageBits=getBitsFromNumber(message.length);messageBits=messageBits.concat(getMessageBits(message));var history=[];var pos=0;while(pos<messageBits.length){var loc=getNextLocation(history,hash,colors.length);colors[loc]=setBit(colors[loc],0,messageBits[pos]);while((loc+1)%4!==0){loc++}colors[loc]=255;pos++}}var decodeMessage=function(colors,hash){var history=[];var messageSize=getNumberFromBits(colors,history,hash);if((messageSize+1)*16>colors.length*0.75){return""}if(messageSize===0||messageSize>maxMessageSize){return""}var message=[];for(var i=0;i<messageSize;i++){var code=getNumberFromBits(colors,history,hash);message.push(String.fromCharCode(code))}return message.join("")};function showDecodeError(msg){$_("messageDecoded").className="strong red";$_("messageDecoded").innerHTML=msg}function showDecodeSuccess(msg){$_("messageDecoded").className="strong";$_("messageDecoded").innerHTML=msg};