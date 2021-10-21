const $ = new Env('双十一热爱环游记自动收金币');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const pKHelpFlag = true;//是否PK助力  true 助力，false 不助力
const pKHelpAuthorFlag = true;//是否助力作者PK  true 助力，false 不助力
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [];
$.cookie = '';
$.inviteList = [];
$.pkInviteList = [];
$.secretpInfo = {};
$.innerPkInviteList = [];
if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
    };
} else {
    cookiesArr = [
        $.getdata("CookieJD"),
        $.getdata("CookieJD2"),
        ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
        return;
    }
    for (let i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            $.cookie = cookiesArr[i];
            $.UserName = decodeURIComponent($.cookie.match(/pt_pin=([^; ]+)(?=;?)/) && $.cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.index = i + 1;
            $.isLogin = true;
            $.nickName = $.UserName;
            $.hotFlag = false; //是否火爆
            //await TotalBean();
            console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
            console.log(`\n如有未完成的任务，请多执行几次\n`);
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
                if ($.isNode()) {
                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                }
                continue
            }
            await zoo();
            if ($.hotFlag) $.secretpInfo[$.UserName] = false;//火爆账号不执行助力
        }
    }
})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })

async function zoo() {
    try {
        $.signSingle = {};
        $.homeData = {};
        $.secretp = ``;
        $.taskList = [];
        $.lotteryTaskVos = [];
        $.shopSign = ``;

        $.token = ``;
        await getToken();
        if ($.token === ``) {
            console.log(`获取token失败`);
            return;
        }
        await $.wait(1000);
        await takePostRequest('travel_getHomeData');
        $.userInfo = $.homeData.result.homeMainInfo
        // console.log(`\n\n当前分红：${$.userInfo.raiseInfo.redNum}份，当前等级:${$.userInfo.raiseInfo.scoreLevel}\n当前金币${$.userInfo.raiseInfo.remainScore}，下一关需要${$.userInfo.raiseInfo.nextLevelScore - $.userInfo.raiseInfo.curLevelStartScore}\n\n`);
        await $.wait(1000);
        let produceResult = $.homeData.result.homeMainInfo.produceResult;
        if (produceResult.produceScore > 0) {
            console.log(`自动收集金币：${produceResult.produceScore}`);
            await takePostRequest('travel_collectAtuoScore');
        }
    } catch (e) {
        $.logErr(e)
    }
}

async function takePostRequest(type) {
    let body = ``;
    let myRequest = ``;
    switch (type) {
        case 'travel_getHomeData':
            body = `functionId=travel_getHomeData&body={}&client=wh5&clientVersion=1.0.0`;
            myRequest = await getPostRequest(`travel_getHomeData`, body);
            break;
        case 'travel_getTaskDetail':
            body = `functionId=travel_getTaskDetail&body={}&client=wh5&clientVersion=1.0.0`;
            myRequest = await getPostRequest(`travel_getTaskDetail`, body);
            break;
        case 'travel_collectScore':
            body = getBody(type);
            //console.log(body);
            myRequest = await getPostRequest(`travel_collectScore`, body);
            break;
        case 'travel_getBadgeAward':
            body = getBody(type);
            myRequest = await getPostRequest(`travel_getBadgeAward`, body);
            break;
        case 'help':
            body = getBody(type);
            myRequest = await getPostRequest(`travel_collectScore`, body);
            break;
        case 'travel_raise':
            body = getBody(type);
            myRequest = await getPostRequest(`travel_raise`, body);
            break;
        case 'travel_collectAtuoScore':
            body = getBody(type);
            myRequest = await getPostRequest(`travel_collectAtuoScore`, body);
            break;
        default:
            console.log(`错误${type}`);
    }
    return new Promise(async resolve => {
        $.post(myRequest, (err, resp, data) => {
            try {
                //console.log(data);
                dealReturn(type, data);
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

async function getToken() {
    let config = {
        url: 'https://api.m.jd.com/client.action',
        body: 'functionId=isvObfuscator&body=%7B%22id%22%3A%22%22%2C%22url%22%3A%22https%3A%2F%2Fddsj-dz.isvjcloud.com%22%7D&uuid=5162ca82aed35fc52e8&client=apple&clientVersion=10.0.10&st=1631884203742&sv=112&sign=fd40dc1c65d20881d92afe96c4aec3d0',
        headers: {
            'Host': 'api.m.jd.com',
            'accept': '*/*',
            'user-agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
            'accept-language': 'zh-Hans-JP;q=1, en-JP;q=0.9, zh-Hant-TW;q=0.8, ja-JP;q=0.7, en-US;q=0.6',
            'content-type': 'application/x-www-form-urlencoded',
            'Cookie': $.cookie
        }
    }
    return new Promise(resolve => {
        $.post(config, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    $.token = data['token']
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

async function dealReturn(type, data) {
    try {
        data = JSON.parse(data);
    } catch (e) {
        console.log(`返回异常：${data}`);
        return;
    }
    switch (type) {
        case 'travel_getHomeData':
            if (data.code === 0) {
                if (data.data['bizCode'] === 0) {
                    $.homeData = data.data;
                    $.secretp = data.data.result.homeMainInfo.secretp;
                    $.secretpInfo[$.UserName] = $.secretp;
                }
            }
            break;
        case 'travel_getTaskDetail':
            if (data.code === 0) {
                console.log(`互助码：${data.data.result.inviteId || '助力已满，获取助力码失败'}`);
                if (data.data.result.inviteId) {
                    $.inviteList.push({
                        'ues': $.UserName,
                        'secretp': $.secretp,
                        'inviteId': data.data.result.inviteId,
                        'max': false
                    });
                }
                $.taskList = data.data.result.taskVos;
                $.lotteryTaskVos = data.data.result.lotteryTaskVos;
            }
            break;
        case 'travel_collectScore':
            $.callbackInfo = data;
            break;
        case 'travel_getBadgeAward':
            if (data.code === 0 && data.data.bizCode === 0) {
                console.log(`领取成功`);
            } else {
                console.log(`领取失败`);
                console.log(data);
            }
            break;
        case 'help':
            //console.log(data);
            switch (data.data.bizCode) {
                case 0:
                    console.log(`助力成功`);
                    break;
                case -201:
                    console.log(`助力已满`);
                    $.oneInviteInfo.max = true;
                    break;
                case -202:
                    console.log(`已助力`);
                    break;
                case -8:
                    console.log(`已经助力过该队伍`);
                    break;
                case -6:
                case 108:
                    console.log(`助力次数已用光`);
                    $.canHelp = false;
                    break;
                default:
                    console.log(`助力失败：${JSON.stringify(data)}`);
            }
            break;
        case 'travel_raise':
            if (data.code === 0) console.log(`升级成功`);
            break;
        case 'travel_collectAtuoScore':
            if (data.code === 0 && data.data.bizCode === 0) {
                console.log(`领取成功`);
            } else {
                console.log(`领取失败`);
                console.log(data);
            }
            break;
        default:
            console.log(`未判断的异常${type}`);
    }
}

function takeGetRequest() {
    return new Promise(async resolve => {
        $.get({
            url: `https://ms.jr.jd.com/gw/generic/mission/h5/m/finishReadMission?reqData={%22missionId%22:%22${$.taskId}%22,%22readTime%22:8}`,
            headers: {
                'Origin': `https://prodev.m.jd.com`,
                'Cookie': $.cookie,
                'Connection': `keep-alive`,
                'Accept': `*/*`,
                'Referer': `https://prodev.m.jd.com`,
                'Host': `ms.jr.jd.com`,
                'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                'Accept-Encoding': `gzip, deflate, br`,
                'Accept-Language': `zh-cn`
            }
        }, (err, resp, data) => {
            try {
                data = JSON.parse(data);
                if (data.resultCode === 0) {
                    console.log(`任务完成`);
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

//领取奖励
function callbackResult(info) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api.m.jd.com/?functionId=qryViewkitCallbackResult&client=wh5&clientVersion=1.0.0&body=${info}&_timestamp=` + Date.now(),
            headers: {
                'Origin': `https://bunearth.m.jd.com`,
                'Cookie': $.cookie,
                'Connection': `keep-alive`,
                'Accept': `*/*`,
                'Host': `api.m.jd.com`,
                'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                'Accept-Encoding': `gzip, deflate, br`,
                'Accept-Language': `zh-cn`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://bunearth.m.jd.com'
            }
        }

        $.get(url, async (err, resp, data) => {
            try {
                data = JSON.parse(data);
                console.log(data.toast.subTitle)
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve()
            }
        })
    })
}

async function getPostRequest(type, body) {
    let url = `https://api.m.jd.com/client.action?functionId=${type}`;
    if (type === 'listTask' || type === 'acceptTask') {
        url = `https://ms.jr.jd.com/gw/generic/hy/h5/m/${type}`;
    }
    const method = `POST`;
    const headers = {
        'Accept': `application/json, text/plain, */*`,
        'Origin': `https://wbbny.m.jd.com`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Cookie': $.cookie,
        'Content-Type': `application/x-www-form-urlencoded`,
        'Host': `api.m.jd.com`,
        'Connection': `keep-alive`,
        'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        'Referer': `https://wbbny.m.jd.com`,
        'Accept-Language': `zh-cn`
    };
    return {url: url, method: method, headers: headers, body: body};
}

function getBody(type) {
    let rnd = Math.floor(1e6 + 9e6 * Math.random()).toString()
    let ss = JSON.stringify({
        "extraData": {"log": "-1", "sceneid": "QD216hPageh5"},
        "secretp": $.secretp,
        "random": rnd.toString()
    });
    let taskBody = '';
    if (type === 'help') {
        taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({
            "taskId": 2,
            "inviteId": $.inviteId,
            "actionType": 1,
            "ss": ss
        })}&client=wh5&clientVersion=1.0.0`
    } else if (type === 'pkHelp') {
        taskBody = `functionId=zoo_pk_assistGroup&body=${JSON.stringify({
            "confirmFlag": 1,
            "inviteId": $.pkInviteId,
            "ss": ss
        })}&client=wh5&clientVersion=1.0.0`;
    } else if (type === 'zoo_collectProduceScore') {
        taskBody = `functionId=zoo_collectProduceScore&body=${JSON.stringify({"ss": ss})}&client=wh5&clientVersion=1.0.0`;
    } else if (type === 'zoo_getWelfareScore') {
        taskBody = `functionId=zoo_getWelfareScore&body=${JSON.stringify({
            "type": 2,
            "currentScence": $.currentScence,
            "ss": ss
        })}&client=wh5&clientVersion=1.0.0`;
    } else if (type === 'add_car') {
        taskBody = `functionId=zoo_collectScore&body=${JSON.stringify({
            "taskId": $.taskId,
            "taskToken": $.taskToken,
            "actionType": 1,
            "ss": ss
        })}&client=wh5&clientVersion=1.0.0`
    } else if (type === 'travel_getBadgeAward') {
        taskBody = `functionId=travel_getBadgeAward&body=${JSON.stringify({
            "awardToken": $.badgeAward.awardToken,
        })}&client=wh5&clientVersion=1.0.0`
    } else if (type === 'travel_raise') {
        taskBody = `functionId=${type}&body=${JSON.stringify({
            "ss": ss
        })}&client=wh5&clientVersion=1.0.0`
    } else if (type === 'travel_collectAtuoScore') {
        taskBody = `functionId=${type}&body=${JSON.stringify({
            "ss": ss
        })}&client=wh5&clientVersion=1.0.0`
    } else {
        taskBody = `functionId=${type}&body=${JSON.stringify({
            "taskId": $.oneTask.taskId,
            "actionType": 1,
            "taskToken": $.oneActivityInfo.taskToken,
            "ss": ss
        })}&client=wh5&clientVersion=1.0.0`
    }
    return taskBody
}

/**
 * 随机从一数组里面取
 * @param arr
 * @param count
 * @returns {Buffer}
 */
function getRandomArrayElements(arr, count) {
    var shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

function getAuthorShareCode(url = "http://cdn.annnibb.me/eb6fdc36b281b7d5eabf33396c2683a2.json") {
    return new Promise(async resolve => {
        const options = {
            "url": `${url}?${new Date()}`,
            "timeout": 10000,
            "headers": {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
            }
        };
        if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
            const tunnel = require("tunnel");
            const agent = {
                https: tunnel.httpsOverHttp({
                    proxy: {
                        host: process.env.TG_PROXY_HOST,
                        port: process.env.TG_PROXY_PORT * 1
                    }
                })
            }
            Object.assign(options, {agent})
        }
        $.get(options, async (err, resp, data) => {
            try {
                if (err) {
                } else {
                    if (data) data = JSON.parse(data)
                }
            } catch (e) {
                // $.logErr(e, resp)
            } finally {
                resolve(data || []);
            }
        })
        await $.wait(10000)
        resolve();
    })
}

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
            headers: {
                Host: "me-api.jd.com",
                Accept: "*/*",
                Connection: "keep-alive",
                Cookie: $.cookie,
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Accept-Language": "zh-cn",
                "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
                "Accept-Encoding": "gzip, deflate, br"
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === "1001") {
                            $.isLogin = false; //cookie过期
                            return;
                        }
                        if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
                            $.nickName = data.data.userInfo.baseInfo.nickname;
                        }
                    } else {
                        $.log('京东服务器返回空数据');
                    }
                }
            } catch (e) {
                $.logErr(e)
            } finally {
                resolve();
            }
        })
    })
}

// prettier-ignore
function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);

    class s {
        constructor(t) {
            this.env = t
        }

        send(t, e = "GET") {
            t = "string" == typeof t ? {url: t} : t;
            let s = this.get;
            return "POST" === e && (s = this.post), new Promise((e, i) => {
                s.call(this, t, (t, s, r) => {
                    t ? i(t) : e(s)
                })
            })
        }

        get(t) {
            return this.send.call(this.env, t)
        }

        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }

    return new class {
        constructor(t, e) {
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`)
        }

        isNode() {
            return "undefined" != typeof module && !!module.exports
        }

        isQuanX() {
            return "undefined" != typeof $task
        }

        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }

        isLoon() {
            return "undefined" != typeof $loon
        }

        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }

        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }

        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i) try {
                s = JSON.parse(this.getdata(t))
            } catch {
            }
            return s
        }

        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }

        getScript(t) {
            return new Promise(e => {
                this.get({url: t}, (t, s, i) => e(i))
            })
        }

        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"), n = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {script_text: t, mock_type: "cron", timeout: r},
                    headers: {"X-Key": o, Accept: "*/*"}
                };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }

        loaddata() {
            if (!this.isNode()) return {};
            {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e);
                if (!s && !i) return {};
                {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }

        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }

        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i) if (r = Object(r)[t], void 0 === r) return s;
            return r
        }

        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }

        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
                if (r) try {
                    const t = JSON.parse(r);
                    e = t ? this.lodash_get(t, i, "") : e
                } catch (t) {
                    e = ""
                }
            }
            return e
        }

        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i),
                    h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
                }
            } else s = this.setval(t, e);
            return s
        }

        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }

        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }

        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }

        get(t, e = (() => {
        })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.get(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                try {
                    if (t.headers["set-cookie"]) {
                        const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                        s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
                    }
                } catch (t) {
                    this.logErr(t)
                }
            }).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => {
                const {message: s, response: i} = t;
                e(s, i, i && i.body)
            }))
        }

        post(t, e = (() => {
        })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.post(t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t)); else if (this.isNode()) {
                this.initGotEnv(t);
                const {url: s, ...i} = t;
                this.got.post(s, i).then(t => {
                    const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                    e(null, {status: s, statusCode: i, headers: r, body: o}, o)
                }, t => {
                    const {message: s, response: i} = t;
                    e(s, i, i && i.body)
                })
            }
        }

        time(t, e = null) {
            const s = e ? new Date(e) : new Date;
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        }

        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t) return t;
                if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {"open-url": t} : this.isSurge() ? {url: t} : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"];
                        return {openUrl: e, mediaUrl: s}
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl;
                        return {"open-url": e, "media-url": s}
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {url: e}
                    }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t)
            }
        }

        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }

        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }

        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }

        done(t = {}) {
            const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}