@echo off
title Deteniendo servicios...
echo ========================================
echo  Deteniendo todos los servicios...
echo ========================================
echo.

echo Deteniendo Consul...
taskkill /f /im consul.exe 2>nul

echo Deteniendo Auth Service...
taskkill /f /im python.exe /fi "WindowTitle eq Auth*" 2>nul

echo Deteniendo Pacientes Service...
taskkill /f /im python.exe /fi "WindowTitle eq Pacientes*" 2>nul

echo Deteniendo Citas Service...
taskkill /f /im python.exe /fi "WindowTitle eq Citas*" 2>nul

echo Deteniendo Medicamentos Service...
taskkill /f /im python.exe /fi "WindowTitle eq Medicamentos*" 2>nul

echo Deteniendo Config Server...
taskkill /f /im python.exe /fi "WindowTitle eq Config-Server*" 2>nul

echo Deteniendo Gateway...
taskkill /f /im python.exe /fi "WindowTitle eq Gateway*" 2>nul

echo Deteniendo Frontend...
taskkill /f /im node.exe /fi "WindowTitle eq Frontend*" 2>nul

echo.
echo ========================================
echo  Servicios detenidos.
echo ========================================
pause
