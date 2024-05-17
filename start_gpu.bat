
call ".\npm_install.bat"

:_minerstart
node send_universal_gpu.js --api tonapi --givers 10000
goto _minerstart

pause