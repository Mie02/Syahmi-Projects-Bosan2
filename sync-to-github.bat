@echo off
echo ===================================================
echo  Syahmi Projects Bosan2 - Auto Sync to GitHub
echo ===================================================
echo [1/3] Staging project changes...
git add .

echo [2/3] Creating commit...
git commit -m "Auto-update: sync projects to GitHub [%date% %time%]"

echo [3/3] Pushing to https://github.com/Mie02/Syahmi-Projects-Bosan2...
git push origin main

echo.
echo ===================================================
echo  Synchronization complete!
echo  Live site: https://mie02.github.io/Syahmi-Projects-Bosan2/
echo ===================================================
pause
