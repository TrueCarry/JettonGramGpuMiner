#!/bin/bash
npm install


while true; do
  node send_multigpu_gpu.js --api tonapi --bin ./pow-miner-cuda --givers 10000 --gpu-count 8
  sleep 1;
done;
