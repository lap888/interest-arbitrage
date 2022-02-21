echo "scp in service"
# ssh -i /Users/topbrids/cert/testbbs.pem root@101.32.178.79

scp -i /Users/topbrids/cert/testbbs.pem run.js root@101.32.178.79:/root/tb

scp -i /Users/topbrids/cert/testbbs.pem app/binanceApi.js root@101.32.178.79:/root/tb/app
scp -i /Users/topbrids/cert/testbbs.pem app/message.js root@101.32.178.79:/root/tb/app

scp -i /Users/topbrids/cert/testbbs.pem data/data.json root@101.32.178.79:/root/tb/data

scp -i /Users/topbrids/cert/testbbs.pem package.json root@101.32.178.79:/root/tb/

scp -i /Users/topbrids/cert/testbbs.pem data/runBetData.js root@101.32.178.79:/root/tb/data

scp -i /Users/topbrids/cert/testbbs.pem data/img/aelf.jpg root@101.32.178.79:/root/tb/data/img