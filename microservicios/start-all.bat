@echo off
title Microservicios - Red Hospitalaria
echo ========================================
echo  Iniciando microservicios (3 MS + auth)
echo ========================================
echo.
echo Los logs de cada servicio se guardaran en la carpeta logs\
if not exist "%~dp0logs" mkdir "%~dp0logs"

echo [1/7] Iniciando Consul...
start "Consul" cmd /c "cd /d %~dp0infraestructura\consul && start-consul.bat"
timeout /t 3 /nobreak >nul

echo [2/7] Iniciando Config Server...
start "Config-Server" cmd /c "cd /d %~dp0infraestructura\config-server && python -m uvicorn main:app --host 0.0.0.0 --port 8888 --reload"
timeout /t 2 /nobreak >nul

echo [3/7] Ejecutando migraciones e iniciando Auth Service (puerto 8001)...
start "Auth" cmd /c "cd /d %~dp0auth-service && python manage.py migrate && python manage.py runserver 8001"
timeout /t 2 /nobreak >nul

echo [4/7] Iniciando servicios Django...
start "Pacientes" cmd /c "cd /d %~dp0pacientes-service && python manage.py migrate && python manage.py runserver 8002"
timeout /t 1 /nobreak >nul
start "Citas" cmd /c "cd /d %~dp0citas-service && python manage.py migrate && python manage.py runserver 8003"
timeout /t 1 /nobreak >nul
start "Medicamentos" cmd /c "cd /d %~dp0medicamentos-service && python manage.py migrate && python manage.py runserver 8005"
timeout /t 3 /nobreak >nul

echo [5/7] Iniciando API Gateway...
start "Gateway" cmd /c "cd /d %~dp0infraestructura\gateway && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul

echo [6/7] Iniciando Frontend...
start "Frontend" cmd /c "cd /d %~dp0..\frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo [7/7] Inicializando servicios...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  Todos los servicios iniciados
echo ========================================
echo.
echo  Consul UI:       http://localhost:8500
echo  Config Server:   http://localhost:8888
echo  API Gateway:     http://localhost:8000
echo  Frontend:        http://localhost:8080
echo  Auth:            http://localhost:8001
echo  Pacientes:       http://localhost:8002
echo  Citas:           http://localhost:8003
echo  Medicamentos:    http://localhost:8005
echo.
echo  Logs en:         %~dp0logs\
echo.
echo  Para detener todos los servicios: cierra esta ventana
echo  o ejecuta stop-all.bat
pause
