@echo off
cd /d %~dp0
echo Running family test... > result_family.log
node test-family-flow.js >> result_family.log 2>&1
echo Done. >> result_family.log
