import sqlite3

conn = sqlite3.connect('backend/czae_credit.db')
cursor = conn.cursor()

# Get the latest loan for borrower 1 (Tinashe Moyo)
cursor.execute('SELECT amount, status, rejection_reason, max_allowed_amount FROM loans WHERE borrower_id = 1 ORDER BY created_at DESC LIMIT 1')
result = cursor.fetchone()

if result:
    amount, status, rejection_reason, max_allowed = result
    print(f"Amount Requested: {amount}")
    print(f"Status: {status}")
    print(f"Max Allowed: {max_allowed}")
    print(f"\nRejection Reason:")
    print(rejection_reason)
else:
    print('No loan found')

conn.close()
