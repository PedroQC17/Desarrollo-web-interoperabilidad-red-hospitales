@echo off
echo ========================================
echo  Iniciando Consul - Service Registry
echo ========================================
echo.
echo UI disponible en: http://localhost:8500
echo.
consul agent -dev -ui -bind 127.0.0.1
