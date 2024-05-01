// 是否登录
var isLogin = false;
// 是否选择大区
var isArea = false;
// 周签
var weekSignIn = 0;
// 补签资格数
var weekSupplementarySignature = 0;
// 月签
var monthSignIn = 0;
// 日期
var week = [7, 1, 2, 3, 4, 5, 6]; // 索引0，是星期天
var currentDate = new Date();
var currentDay = currentDate.getDay();
var weekDay = week[currentDay]; // 今天星期几
// 提示
var htmlPrompt = '';
// 函数的存储
var func = new Array();
// 对应的id放到这里
var arr = new Array();
// 显示规则
var showRule = '0';
// 判断使用哪个弹框（一键领取）
var muchAndLess = 0;


// 弹出页的显示
function BasicInformation() {
    if(showRule == '0'){
        TGDialogS('pop1');
    }
}


// 触发一周显示一次的资格
var flow_1028284 = {
    actId: '632062',
    token: '889f11',
    sData: {
    },
    success: function(res){
        console.log(res);
    },
    fail: function(res){
          if(res.iRet == 101){
              //todo 登录态失效，需要重新调登录方法 （开发自行实现）
          } else if (res.iRet == 99998) {
              // todo 调用提交绑定大区方法
          }
          console.log(res);
    }
}



function aloneClick(){
    TGDialogS('pop1');
}

function getMondayTimestamp() {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 获取星期几，如果为0则设置为7
    const delta = 1 - dayOfWeek; // 计算从当前日期到本周一的差距
   
    const monday = new Date(now.setDate(now.getDate() + delta));
    monday.setHours(0, 0, 0, 0); // 将时间设置为零点
   
    return monday.getTime()/1000; // 获取本周一零点的时间戳,精确到秒级
}


// 弹出领取奖励弹框
function getPrize(data) {
    getBasicData();
    $('.cn3>p').html(data);
    TGDialogS('pop3');
}

// 一键领取显示所有
function allGiftShow(data){
    getBasicData();
    if(muchAndLess){
        // much
        $('.swiper-slide>p').html(data);
        TGDialogS('pop5');
    }else{
        // less
        $('.cn7>p').html(data);
        TGDialogS('pop7');
    }
}

// 警告
function warningInformation(data) {
    $('.cn2>p').html(data);
    TGDialogS('pop2');
}


// QQ登录
function login_QQ() {
    Milo.mobileLoginByQQConnect();
}

// 退出
function login_out() {
    Milo.logout({
        // 退出回调
        callback: function () {
            location.reload();
        }
    });
}

// 判断是否登录
function check_loginQQ(){
    Milo.checkLogin({
        iUseQQConnect: true, //如果当前活动使用的互联登录,请将改参数设置true
        success: function (user) {
            var userInfo = user && user.userInfo;
            $("#logined").show();
            $(".selectArea").show();
            $("#unlogin").hide();
            // $("#userinfo").text(userInfo.userUin);
            $("#userinfo").text(userInfo.nickName);
            isLogin = true;
            queryBindArea();
        },
        fail: function (res) {
            //todo login
            warningInformation('请您先登录！');
        }
    });
}
check_loginQQ();


// 查询绑定大区（查信息的）
function queryBindArea() {
        // 检查登录
        if(!isLogin){
            login_QQ();
            return;
        }
    var flow_query = {
        actId: '632062',
        token: '7436dc',
        loading: true, // 开启loading浮层,默认不开启
        sData: {
            query: true
        },
        success: function (res) {
            if (res.data) {
                if(GetUrlValue(getParentUrl(), "areaId")>0){
                    $('#milo-changeArea').css('display', 'none'); 
                    $('#ptLogoutBtn').css('display', 'none'); 
                    if(GetUrlValue(getParentUrl(), "areaId")!=res.data.area){
                        bindAreaInClient();
                    }
                }
                $("#milo-binded").show();
                $("#milo-unbind").hide();
                console.log('aaa'+res.data.areaName);
                //$("#milo-areaName").text(res.data.areaName);
                if(res.data.area=="1"){
                    $("#milo-areaName").text('电信区');
                }else if(res.data.area=="2"){
                    $("#milo-areaName").text('联通区');
                }else{
                    $("#milo-areaName").text(res.data.areaName);
                }
                
                $("#milo-roleName").text(res.data.roleName);
                isArea = true;
                getBasicData();
            }
        },
        fail: function (res) {
            if (res.iRet === -9998 || res.iRet === "-9998") {
                return;
            }
            $("#milo-binded").hide();
            $("#milo-unbind").show();
            console.log('查询绑定大区fail', res);
            if(GetUrlValue(getParentUrl(), "areaId")>0){
                $('#milo-changeArea').css('display', 'none'); 
                $('#ptLogoutBtn').css('display', 'none'); 
                bindAreaInClient();
            }
        }
    }

    Milo.emit(flow_query);
}

// 提交绑定大区（登录框）
function commitBindArea() {
    // 检查登录
    if(!isLogin){
        login_QQ();
        return;
    }
    var flow_commit = {
        actId: '632062',
        token: 'b1be18',
        loading: true, // 开启loading浮层,默认不开启
        sData: {
            query: false
        },
        success: function (res) {
            if (res.data) {
                $("#milo-binded").show();
                $("#milo-unbind").hide();
                $("#milo-areaName").text(res.data.areaName);
                $("#milo-roleName").text(res.data.roleName);
                isArea = true;
                queryBindArea();
            }
        },
        fail: function (res) {
            if (res.iRet === -9998 || res.iRet === "-9998") {
                return;
            }
            $("#milo-binded").hide();
            $("#milo-unbind").show();
            console.log('提交绑定大区失败', res);
            warningInformation('提交绑定大区失败！');
        }
    }
    Milo.emit(flow_commit)
}


// 自定义流程 获取数据
var flow_1028462 = {
    actId: '632062',
    token: '1452b9',
    sData: {
        witchDay:weekDay
    },
    success: function (res) {
        console.log('初始化数据');
        console.log(res);
        // 初始化
        htmlPrompt = '';
        weekSignIn = res.details.modRet.sOutValue5;

        // 周补签的使用资格数
        if(weekDay < 3){
            weekSupplementarySignature = 0; 
        }else{
            var weekBuqian = res.details.modRet.sOutValue7.split(',');
            if(weekBuqian[1] == 1){
                // 已经使用资格
                weekSupplementarySignature = 0;
            }else{
                if(weekBuqian[0] >= 3){
                    weekSupplementarySignature = 1;
                }else{
                    weekSupplementarySignature = 0;
                }
            }
        }
        // 把数据写进去
        $(".hd_sign").html('本周签到<span>' + weekSignIn + '</span>天，有<span>' + weekSupplementarySignature + '</span>天可补签<a class="hd_activity" href="javascript:aloneClick();"></a>');
        $("#box1_title_c").html('<p>本周签到 <span><em>' + weekSignIn + '</em>/7</span> 天</p>');

        monthSignIn = res.details.modRet.sOutValue4;
        if(monthSignIn > 25){
            monthSignIn = 25;
        }
        $("#box2_title_c").html('<p>本月签到 <span><em>' + monthSignIn + '</em>/25</span> 天</p>');

        var weekStatue = res.details.modRet.sOutValue2.split(',');
        // 周签到的按钮（添加class）
        $.each(weekStatue, function (index, value) {
            // 是否领取（里面有补签）
            if (Number(value)) {
                // 比较日期
                if (weekDay < index + 1) {
                    // 未领取
                    $(".box1_list").children("li").eq(index).addClass('box1_btn_gray2');
                } else if (weekDay > index + 1) {
                    // 有补签资格
                    // 补签
                    $(".box1_list").children("li").eq(index).addClass('box1_btn_gray1');
                    // 点击补签函数
                    var numberWeek = index + 1;
                    $('.box1_btn_gray1 a').eq(index).attr("href", "javascript:weekSignatureRepeat(" + numberWeek + ")");
                }
            } else {
                // 签到 以领取
                $(".box1_list").children("li").eq(index).addClass('box1_btn_gray3');
            }
        });
        // 结束

        var monthStatue = res.details.modRet.sOutValue1.split(',');
        // console.log(monthStatue); // 月签（资格剩余）
        // 月签到（显示领取的按钮）
        if (monthSignIn >= 5) {
            if (monthStatue[0] == 1) {
                $(".box2_list").children("li").eq(0).addClass('one'); // one 为已领取状态
            }
        } else {
            $(".box2_list").children("li").eq(0).addClass('two'); // two 不可领取
        }

        if (monthSignIn >= 10) {
            if (monthStatue[1] == 1) {
                $(".box2_list").children("li").eq(1).addClass('one');
            }
        } else {
            $(".box2_list").children("li").eq(1).addClass('two');
        }

        if (monthSignIn >= 15) {
            if (monthStatue[2] == 1) {
                $(".box2_list").children("li").eq(2).addClass('one');
            }
        } else {
            $(".box2_list").children("li").eq(2).addClass('two');
        }

        if (monthSignIn >= 20) {
            if (monthStatue[3] == 1) {
                $(".box2_list").children("li").eq(3).addClass('one');
            }
        } else {
            $(".box2_list").children("li").eq(3).addClass('two');
        }

        if (monthSignIn >= 25) {
            if (monthStatue[4] == 1) {
                $(".box2_list").children("li").eq(4).addClass('one');
            }
        } else {
            $(".box2_list").children("li").eq(4).addClass('two');
        }
        // 结束

        // 日常任务
        // console.log('日常任务渲染');
        var taskStatus = res.details.modRet.sOutValue3.split(','); // 日常任务资格
        var taskNumber = 0;
        $.each(taskStatus,function(index,value){
            if(value == 1){
                // 完成 领取
                taskNumber++;
                $("#box3_btn_gray_show"+index).addClass('box3_btn_gray3'); // 这里是已领取
                $("#box3_btn_gray_show"+index).removeAttr('do'); // 去除属性
            }
        });
        $("#box3_title_c").html('<p>已完成 <span><em>'+taskNumber+'</em>/5</span></p>');
        // 结束

        // 日常任务补充数据 显示按钮的状态
        var taskData = res.details.modRet.sOutValue8.split(',');

        if(taskStatus[0] == 0){
            if(taskData[0] != 0){
                $("#box3_btn_gray_show0").attr('do','cando'); // 添加状态
                $("#box3_btn_gray_show0").addClass('box3_btn_gray1');
            }
        }

        if(taskStatus[1] == 0){
            if(taskData[1] != 0){
                $("#box3_btn_gray_show1").attr('do','cando'); // 添加状态
                $("#box3_btn_gray_show1").addClass('box3_btn_gray1');
            }
        }


        if(taskData[2] >= 80){
            taskData[2] = 80;
        }
        $('#box3_bg_txt_txt_pa_1').html('游戏活跃<span>（'+taskData[2]+'/80）</span>');
        if(taskStatus[2] == 0){
            if(taskData[2] >= 0 && taskData[2] < 80){
                $("#box3_btn_gray_show2").addClass('box3_btn_gray2');
            }else{
                $("#box3_btn_gray_show2").addClass('box3_btn_gray1');
                $("#box3_btn_gray_show2").attr('do','cando'); // 添加状态
            }
        }

        var box3_btn_gray_show_time = res.details.modRet.sOutValue6.split(',');
        showRule = box3_btn_gray_show_time[2];
        var box3_4_btn_gray_show_time = getMondayTimestamp();
        // console.log('js'+box3_4_btn_gray_show_time);
        if(taskStatus[3] == 0){
            if(taskData[3] == 1 && box3_btn_gray_show_time[0] >= box3_4_btn_gray_show_time){
                $("#box3_btn_gray_show3").addClass('box3_btn_gray1');
                $("#box3_btn_gray_show3").attr('do','cando'); // 添加状态
            }else{
                $("#box3_btn_gray_show3").addClass('box3_btn_gray2');
            }
        }


        if(taskStatus[4] == 0){
            if(taskData[4] == 1 && box3_btn_gray_show_time[1] >= box3_4_btn_gray_show_time){
                $("#box3_btn_gray_show4").addClass('box3_btn_gray1');
                $("#box3_btn_gray_show4").attr('do','cando'); // 添加状态
            }else{
                $("#box3_btn_gray_show4").addClass('box3_btn_gray2');

            }
        }
        // 结束
        // 弹框
        // console.log('showRule123:'+showRule);
        if(showRule == '0'){
            BasicInformation();
            Milo.emit(flow_1028284);
        }
        // 结束
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
    }
}

function getBasicData() {
        // 检查登录
        if(!isLogin){
            login_QQ();
            return;
        }else if(!isArea){
            // 提交绑定大区
            commitBindArea();
            return;
        }else{
            Milo.emit(flow_1028462);
        }
}

// 周一签到
var flow_1028292 = {
    actId: '632062',
    token: '6c0162',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation(res.sMsg);
    }
}

function mondaySignIn() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }
    if($(".box1_list").children("li").eq(0).attr('class') == 'box1_btn_gray3'){
        warningInformation('您已领取');
    }else{
        Milo.emit(flow_1028292);
    }
}

// 周二签到
var flow_1028291 = {
    actId: '632062',
    token: '163158',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation(res.sMsg);
    }
}

function tuesdaySignIn() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }
    if($(".box1_list").children("li").eq(1).attr('class') == 'box1_btn_gray3'){
        warningInformation('您已领取');
    }else{
        Milo.emit(flow_1028291);
    }
}

// 周三签到
var flow_1028290 = {
    actId: '632062',
    token: '1bdad0',
    sData: {
    },
    success: function (res) {
        console.log(res);
        // 奖励到账提示
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation(res.sMsg);
    }
}

function wednesdaySignIn() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }
    if($(".box1_list").children("li").eq(2).attr('class') == 'box1_btn_gray3'){
        warningInformation('您已领取');
    }else{
        Milo.emit(flow_1028290);
    }
}


// 周四签到
var flow_1028289 = {
    actId: '632062',
    token: '1ada7c',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation(res.sMsg);
    }
}


function thursdaySignIn() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }
    if($(".box1_list").children("li").eq(3).attr('class') == 'box1_btn_gray3'){
        warningInformation('您已领取');
    }else{
        Milo.emit(flow_1028289);
    }
}

// 周五签到
var flow_1028288 = {
    actId: '632062',
    token: '173592',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation(res.sMsg);
    }
}


function fridaySignIn() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }
    if($(".box1_list").children("li").eq(4).attr('class') == 'box1_btn_gray3'){
        warningInformation('您已领取');
    }else{
        Milo.emit(flow_1028288);
    }
}


// 周六签到
var flow_1028287 = {
    actId: '632062',
    token: '5f83ec',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation(res.sMsg);
    }
}

function saturdaySignIn() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }
    if($(".box1_list").children("li").eq(5).attr('class') == 'box1_btn_gray3'){
        warningInformation('您已领取');
    }else{
        Milo.emit(flow_1028287);
    }
}


// 周日签到
var flow_1028286 = {
    actId: '632062',
    token: 'c313b3',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation(res.sMsg);
    }
}

function sundaySignIn() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }
    if($(".box1_list").children("li").eq(6).attr('class') == 'box1_btn_gray3'){
        warningInformation('您已领取');
    }else{
        Milo.emit(flow_1028286);
    }
}

// 周补签
function weekSignatureRepeat(number) {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        var flow_1028285 = {
            actId: '632062',
            token: '0f71c8',
            sData: {
                number: number,
                // witchDay:weekDay
            },
            success: function (res) {
                console.log(res);
                getPrize(res.sMsg);
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation('您的补签次数不足,每周登录3次游戏可获得一次补签机会');
            }
        }
        Milo.emit(flow_1028285);
    }
}


// 月签5
var flow_1028380 = {
    actId: '632062',
    token: 'f73cdc',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation('您的签到天数不足！');
    }
}

function monthSignInFive() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        if($(".box2_list").children("li").eq(0).attr('class') == 'one'){
            warningInformation('您已领取');
        }else{
            Milo.emit(flow_1028380);
        }
    }
}

// 月签10
var flow_1028379 = {
    actId: '632062',
    token: 'df417e',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation('您的签到天数不足！');
    }
}

function monthSignInTen() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        if($(".box2_list").children("li").eq(1).attr('class') == 'one'){
            warningInformation('您已领取');
        }else{
            Milo.emit(flow_1028379);
        }
    }
}

// 月签15
var flow_1028378 = {
    actId: '632062',
    token: 'd27918',
    sData: {
    },
    success: function (res) {
        console.log(res);
        getPrize(res.sMsg);
    },
    fail: function (res) {
        if (res.iRet == 101) {
            //todo 登录态失效，需要重新调登录方法 （开发自行实现）
            login_QQ();
        } else if (res.iRet == 99998) {
            // todo 调用提交绑定大区方法
            commitBindArea();
        }
        console.log(res);
        warningInformation('您的签到天数不足！');
    }
}

function monthSignInFifteen() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        if($(".box2_list").children("li").eq(2).attr('class') == 'one'){
            warningInformation('您已领取');
        }else{
            Milo.emit(flow_1028378);
        }
    }
}


function checkMonthSignInTwenty(){
    TGDialogS('pop4_1');
}

// 月签20
function monthSignInTwenty() {
    // 检查登录
    if(!isLogin){
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        if(monthSignIn < 20){
            warningInformation('您的签到天数不足！');
            return;
        }
        var giftPackId = $(".cn4_list.cn4_list1 .on").attr("arrtype");
        var flow_1028377 = {
            actId: '632062',
            token: 'c2a528',
            sData: {
                giftPackId:giftPackId
            },
            success: function (res) {
                console.log(res);
                getPrize(res.sMsg);
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation(res.sMsg);
            }
        }
        Milo.emit(flow_1028377);
    }
}

function checkMonthSignInTwentyFive(){
    TGDialogS('pop4_2');
}


// 月签25
function monthSignInTwentyFive() {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        if(monthSignIn < 25){
            warningInformation('您的签到天数不足！');
            return;
        }
        var giftPackId = $(".cn4_list.cn4_list2 .on").attr("arrtype");
        var flow_1028376 = {
            actId: '632062',
            token: '86f9d1',
            sData: {
                giftPackId:giftPackId
            },
            success: function (res) {
                console.log(res);
                getPrize(res.sMsg);
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation(res.sMsg);
            }
        }
        Milo.emit(flow_1028376);
    }
}

// 任务1
function taskOne(convenient = false) {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        var flow_1028557 = {
            actId: '632062',
            token: '85901a',
            sData: {
            },
            success: function (res) {
                console.log(res);
                if(convenient){
                    htmlPrompt += res.sMsg + '<br />';
                    arr.shift();
                    if(arr.length == 0){
                        allGiftShow(htmlPrompt);
                    }else{
                        $('#'+arr[0]).click(eval(func[arr[0]]));
                    }
                }else{
                    getPrize(res.sMsg);
                }
                console.log('one su');
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation(res.sMsg);
                console.log('one fa');
            }
        }
        Milo.emit(flow_1028557);
    }
}

// 任务2
function taskTwo(convenient = false) {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        var flow_1028556 = {
            actId: '632062',
            token: '15b63b',
            sData: {
            },
            success: function (res) {
                console.log(res);
                if(convenient){
                    htmlPrompt += res.sMsg + '<br />';
                    arr.shift();
                    if(arr.length == 0){
                        allGiftShow(htmlPrompt);
                    }else{
                        $('#'+arr[0]).click(eval(func[arr[0]]));
                    }
                }else{
                    getPrize(res.sMsg);
                }
                console.log('two su');
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation(res.sMsg);
                console.log('two fa');
            }
        }
        Milo.emit(flow_1028556);
    }
}
// 任务3
function taskTThress(convenient = false) {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        var flow_1028555 = {
            actId: '632062',
            token: 'cd52ac',
            sData: {
            },
            success: function (res) {
                console.log(res);
                if(convenient){
                    htmlPrompt += res.sMsg + '<br />';
                    arr.shift();
                    if(arr.length == 0){
                        allGiftShow(htmlPrompt);
                    }else{
                        $('#'+arr[0]).click(eval(func[arr[0]]));
                    }
                }else{
                    getPrize(res.sMsg);
                }
                console.log('three su');
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation(res.sMsg);
                console.log('three fa');
            }
        }
        Milo.emit(flow_1028555);
    }
}
// 任务4
function taskFour(convenient = false) {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        var flow_1028554 = {
            actId: '632062',
            token: '4ff297',
            sData: {
            },
            success: function (res) {
                console.log(res);
                if(convenient){
                    htmlPrompt += res.sMsg + '<br />';
                    arr.shift();
                    if(arr.length == 0){
                        allGiftShow(htmlPrompt);
                    }else{
                        $('#'+arr[0]).click(eval(func[arr[0]]));
                    }
                }else{
                    getPrize(res.sMsg);
                }
                console.log('four su');
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation(res.sMsg);
                console.log('four fa');
            }
        }
        Milo.emit(flow_1028554);
    }
}
// 任务5
function taskFive(convenient = false) {
    if(!isLogin){
        // 检查登录
        login_QQ();
        return;
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
        return;
    }else{
        var flow_1028553 = {
            actId: '632062',
            token: '66fee0',
            sData: {
            },
            success: function (res) {
                console.log(res);
                if(convenient){
                    htmlPrompt += res.sMsg + '<br />';
                    arr.shift();
                    if(arr.length == 0){
                        allGiftShow(htmlPrompt);
                    }else{
                        $('#'+arr[0]).click(eval(func[arr[0]]));
                    }
                }else{
                    getPrize(res.sMsg);
                }
                console.log('five su');
            },
            fail: function (res) {
                if (res.iRet == 101) {
                    //todo 登录态失效，需要重新调登录方法 （开发自行实现）
                    login_QQ();
                } else if (res.iRet == 99998) {
                    // todo 调用提交绑定大区方法
                    commitBindArea();
                }
                console.log(res);
                warningInformation(res.sMsg);
                console.log('five fa');
            }
        }
        Milo.emit(flow_1028553);
    }
}

// 一键领取
function convenientDo(){
    if(!isLogin){
        // 检查登录
        login_QQ();
    }else if(!isArea){
        // 提交绑定大区
        commitBindArea();
    }
    // 根据按钮的状态（去触发这个函数） 开始回调函数
    if(isLogin && isArea){
        arr = new Array();
        $.each($('a[do="cando"]'),function(){
            arr.push($(this).attr('id'));
        });
        console.log("一键领取arr"+arr);
        if(arr.length == 0){
            warningInformation('未完成任务，请完成任务后再来领取');
        }else{
            if(arr.length > 1){
                muchAndLess = 1; 
            }
            // 开始回调
            // 根据id来点击出发函数
            func['box3_btn_gray_show0'] = 'taskOne(true)';
            func['box3_btn_gray_show1'] = 'taskTwo(true)';
            func['box3_btn_gray_show2'] = 'taskTThress(true)';
            func['box3_btn_gray_show3'] = 'taskFour(true)';
            func['box3_btn_gray_show4'] = 'taskFive(true)';
            $('#'+arr[0]).click(eval(func[arr[0]])); // 触发 字符串变成函数
        }
    }
}


//得到父页面的url信息
function getParentUrl() {
    let url = window.location.href;
    if (parent !== window) {
        try {
            //返回href
            url = parent.location.href;
        } catch (e) {
            url = document.referrer;
        }
    }
    return url;
}
//输入值直接获取相应url参数的值
function GetUrlValue(url, pa){ 
	var url = url.replace(/#+.*$/, ''),
		params = url.substring(url.indexOf("?")+1,url.length).split("&"),
		param = {} ;
	for (var i=0; i<params.length; i++){  
		var pos = params[i].indexOf('='),//查找name=value  
			key = params[i].substring(0,pos),
			val = params[i].substring(pos+1);//提取value 
		param[key] = val;
	} 
	return (typeof(param[pa])=="undefined") ? "" : param[pa];
}

// url里获取角色信息
function bindAreaInClient() {
    var area = GetUrlValue(getParentUrl(), "areaId");
    Milo.getRoleInfo({
        gameId: "speed",
        areaObj:{
            area:area,
            platid:'',
            partition: ''
        },
        success: function (res) {
            selectedRole = res.data[0];
            // selectedRole 是通过Milo.getRoleInfo() 方法获取到的角色信息，相关方法请参考（https://ide.qq.com/milo/sdk/guide/getRoleInfo.html）
            var roleData = {
                sRoleId: selectedRole.roleId,
                sRoleName: selectedRole.roleName,
                sArea: selectedRole.area,
                sPartition: selectedRole.partition,
                sMd5str: selectedRole.md5str,
                sCheckparam: selectedRole.checkparam,
                roleSex: selectedRole.roleSex,
                roleJob: selectedRole.roleJob,
                sAreaName: selectedRole.sAreaName,
            }

            if (selectedRole.platid) {
                roleData.sPlatId = selectedRole.platid
            }

            //对角色名称encode 2次，配合后端
            roleData.sRoleName = encodeURI(encodeURI(roleData.sRoleName));
            var flow_commit = {
                actId: '632062',
                token: 'b1be18',
                iAreaChooseType: 2,
                autoCommitAreaInfo : true,
                sData: {
                    query: false
                },
                success: function (res) {
                    console.log('1');
                    if (res.data) {
                        console.log('2');
                        $("#milo-binded").show();
                        $("#milo-unbind").hide();
                        if (!res.data.areaName) {
                            if (res.data.area == 1) {
                                $("#milo-areaName").text("电信区");
                            } else {
                                $("#milo-areaName").text("联通区");
                            }
                        } else {
                            $("#milo-areaName").text(res.data.areaName);
                        }

                        $("#milo-roleName").text(res.data.roleName);
                        //调初始化

                        isArea = true;
                        queryBindArea(); 
                    }
                },
                fail: function (res) {
                    console.log("22"+res.sMsg);
                    if(res.iRet === -9998 || res.iRet === "-9998"){
                        return;
                    }
                    $("#milo-binded").hide();
                    $("#milo-unbind").show();
                }
            }
            Object.assign(flow_commit.sData, roleData);
            Milo.emit(flow_commit);
        },
        fail: function (res) {
        }
    });
}