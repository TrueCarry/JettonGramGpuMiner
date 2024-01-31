
call ".\npm_install.bat"

:_minerstart
node send_tonhub_amd.js --givers 100
goto _minerstart

pause