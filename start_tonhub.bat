
call ".\npm_install.bat"

:_minerstart
node send_tonhub.js
goto _minerstart

pause