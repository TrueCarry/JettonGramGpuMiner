
call ".\npm_install.bat"

:_minerstart
node send_universal.js --api tonhub
goto _minerstart

pause