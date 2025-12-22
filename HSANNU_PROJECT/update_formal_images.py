import os
import psycopg2
import glob

# Database connection parameters
db_params = {
    "host": "69.62.73.139",
    "port": "5433",
    "user": "postgres",
    "password": "2008",
    "database": "HSANNU"
}

# Path to the formal images - using absolute path
images_dir = "/Users/longde/Desktop/HSANNU_PROJECT/server/student_formal_images"

def main():
    # Connect to the database
    print("Connecting to the database...")
    conn = None
    try:
        conn = psycopg2.connect(**db_params)
        cur = conn.cursor()
        
        # Get list of all jpg files in the directory
        image_files = glob.glob(os.path.join(images_dir, "*.jpg"))
        print(f"Found {len(image_files)} image files")
        
        # Process each image file
        updated_count = 0
        for image_path in image_files:
            # Extract user_id from filename (removing .jpg extension)
            filename = os.path.basename(image_path)
            user_id = filename.split('.')[0]
            
            if not user_id.isdigit():
                print(f"Skipping file with non-numeric user_id: {filename}")
                continue
                
            # Construct the path to store in the database
            db_path = f"/student_formal_images/{filename}"
            
            # Update the user record using the correct column name 'id' instead of 'user_id'
            cur.execute(
                "UPDATE users SET formal_picture = %s WHERE id = %s RETURNING id",
                (db_path, user_id)
            )
            
            result = cur.fetchone()
            if result:
                updated_count += 1
                print(f"Updated user {user_id} with formal_picture: {db_path}")
            else:
                print(f"No user found with id: {user_id}")
        
        # Commit the changes
        conn.commit()
        print(f"Successfully updated {updated_count} user records")
        
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