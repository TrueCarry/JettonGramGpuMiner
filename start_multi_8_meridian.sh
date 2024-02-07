#!/bin/bash
npm install


while true; do
  node send_multigpu_meridian.js --api tonapi --bin ./pow-miner-cuda --givers 1000 --gpu-count 8
  sleep 1;
done;
