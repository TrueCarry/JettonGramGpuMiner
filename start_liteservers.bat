
call ".\npm_install.bat"

:_minerstart
node send_universal.js --api lite
goto _minerstart

pause