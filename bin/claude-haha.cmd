@echo off
setlocal
cd /d "%~dp0.."
bun --env-file=.env .\src\entrypoints\cli.tsx %*
