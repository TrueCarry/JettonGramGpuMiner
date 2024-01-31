
call ".\npm_install.bat"

:_minerstart
node send_universal.js --api tonhub --bin amd
goto _minerstart

pause