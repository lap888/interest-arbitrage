// const Future = require('./binance-futures-connector/src/future')
const { Future } = require('binance-futures-connector')

const apiKey = 'bN6n50Jjc8R50ob0qwQimgn74zCOXanRMAZbXluYDghfBnUWju59lVCD2Be4zqfQ'
const apiSecret = 'nc5DDcgE1tPPnVthi2hio63smc4eVdkhsYbnkI1GLOfslTdYElBpEZtn54SHXh4H'
const proxyIp = ''
const proxy = ''
const { Console } = require('console')
const fs = require('fs')
const output = fs.createWriteStream('./logs/out.log')
const errorOutput = fs.createWriteStream('./logs/err.log')
const logger = new Console({
    stdout: output,
    stderr: errorOutput
});
let isBuy = false;
let isIncome = false;
let blackSymbol = ['NUUSDT'];
const client = new Future(apiKey, apiSecret, { ip: proxyIp, port: proxy, logger })

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function core() {
    let posCount = 0;
    let posLong = null;
    let posShort = null;
    let time = new Date()
    let hour = time.getHours()
    let minute = time.getMinutes()
    let second = time.getSeconds()
    if ((hour == 23 || hour == 7 || hour == 15) && minute == 59 && second > 58) {
        client.account().then(account => {
            let usdtOrderAmount = account.data.totalWalletBalance / 8;
            account.data.positions.forEach((item1) => {
                if (Number(item1.positionAmt) != 0) {
                    posCount++;
                    if (Number(item1.positionAmt) > 0) {
                        posLong = item1;
                    }
                    if (Number(item1.positionAmt) < 0) {
                        posShort = item1;
                    }
                }
            });
            if (posCount < 2 && !isBuy) {
                isBuy = true;
                //获取正费率和负费率交易对
                client.premiumIndex().then(response => {
                    let symbolArr = response.data;
                    let compare = function (prop) {
                        return function (obj1, obj2) {
                            var val1 = obj1[prop];
                            var val2 = obj2[prop];
                            if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
                                val1 = Number(val1);
                                val2 = Number(val2);
                            }
                            if (val1 < val2) {
                                return 1;
                            } else if (val1 > val2) {
                                return -1;
                            } else {
                                return 0;
                            }
                        }
                    }
                    symbolArr.sort(compare("lastFundingRate"))
                    //黑名单
                    blackSymbol.map(v => {
                        let index = symbolArr.findIndex(a => a.symbol == v)
                        if (index != -1) {
                            symbolArr.splice(index, 1)
                        }
                    })
                    let fristSymbol = symbolArr[0]
                    let lastSymbol = symbolArr[symbolArr.length - 1]
                    let fristPrice = fristSymbol.markPrice;
                    let lastPrice = lastSymbol.markPrice;
                    let leverage = 20;
                    let leverage1 = 20;
                    let leverage2 = 20;
                    //确定杠杆
                    client.leverageBracket().then(res => {
                        res.data.map(v => {
                            if (v.symbol == fristSymbol.symbol) {
                                leverage1 = v.brackets[0].initialLeverage
                            }
                            if (v.symbol == lastSymbol.symbol) {
                                leverage2 = v.brackets[0].initialLeverage
                            }
                        });
                        leverage = Math.min(leverage1, leverage2);
                        //修改杠杆
                        client.leverage(fristSymbol.symbol, leverage).then(res => {
                            console.log(`1.修改杠杆:${fristSymbol.symbol},杠杆:${leverage}`);
                            client.leverage(lastSymbol.symbol, leverage).then(res => {
                                console.log(`2.修改杠杆:${lastSymbol.symbol},杠杆:${leverage}`);
                                //获取精度
                                let fQ = 3;
                                let lQ = 3;
                                client.exchangeInfo().then(exchange => {
                                    exchange.data.symbols.map((v, i) => {
                                        if (v.symbol == fristSymbol.symbol) {
                                            fQ = v.quantityPrecision;
                                        }
                                        if (v.symbol == lastSymbol.symbol) {
                                            lQ = v.quantityPrecision;
                                        }
                                    });
                                    //下单数量
                                    let fAmount = Number((usdtOrderAmount * leverage / fristPrice).toFixed(fQ));
                                    let lAmount = Number((usdtOrderAmount * leverage / lastPrice).toFixed(lQ));
                                    //正费率进空
                                    client.newOrder(fristSymbol.symbol, 'SELL', 'SHORT', 'MARKET', { quantity: fAmount }).then(res => {
                                        console.log('卖出成功1=>', res.data)
                                    }).catch(err => {
                                        console.log('卖出异常1=>', err)
                                    })
                                    //负费率进多
                                    client.newOrder(lastSymbol.symbol, 'BUY', 'LONG', 'MARKET', { quantity: lAmount }).then(res => {
                                        console.log('买入成功2=>', res.data)
                                    }).catch(err => {
                                        console.log('买入异常2=>', err)
                                    });
                                })
                            });
                        });
                    });
                }).catch(err => {
                    console.log('获取费率异常:', err)
                });
            }
        });
    } else {
        //条件达到平仓
        let runFlag = false;
        if ((hour == 23 || hour == 7 || hour == 15 || hour == 0 || hour == 8 || hour == 16)) {
            if ((minute != 59 && minute != 0) || (minute == 0 || second > 4)) {
                runFlag = true;
            }
        } else {
            runFlag = true;
        }
        if (runFlag) {
            client.account().then(account => {
                account.data.positions.forEach((item1) => {
                    if (Number(item1.positionAmt) != 0) {
                        posCount++;
                        if (Number(item1.positionAmt) > 0) {
                            posLong = item1;
                        }
                        if (Number(item1.positionAmt) < 0) {
                            posShort = item1;
                        }
                    }
                });
                //收益持平平仓
                if (posCount >= 2) {
                    let unrealizedProfit = 0;
                    let fee = 0;
                    if (posLong != null) {
                        fee += Number(posLong.positionAmt) * Number(posLong.entryPrice) * 0.01 * 0.1;
                        unrealizedProfit += Number(posLong.unrealizedProfit);
                    }
                    if (posShort != null) {
                        fee += Number(posShort.positionAmt) * Number(posShort.entryPrice) * 0.01 * 0.1 * -1;
                        unrealizedProfit += Number(posShort.unrealizedProfit);
                    }
                    if (minute % 2 == 0 && second < 1) {
                        console.log(`unrealizedProfit:${unrealizedProfit.toFixed(4)},fee:${fee}`)
                    }
                    //保本清仓
                    if (unrealizedProfit >= fee && posLong != null && posShort != null && !isIncome) {
                        isIncome = true;
                        //多单清仓
                        client.newOrder(posLong.symbol, 'SELL', 'LONG', 'MARKET', { quantity: Number(posLong.positionAmt) }).then(res => {
                            console.log('多单清仓成功1=>', res.data)
                        }).catch(err => {
                            console.log('多单清仓异常1=>', err)
                        })
                        //空单清仓
                        client.newOrder(posShort.symbol, 'BUY', 'SHORT', 'MARKET', { quantity: -Number(posShort.positionAmt) }).then(res => {
                            console.log('空单清仓成功2=>', res.data);
                            isIncome = false;
                            isBuy = false;
                        }).catch(err => {
                            console.log('空单清仓异常2=>', err)
                        });
                    }
                }
            });
        }
    }
}

async function main() {
    try {
        while (true) {
            core()
            await sleep(200)
        }
    } catch (err) {
        console.log('系统异常:', err)
    }
}
main()
