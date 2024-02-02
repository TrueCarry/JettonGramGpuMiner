
call ".\npm_install.bat"

:_minerstart
node send_multiple.js --api tonapi --givers 1000 --gpu-count 8
goto _minerstart

pause