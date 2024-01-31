
call ".\npm_install.bat"

:_minerstart
node send_tonhub.js --givers 100
goto _minerstart

pause