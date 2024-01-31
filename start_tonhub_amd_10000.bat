
call ".\npm_install.bat"

:_minerstart
node send_tonhub_amd.js --givers 10000
goto _minerstart

pause