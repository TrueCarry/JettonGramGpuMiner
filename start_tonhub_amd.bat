
call ".\npm_install.bat"

:_minerstart
node send_tonhub_amd.js
goto _minerstart

pause