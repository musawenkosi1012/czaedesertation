from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.routes import auth, borrowers, loans, scoring, analytics
from backend.database.models.base import engine, Base
from sqlalchemy import text

# Initialize Database
Base.metadata.create_all(bind=engine)

# Safe column migrations for existing DBs (SQLite ADD COLUMN is idempotent via try/except)
with engine.connect() as conn:
    for col_sql in [
        "ALTER TABLE loans ADD COLUMN rejection_reason TEXT",
        "ALTER TABLE loans ADD COLUMN max_allowed_amount REAL",
    ]:
        try:
            conn.execute(text(col_sql))
            conn.commit()
        except Exception:
            pass  # Column already exists

    # Create users table if it doesn't exist
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                role VARCHAR NOT NULL DEFAULT 'borrower',
                borrower_id INTEGER REFERENCES borrowers(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
    except Exception:
        pass

app = FastAPI(
    title="Czae Credit Scoring API",
    description="ML-powered credit scoring API for Zimbabwean digital lending",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(borrowers.router, prefix="/borrowers", tags=["Borrowers"])
app.include_router(loans.router, prefix="/loans", tags=["Loans"])
app.include_router(scoring.router, prefix="/score", tags=["Scoring"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    return {
        "message": "Czae Credit Scoring API is running",
        "status": "healthy",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
