
call ".\npm_install.bat"

:_minerstart
node send_universal.js --api tonhub --bin amd --givers 100
goto _minerstart

pause