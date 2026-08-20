import os
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, 'brain.db')

def create_connection():
    conn = sqlite3.connect(DB_NAME)
    return conn

def create_tables(conn):
    cursor = conn.cursor()
    # knowledge table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    # business table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS business (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    # brand_voice table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS brand_voice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    # customers table for website waitlist leads
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        message TEXT,
        source TEXT DEFAULT 'website_waitlist',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    conn.commit()

def insert_sample_data(conn):
    cursor = conn.cursor()
    # Sample data for knowledge
    knowledge_samples = [
        ('Học cách tư duy phản biện', 'Nội dung: Phản biện là kỹ năng quan trọng...'),
        ('Nguyên lý 80/20 trong công việc', 'Nội dung: Tập trung vào 20% nhiệm vụ quan trọng nhất...')
    ]
    cursor.executemany('INSERT INTO knowledge (title, content) VALUES (?, ?)', knowledge_samples)

    # Sample data for business
    business_samples = [
        ('Sản phẩm A - Giải pháp AI', 'Mô tả sản phẩm: Ứng dụng AI cho doanh nghiệp...'),
        ('Khách hàng tiềm năng: Công ty XYZ', 'Thông tin: Liên hệ qua email...')
    ]
    cursor.executemany('INSERT INTO business (title, content) VALUES (?, ?)', business_samples)

    # Sample data for brand_voice
    brand_voice_samples = [
        ('Giọng văn thân thiện', 'Sử dụng ngôn từ gần gũi, hài hước nhẹ nhàng...'),
        ('Tone chuyên nghiệp', 'Sử dụng cấu trúc rõ ràng, trang trọng...')
    ]
    cursor.executemany('INSERT INTO brand_voice (title, content) VALUES (?, ?)', brand_voice_samples)

    conn.commit()

def main():
    conn = create_connection()
    create_tables(conn)
    # Check if tables are empty before inserting? For simplicity, just insert. But to avoid duplicates, we might delete existing rows or check.
    # I'll just insert, but if you run multiple times, you'll get duplicate entries. For now, it's okay.
    # However, I'll add a check: only insert if table has no rows.
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM knowledge")
    if cursor.fetchone()[0] == 0:
        insert_sample_data(conn)
        print("Đã chèn dữ liệu mẫu vào các bảng.")
    else:
        print("Dữ liệu mẫu đã tồn tại, bỏ qua chèn.")
    conn.close()
    print("Database brain.db đã được tạo thành công.")

if __name__ == "__main__":
    main()
