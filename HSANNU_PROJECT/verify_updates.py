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
        
        # Count users with formal_picture starting with /student_formal_images/
        cur.execute("SELECT COUNT(*) FROM users WHERE formal_picture LIKE '/student_formal_images/%'")
        count = cur.fetchone()[0]
        print(f"Total users with formal_picture paths starting with '/student_formal_images/': {count}")
        
        # Get some sample users with their formal_picture paths
        cur.execute("""
            SELECT id, first_name, last_name, formal_picture 
            FROM users 
            WHERE formal_picture LIKE '/student_formal_images/%' 
            LIMIT 10
        """)
        
        samples = cur.fetchall()
        print("\nSample users with formal_picture paths:")
        for sample in samples:
            print(f"ID: {sample[0]}, Name: {sample[1]} {sample[2]}, Picture: {sample[3]}")
            
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