import matplotlib.pyplot as plt
import pandas as pd
import sqlite3
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "czae_credit.db")
OUTPUT_DIR = os.path.join(BASE_DIR, "research", "figures")

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def generate_db_visualizations():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    
    # 1. Monthly Income Distribution
    print("Generating Income Distribution plot...")
    query = "SELECT monthly_income, location FROM borrowers"
    df = pd.read_sql_query(query, conn)
    
    plt.figure(figsize=(10, 6))
    for location in df['location'].unique():
        subset = df[df['location'] == location]
        plt.hist(subset['monthly_income'], bins=30, alpha=0.5, label=location)
    
    plt.title('Monthly Income Distribution by Location')
    plt.xlabel('Monthly Income (USD)')
    plt.ylabel('Frequency')
    plt.legend()
    plt.grid(axis='y', alpha=0.3)
    
    income_plot_path = os.path.join(OUTPUT_DIR, "db_income_distribution.png")
    plt.savefig(income_plot_path)
    print(f"Saved: {income_plot_path}")
    
    # 2. Risk Category Distribution from Credit Scores
    print("Generating Risk Category plot...")
    query = "SELECT risk_category FROM credit_scores"
    df_scores = pd.read_sql_query(query, conn)
    
    if not df_scores.empty:
        risk_counts = df_scores['risk_category'].value_counts()
        plt.figure(figsize=(8, 8))
        plt.pie(risk_counts, labels=risk_counts.index, autopct='%1.1f%%', startangle=140, colors=['#4CAF50', '#FFC107', '#FF9800', '#F44336'])
        plt.title('Credit Risk Distribution')
        
        risk_plot_path = os.path.join(OUTPUT_DIR, "db_risk_distribution.png")
        plt.savefig(risk_plot_path)
        print(f"Saved: {risk_plot_path}")
    else:
        print("No credit scores found in database.")

    # 3. Income vs Probability of Default
    print("Generating Income vs Default Probability plot...")
    query = """
    SELECT b.monthly_income, cs.probability_of_default 
    FROM borrowers b 
    JOIN credit_scores cs ON b.id = cs.borrower_id
    """
    df_joined = pd.read_sql_query(query, conn)
    
    if not df_joined.empty:
        plt.figure(figsize=(10, 6))
        plt.scatter(df_joined['monthly_income'], df_joined['probability_of_default'], alpha=0.5, c='#2196F3')
        plt.title('Monthly Income vs. Predicted Probability of Default')
        plt.xlabel('Monthly Income (USD)')
        plt.ylabel('Probability of Default')
        plt.grid(True, alpha=0.3)
        
        scatter_plot_path = os.path.join(OUTPUT_DIR, "db_income_vs_default.png")
        plt.savefig(scatter_plot_path)
        print(f"Saved: {scatter_plot_path}")

    conn.close()
    print("Done!")

if __name__ == "__main__":
    generate_db_visualizations()
