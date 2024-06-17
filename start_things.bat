
call ".\npm_install.bat"

:_minerstart
node send_universal_things.js --api tonapi --givers 10000
goto _minerstart

pause