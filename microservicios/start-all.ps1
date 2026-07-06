param(
    [switch]$InstallDeps = $false
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando todos los microservicios" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Instalar dependencias ────────────────────────
Write-Host "[0/6] Verificando dependencias..." -ForegroundColor Yellow
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
Write-Host "[1/6] Iniciando Consul (puerto 8500)..." -ForegroundColor Yellow
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
Write-Host "[2/6] Iniciando Config Server (puerto 8888)..." -ForegroundColor Yellow
$ConfigJob = Start-Job -ScriptBlock {
    param($dir)
    $log = Join-Path $dir "logs\config-server.log"
    Set-Location (Join-Path $dir "infraestructura\config-server")
    python -m uvicorn main:app --host 0.0.0.0 --port 8888 --reload 2>&1 | Out-File $log
} -ArgumentList $Root
Start-Sleep -Seconds 2

# ── 3. Auth Service ──────────────────────────────────
Write-Host "[3/6] Iniciando Auth Service (puerto 8001)..." -ForegroundColor Yellow
$AuthJob = Start-Job -ScriptBlock {
    param($dir)
    $log = Join-Path $dir "logs\auth-service.log"
    Set-Location (Join-Path $dir "auth-service")
    $env:PORT = "8001"
    python manage.py runserver 0.0.0.0:8001 2>&1 | Out-File $log
} -ArgumentList $Root
Start-Sleep -Seconds 2

# ── 4. Microservicios Django ─────────────────────────
Write-Host "[4/6] Iniciando servicios Django..." -ForegroundColor Yellow

$services = @(
    @{Name="Pacientes"; Port=8002; Dir="pacientes-service"},
    @{Name="Medicos"; Port=8003; Dir="medicos-service"},
    @{Name="Citas"; Port=8004; Dir="citas-service"},
    @{Name="Medicamentos"; Port=8005; Dir="medicamentos-service"},
    @{Name="Facturacion"; Port=8006; Dir="facturacion-service"},
    @{Name="Soporte"; Port=8007; Dir="soporte-service"}
)

$ServiceJobs = @()
foreach ($svc in $services) {
    Write-Host "  -> $($svc.Name) (puerto $($svc.Port))..." -ForegroundColor Gray
    $job = Start-Job -ScriptBlock {
        param($d, $p, $name, $logDir)
        $log = Join-Path $logDir "$name.log"
        Set-Location $d
        $env:PORT = "$p"
        python manage.py runserver 0.0.0.0:$p 2>&1 | Out-File $log
    } -ArgumentList (Join-Path $Root $svc.Dir), $svc.Port, $svc.Name.ToLower(), $LogDir
    $ServiceJobs += $job
    Start-Sleep -Seconds 1
}

# ── 5. Gateway ───────────────────────────────────────
Write-Host "[5/6] Iniciando API Gateway (puerto 8000)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$GatewayJob = Start-Job -ScriptBlock {
    param($dir)
    $log = Join-Path $dir "logs\gateway.log"
    Set-Location (Join-Path $dir "infraestructura\gateway")
    $env:PORT = "8000"
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | Out-File $log
} -ArgumentList $Root
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Todos los servicios iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Consul UI:       http://localhost:8500" -ForegroundColor Cyan
Write-Host "  Config Server:   http://localhost:8888" -ForegroundColor Cyan
Write-Host "  API Gateway:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Auth Service:    http://localhost:8001" -ForegroundColor Cyan
Write-Host "  Pacientes:       http://localhost:8002" -ForegroundColor Cyan
Write-Host "  Medicos:         http://localhost:8003" -ForegroundColor Cyan
Write-Host "  Citas:           http://localhost:8004" -ForegroundColor Cyan
Write-Host "  Medicamentos:    http://localhost:8005" -ForegroundColor Cyan
Write-Host "  Facturacion:     http://localhost:8006" -ForegroundColor Cyan
Write-Host "  Soporte:         http://localhost:8007" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Logs en: $LogDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  Si en Consul no aparecen los servicios, revisa los logs:"
Write-Host "  Get-Content $LogDir\*.log" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para detener: Get-Job | Stop-Job" -ForegroundColor Magenta
Write-Host ""

# Mantener el script vivo para mantener los jobs en background
Read-Host "Presiona Enter para detener todos los servicios"

# Limpiar
Get-Job | Stop-Job
Get-Job | Remove-Job
