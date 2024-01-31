
call ".\npm_install.bat"

:_minerstart
node send_tonhub.js --givers 1000
goto _minerstart

pause