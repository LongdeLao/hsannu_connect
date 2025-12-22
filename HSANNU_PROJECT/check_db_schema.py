import psycopg2

# Database connection parameters
db_params = {
    "host": "69.62.73.139",
    "port": "5433",
    "user": "postgres",
    "password": "2008",
    "database": "HSANNU"
}

def main():
    # Connect to the database
    print("Connecting to the database...")
    conn = None
    try:
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        
        # Check if the users table exists
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = cur.fetchall()
        print("Tables in the database:")
        for table in tables:
            print(f"- {table[0]}")
        
        # Ask user which table to inspect
        table_name = "users"  # Default to 'users'
        
        # Get column information for the specified table
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        
        columns = cur.fetchall()
        print(f"\nColumns in table '{table_name}':")
        for column in columns:
            print(f"- {column[0]} ({column[1]}, Nullable: {column[2]})")
        
        # Get sample data from the table
        cur.execute(f"SELECT * FROM {table_name} LIMIT 1")
        sample = cur.fetchone()
        if sample:
            print(f"\nSample data from '{table_name}':")
            for i, col in enumerate(cur.description):
                print(f"- {col.name}: {sample[i]}")
        else:
            print(f"\nNo data found in table '{table_name}'")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if conn:
            if cur:
                cur.close()
            conn.close()
            print("Database connection closed")

if __name__ == "__main__":
    main() 