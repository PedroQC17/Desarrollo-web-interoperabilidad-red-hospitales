param(
    [switch]$InstallDeps = $false
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando microservicios (3 MS + auth)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Instalar dependencias ────────────────────────
Write-Host "[0/7] Verificando dependencias..." -ForegroundColor Yellow
$deps = @(
    @{Pkg="django"; Mod="django"},
    @{Pkg="djangorestframework"; Mod="rest_framework"},
    @{Pkg="django-cors-headers"; Mod="corsheaders"},
    @{Pkg="httpx"; Mod="httpx"},
    @{Pkg="python-consul2"; Mod="consul"},
    @{Pkg="pyyaml"; Mod="yaml"},
    @{Pkg="fastapi"; Mod="fastapi"},
    @{Pkg="uvicorn"; Mod="uvicorn"},
    @{Pkg="pyjwt"; Mod="jwt"}
)
foreach ($dep in $deps) {
    $installed = python -c "import $($dep.Mod)" 2>&1 | Out-Null
    if (-not $?) {
        Write-Host "  Instalando $($dep.Pkg)..." -ForegroundColor Gray
        pip install $dep.Pkg 2>&1 | Out-Null
    }
}
Write-Host "  Dependencias listas." -ForegroundColor Green

# ── 1. Consul ────────────────────────────────────────
Write-Host "[1/7] Iniciando Consul (puerto 8500)..." -ForegroundColor Yellow
$ConsulJob = Start-Job -ScriptBlock {
    param($dir)
    $log = Join-Path $dir "logs\consul.log"
    $consul = Join-Path $dir "infraestructura\consul\consul.exe"
    $dataDir = Join-Path $dir "infraestructura\consul\data"
    New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
    & $consul agent -dev -ui -bind 127.0.0.1 -data-dir $dataDir 2>&1 | Out-File $log
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Consul falló. Revisa $log" -ForegroundColor Red
    }
} -ArgumentList $Root
Start-Sleep -Seconds 4

# ── 2. Config Server ─────────────────────────────────
Write-Host "[2/7] Iniciando Config Server (puerto 8888)..." -ForegroundColor Yellow
$ConfigJob = Start-Job -ScriptBlock {
    param($dir)
    $log = Join-Path $dir "logs\config-server.log"
    Set-Location (Join-Path $dir "infraestructura\config-server")
    python -m uvicorn main:app --host 0.0.0.0 --port 8888 --reload 2>&1 | Out-File $log
} -ArgumentList $Root
Start-Sleep -Seconds 2

# ── 3. Auth Service ──────────────────────────────────
Write-Host "[3/7] Iniciando Auth Service (puerto 8001)..." -ForegroundColor Yellow
$AuthJob = Start-Job -ScriptBlock {
    param($d, $logDir)
    $log = Join-Path $logDir "auth.log"
    Set-Location $d
    python manage.py runserver 8001 *>&1 | Out-File $log
} -ArgumentList (Join-Path $Root "auth-service"), $LogDir

# ── 4. Microservicios Django ─────────────────────────
Write-Host "[4/7] Iniciando servicios Django..." -ForegroundColor Yellow

# Pacientes Service
$PacientesJob = Start-Job -ScriptBlock {
    param($d, $logDir)
    $log = Join-Path $logDir "pacientes.log"
    Set-Location $d
    python manage.py runserver 8002 *>&1 | Out-File $log
} -ArgumentList (Join-Path $Root "pacientes-service"), $LogDir

# Citas Service
Start-Sleep -Seconds 1
Write-Host "  Iniciando Citas Service (puerto 8003)..." -ForegroundColor Gray
$CitasJob = Start-Job -ScriptBlock {
    param($d, $logDir)
    $log = Join-Path $logDir "citas.log"
    Set-Location $d
    python manage.py runserver 8003 *>&1 | Out-File $log
} -ArgumentList (Join-Path $Root "citas-service"), $LogDir

# Medicamentos Service
Start-Sleep -Seconds 1
Write-Host "  Iniciando Medicamentos Service (puerto 8005)..." -ForegroundColor Gray
$MedicamentosJob = Start-Job -ScriptBlock {
    param($d, $logDir)
    $log = Join-Path $logDir "medicamentos.log"
    Set-Location $d
    python manage.py runserver 8005 *>&1 | Out-File $log
} -ArgumentList (Join-Path $Root "medicamentos-service"), $LogDir

# ── 5. Gateway ───────────────────────────────────────
Write-Host "[5/7] Iniciando API Gateway (puerto 8000)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$GatewayJob = Start-Job -ScriptBlock {
    param($d, $logDir)
    $log = Join-Path $logDir "gateway.log"
    Set-Location $d
    python -m uvicorn main:app --port 8000 --reload *>&1 | Out-File $log
} -ArgumentList (Join-Path $Root "infraestructura\gateway"), $LogDir

Start-Sleep -Seconds 3

# ── 6. Frontend ──────────────────────────────────────
Write-Host "[6/7] Iniciando Frontend (puerto 8080)..." -ForegroundColor Yellow
$FrontendJob = Start-Job -ScriptBlock {
    param($dir)
    $log = Join-Path $dir "logs\frontend.log"
    Set-Location (Join-Path $dir "..\frontend")
    & "npm" run dev 2>&1 | Out-File $log
} -ArgumentList $Root
Start-Sleep -Seconds 3

Write-Host "[7/7] Inicializando servicios..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Todos los servicios iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  API Gateway:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend:        http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Auth Service:    http://localhost:8001" -ForegroundColor Cyan
Write-Host "  Pacientes:       http://localhost:8002" -ForegroundColor Cyan
Write-Host "  Citas:           http://localhost:8003" -ForegroundColor Cyan
Write-Host "  Medicamentos:    http://localhost:8005" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Logs en: $LogDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para detener: Stop-Job *; Remove-Job *" -ForegroundColor Magenta
Write-Host ""

Read-Host "Presiona Enter para detener todos los servicios"

Get-Job | Stop-Job
Get-Job | Remove-Job
