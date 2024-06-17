#!/bin/bash
npm install


while true; do
  node send_universal_gpu.js --api tonapi --bin ./pow-miner-cuda --givers 10000
  sleep 1;
done;
