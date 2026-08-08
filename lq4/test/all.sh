#!/bin/sh
# lq4/ 直下で： sh test/all.sh
set -e
for t in build_verify audit battle_inflict gimmick ch0_tour; do
  echo "===== $t ====="
  node test/$t.js
done
echo "===== tune_umbra（実測・参考）====="
node test/tune_umbra.js 200
