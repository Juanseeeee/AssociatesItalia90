@echo off
cd /d %~dp0
echo Running test... > result.log
node test-auth-flow.js >> result.log 2>&1
echo Done. >> result.log
