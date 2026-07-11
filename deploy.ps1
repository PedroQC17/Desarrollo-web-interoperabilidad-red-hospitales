# deploy.ps1 — Build + Deploy a Kubernetes (Docker Desktop)
Write-Host "=== Build de imágenes ===" -ForegroundColor Cyan

docker build -t auth-service:latest -f microservicios/auth-service/Dockerfile microservicios/auth-service
if ($LASTEXITCODE -ne 0) { Write-Host "Error en auth-service" -ForegroundColor Red; exit 1 }

docker build -t pacientes-service:latest -f microservicios/pacientes-service/Dockerfile microservicios/pacientes-service
if ($LASTEXITCODE -ne 0) { Write-Host "Error en pacientes-service" -ForegroundColor Red; exit 1 }

docker build -t citas-service:latest -f microservicios/citas-service/Dockerfile microservicios/citas-service
if ($LASTEXITCODE -ne 0) { Write-Host "Error en citas-service" -ForegroundColor Red; exit 1 }

docker build -t medicamentos-service:latest -f microservicios/medicamentos-service/Dockerfile microservicios/medicamentos-service
if ($LASTEXITCODE -ne 0) { Write-Host "Error en medicamentos-service" -ForegroundColor Red; exit 1 }

docker build -t config-server:latest -f microservicios/infraestructura/config-server/Dockerfile microservicios/infraestructura/config-server
if ($LASTEXITCODE -ne 0) { Write-Host "Error en config-server" -ForegroundColor Red; exit 1 }

docker build -t gateway:latest -f microservicios/infraestructura/gateway/Dockerfile microservicios/infraestructura/gateway
if ($LASTEXITCODE -ne 0) { Write-Host "Error en gateway" -ForegroundColor Red; exit 1 }

docker build -t frontend:latest -f frontend/Dockerfile frontend
if ($LASTEXITCODE -ne 0) { Write-Host "Error en frontend" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Desplegando en Kubernetes ===" -ForegroundColor Cyan
kubectl apply -f k8s/

Write-Host "`n=== Esperando pods... ===" -ForegroundColor Cyan
Start-Sleep -Seconds 30
kubectl get pods -n red-hospital

Write-Host "`n=== Comandos para la presentación ===" -ForegroundColor Green
Write-Host "kubectl get all -n red-hospital"
Write-Host "kubectl scale deployment auth-service --replicas=3 -n red-hospital"
Write-Host "kubectl get pods -n red-hospital -w"
Write-Host "`n=== Para acceder a la app ===" -ForegroundColor Yellow
Write-Host "kubectl port-forward -n red-hospital svc/gateway-service 8000:8000"
Write-Host "http://localhost:8000/health"
Write-Host "`n¡Despliegue completado!" -ForegroundColor Green
