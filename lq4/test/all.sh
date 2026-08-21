#!/bin/sh
# lq4/ 直下で： sh test/all.sh
set -e
for t in build_verify audit tiles battle_inflict gimmick gate_flow sound skills fx menu_cancel ch0_tour ch1_tour; do
  echo "===== $t ====="
  node test/$t.js
done
echo "===== tune_umbra（実測・参考）====="
node test/tune_umbra.js 200
node test/tune_oboro.js
node test/tune_ch1.js 150
