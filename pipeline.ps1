$ErrorActionPreference = "Stop"

# Try to kill esbuild to release file locks on Windows
try {
    taskkill /F /IM esbuild.exe 2>$null
} catch {}

function Run-Command {
    param([string]$cmd)
    Write-Host ">>> Running: $cmd"
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0 -and $cmd -notmatch "npm audit") {
        Write-Host "Command failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
}

Run-Command "npm ci"
Run-Command "npm audit"
Run-Command "npm audit --omit=dev"
Run-Command "npm run check:env"
Run-Command "npm run migration:encoding-check"
Run-Command "npm run migration:audit"
Run-Command "npx prisma validate"
Run-Command "npx prisma generate"
Run-Command "npm run lint"
Run-Command "npx tsc --noEmit"
Run-Command "npm run build"
Run-Command "npm run test"

Write-Host "Pipeline completed successfully!"
