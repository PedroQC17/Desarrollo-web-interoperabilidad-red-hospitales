@echo off
setlocal
cd /d %~dp0
echo ========================================
echo  Iniciando Consul - Service Registry
echo ========================================
echo.
echo UI disponible en: http://localhost:8500
echo.
if not exist data mkdir data
consul agent -dev -ui -bind 127.0.0.1 -data-dir data
