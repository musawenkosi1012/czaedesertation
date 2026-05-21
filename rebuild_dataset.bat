@echo off
echo ==========================================
echo   CZAE CREDIT SCORING - DATA REBUILD
echo ==========================================
echo [1/3] Generating 3-Economy Zimbabwe Dataset...
.\venv\Scripts\python.exe scripts\data_generation\generate_zim_3_economies.py

echo [2/3] Seeding Database (borrowers_3_economies.csv)...
.\venv\Scripts\python.exe backend\database\seeds\seed_db.py

echo [3/3] Re-calculating ML Features...
.\venv\Scripts\python.exe ml_pipeline\feature_engineering\features.py

echo ==========================================
echo   SUCCESS: Dataset Rebuilt with 30 Users
echo ==========================================
pause
