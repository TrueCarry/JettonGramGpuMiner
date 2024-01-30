
call ".\npm_install.bat"

:_minerstart
node send.js
goto _minerstart

pause