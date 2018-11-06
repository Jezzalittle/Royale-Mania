set loopcount=100
:loop
start chrome http://localhost:2000
set /a loopcount=loopcount-1
if %loopcount%==0 goto exitloop
goto loop
:exitloop


