
call ".\npm_install.bat"

:_minerstart
node send_multigpu_things.js --api tonapi --givers 10000 --gpu-count 8
goto _minerstart

pause