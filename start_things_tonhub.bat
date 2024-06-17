
call ".\npm_install.bat"

:_minerstart
node send_universal_things.js --api tonhub --givers 10000
goto _minerstart

pause