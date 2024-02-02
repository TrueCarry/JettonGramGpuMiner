
call ".\npm_install.bat"

:_minerstart
node send_universal.js --api tonapi
goto _minerstart

pause