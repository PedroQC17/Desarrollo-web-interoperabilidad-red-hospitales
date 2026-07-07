@echo off
echo ========================================
echo  Iniciando todos los microservicios
echo ========================================
echo.

echo [1/7] Iniciando Consul...
start "Consul" cmd /c "cd /d %~dp0infraestructura\consul && start-consul.bat"
timeout /t 3 /nobreak >nul

echo [2/7] Iniciando Config Server...
start "Config-Server" cmd /c "cd /d %~dp0infraestructura\config-server && python -m uvicorn main:app --host 0.0.0.0 --port 8888 --reload"
timeout /t 2 /nobreak >nul

echo [3/7] Iniciando Auth Service...
start "Auth-Service" cmd /c "cd /d %~dp0auth-service && python manage.py runserver 0.0.0.0:8001"
timeout /t 2 /nobreak >nul

echo [4/7] Iniciando servicios Django...
start "Pacientes" cmd /c "cd /d %~dp0pacientes-service && python manage.py runserver 0.0.0.0:8002"
timeout /t 1 /nobreak >nul
start "Medicos" cmd /c "cd /d %~dp0medicos-service && python manage.py runserver 0.0.0.0:8003"
timeout /t 1 /nobreak >nul
start "Citas" cmd /c "cd /d %~dp0citas-service && python manage.py runserver 0.0.0.0:8004"
timeout /t 1 /nobreak >nul
start "Medicamentos" cmd /c "cd /d %~dp0medicamentos-service && python manage.py runserver 0.0.0.0:8005"
timeout /t 1 /nobreak >nul
start "Facturacion" cmd /c "cd /d %~dp0facturacion-service && python manage.py runserver 0.0.0.0:8006"
timeout /t 1 /nobreak >nul
start "Soporte" cmd /c "cd /d %~dp0soporte-service && python manage.py runserver 0.0.0.0:8007"

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
echo  Servicios iniciados
echo ========================================
echo.
echo  Consul UI:       http://localhost:8500
echo  Config Server:   http://localhost:8888
echo  API Gateway:     http://localhost:8000
echo  Frontend:        http://localhost:8080
echo  Auth:            http://localhost:8001
echo  Pacientes:       http://localhost:8002
echo  Medicos:         http://localhost:8003
echo  Citas:           http://localhost:8004
echo  Medicamentos:    http://localhost:8005
echo  Facturacion:     http://localhost:8006
echo  Soporte:         http://localhost:8007
echo.
echo  Para detener, cierra las ventanas de cada servicio
pause
