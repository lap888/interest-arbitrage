#### 币安交易所-资金费率套利【node】：
`原理如下`
1. 自动寻找币安交易所 正负费率 最大的交易对

2. 在每天 0点，早8点，16点，资金费率结算的前一秒，进行对冲开单建仓

3. 资金费率结算完成后，当多空浮盈覆盖手续费后，清仓

4. 策略可定制【vx:wkc19891】