================================================
  BVM ERP - Local Setup Guide
================================================

FIRST TIME SETUP (do this only once):
--------------------------------------
1. Make sure Node.js is installed
   - Download from: https://nodejs.org
   - Choose the LTS version
   - Install with all default options

2. Double-click "INSTALL.bat"
   - Wait 2-3 minutes for installation to complete


EVERY DAY TO USE THE ERP:
--------------------------
Step 1: Double-click "START BACKEND.bat"
        - Wait until you see: BVM ERP running → http://localhost:3001
        - Keep this window open

Step 2: Double-click "START FRONTEND.bat"  
        - Browser will open automatically at http://localhost:3000
        - Keep this window open too

Step 3: Use the ERP in your browser!
        URL: http://localhost:3000


TO CLOSE THE ERP:
-----------------
Just close both black terminal windows.


YOUR DATA:
----------
All data is saved locally in:
backend/erp.db.json

This file contains ALL your data - clients, products, 
invoices, payments etc. 

IMPORTANT: Keep this file safe and backed up!


NOTES:
------
- Both terminal windows must stay open while using the ERP
- If something doesn't load, make sure the Backend is 
  running first before opening Frontend
- Data is saved automatically - no need to export

================================================
  Support: Contact your ERP provider
================================================
