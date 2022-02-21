let { cf, cs, configJson, TA } = require('../app/binanceApi')
const telegram = require('telegram-bot-api') //2.0.0
const fs = require('fs');
const path = require('path');
let tgParams = { token: configJson.teleBotToken }
if (configJson.env == "dev") {
    let http_proxy = {
        host: configJson.proxyIp,
        port: configJson.proxy
    }
    tgParams.http_proxy = http_proxy
}
let tgApi = new telegram(tgParams)
let mp = new telegram.GetUpdateMessageProvider()
tgApi.setMessageProvider(mp)

const init_tg = () => {
    tgApi.start().then(() => {
        console.log('initTG API is started')
    }).catch(res => {
        console.log(res)
    })
}

const send_msg = (msg) => {
    configJson.chat_id.map(v => {
        tgApi.sendMessage({
            chat_id: v,
            text: msg,
            parse_mode: 'Markdown'
        });
    })

    console.log(`tg:${msg}`)
}

const msg_on = () => {
    tgApi.on('update', update => {
        // 处理信息逻辑
        let message = update.message
        let info = '';
        let isPrice = message.text.indexOf('price') != -1
        if (isPrice) {
            let sysbom1 = message.text.replace(/\r\n/g, "")
            let sysbom2 = sysbom1.replace("price", "").replace(/\r\n/g, "")
            let sysbom3 = sysbom2.replace(" ", "")
            cf.price({ symbol: sysbom3.toUpperCase() }).then(res => {
                if (res.status == 200) {
                    info = `symbol:${res.data.symbol}\r\nprice:${res.data.price}\r\n${TA.getDate(res.data.time)}`
                    // Send
                    tgApi.sendAnimation({
                        chat_id: message.chat.id,
                        caption: `价格通知📢\r\n${info}`,
                        animation: fs.createReadStream(path.join(__dirname, '../data/img/aelf.jpg'))
                    })
                }
            }).catch(err => {
                info = `${JSON.stringify(err)}`
                // Send
                tgApi.sendAnimation({
                    chat_id: message.chat.id,
                    caption: `异常通知😁\r\n${info}`,
                    animation: fs.createReadStream(path.join(__dirname, '../data/img/aelf.jpg'))
                })
                console.log(err)
            });
        }
    })
}
/**
 * 合约多单买入
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const buy = (symbol, quantity, price) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'BUY', 'LONG', 'MARKET', { quantity: quantity }).then(res => {
                console.log('市价,开多,买入成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('市价,开多,买入异常=>', err)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'BUY', 'LONG', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log('限价,开多,买入成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('限价,开多,买入异常=>', err)
                reject(err)
            });
        }
    });
}

/**
 * 合约多单-卖出平多
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const buy_close = (symbol, quantity, price) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'SELL', 'LONG', 'MARKET', { quantity: quantity }).then(res => {
                console.log('市价,平多,卖出成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('市价,平多,卖出异常=>', err)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'SELL', 'LONG', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log('限价,平多,卖出成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('限价,平多,卖出异常=>', err)
                reject(err)
            });
        }
    });
}

/**
 * 合约卖出开空
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const sell = (symbol, quantity, price) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'SELL', 'SHORT', 'MARKET', { quantity: quantity }).then(res => {
                console.log('市价,开空,卖出成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('市价,开空,卖出异常=>', err)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'SELL', 'SHORT', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log('限价,开空,卖出成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('限价,开空,卖出异常=>', err)
                reject(err)
            });
        }
    });
}

/**
 * 合约 空单 买入平空
 * @param {*} symbol 
 * @param {*} quantity 
 * @param {*} price 
 * @returns 
 */
const sell_close = (symbol, quantity, price) => {
    return new Promise((resolve, reject) => {
        if (price < 0) {
            cf.newOrder(symbol, 'BUY', 'SHORT', 'MARKET', { quantity: quantity }).then(res => {
                console.log('市价,平空,买入成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('市价,平空,买入异常=>', err)
                reject(err)
            });
        } else {
            cf.newOrder(symbol, 'BUY', 'SHORT', 'LIMIT', { quantity: quantity, price: price, timeInForce: 'GTC' }).then(res => {
                console.log('限价,平空,买入成功=>', res.status)
                resolve(res);
            }).catch(err => {
                console.log('限价,平空,买入异常=>', err)
                reject(err)
            });
        }
    });
}

const buy_xh = (symbol, quantity, price) => {

}

const sell_xh = (symbol, quantity, price) => {

}

module.exports = {
    buy,
    buy_close,
    sell,
    sell_close,
    buy_xh,
    sell_xh,
    init_tg,
    send_msg,
    msg_on
}