@echo off

for /F "tokens=*" %%I in (run_config.ini) do set %%I

set "LOG="
if "%USE_LOG%"=="Y" (
  set "LOG=-l %LOG_FILE%"
)

title GPU %GPU_ID% OpenCL log=%USE_LOG%

echo on
:_minerstart
tonlib-opencl-cli.exe -V
tonlib-opencl-cli.exe -v 3 -C %CONFIG_FILE% -e "pminer start %GIVER_ADDR% %MY_ADDR% %GPU_ID% %BOOST_FACTOR% %GPU_PLATFORM_ID%" %LOG%
goto _minerstart

pause

