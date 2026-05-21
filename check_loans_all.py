import sqlite3

conn = sqlite3.connect('backend/czae_credit.db')
cursor = conn.cursor()

# Get all loans for borrower 1 (Tinashe Moyo)
cursor.execute('SELECT id, amount, status, rejection_reason, max_allowed_amount, created_at FROM loans WHERE borrower_id = 1 ORDER BY created_at DESC')
results = cursor.fetchall()

print(f"Total loans: {len(results)}\n")

for loan in results:
    id, amount, status, rejection_reason, max_allowed, created_at = loan
    print(f"Loan ID: {id}")
    print(f"  Amount: {amount}")
    print(f"  Status: {status}")
    print(f"  Max Allowed: {max_allowed}")
    print(f"  Created: {created_at}")
    if rejection_reason:
        print(f"  Rejection: {rejection_reason}")
    print()

conn.close()
