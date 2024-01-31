#!/bin/bash
npm install


while true; do
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 0 & 
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 1 & 
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 2 & 
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 3 & 
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 4 & 
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 5 & 
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 6 & 
  node send_universal.js --api tonhub --bin ./pow-miner-cuda --gpu 7
  sleep 1;
done;
