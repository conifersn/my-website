import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, 'brain.db')
OUTPUT_FILE = os.path.join(BASE_DIR, 'post.txt')

def read_brand_voice():
    """Đọc toàn bộ nội dung từ bảng brand_voice."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT title, content FROM brand_voice")
    data = cursor.fetchall()
    conn.close()
    return data

def generate_facebook_post(brand_data):
    """Tạo bài viết Facebook dựa trên brand voice đã học."""
    
    # Trích xuất thông tin từ brand_data
    brand_info = {}
    for title, content in brand_data:
        brand_info[title] = content
    
    # Xây dựng bài viết theo đúng giọng văn
    post = f"""📌 {brand_info.get('Tone của tôi', 'Chia sẻ thẳng thắn')}

{chr(10).join([
    brand_info.get('Tôi hay dùng những từ như', '').split(',')[0] if 'Tôi hay dùng' in brand_info else 'Bạn đang phân vân',
    brand_info.get('Tôi hay dùng những từ như', '').split(',')[1] if 'Tôi hay dùng' in brand_info else 'không biết nên chọn gói nào'
])}

Hôm nay mình chia sẻ cách chọn gói Windows License phù hợp cho doanh nghiệp của bạn. 

{'-'*50}

🏢 {brand_info.get('Đối tượng viết cho', 'Doanh nghiệp vừa và nhỏ')} - mình hiểu bạn cần gì:

1️⃣ **Windows 10/11 Home** - Phù hợp khi:
   • Doanh nghiệp dưới 10 người
   • Chỉ nhu cầu văn phòng cơ bản (Word, Excel, Email)
   • Không cần quản lý tập trung

2️⃣ **Windows 10/11 Pro** - Lựa chọn tối ưu cho:
   • Startup 10-50 người
   • Cần tính năng bảo mật nâng cao (BitLocker)
   • Quản lý thiết bị tập trung (Domain Join)
   • Remote Desktop - làm việc từ xa

3️⃣ **Windows Server** - Dành cho:
   • Doanh nghiệp có máy chủ riêng
   • Cần quản lý mạng nội bộ
   • Chạy ứng dụng doanh nghiệp

💡 {brand_info.get('Tôi hay dùng những từ như', 'Mẹo nhỏ')}:
- Đừng mua bản Home nếu bạn cần kết nối vào domain công ty
- Pro chỉ đắt hơn Home ~2-3 triệu nhưng tính năng nhiều gấp đôi
- Nếu bạn mở rộng team, chọn Pro ngay từ đầu để khỏi nâng cấp sau

{'✓'*20}

📝 {brand_info.get('Tôi hay dùng những từ như', 'Lời khuyên')}: 
Hãy liệt kê nhu cầu thực tế của team bạn trước khi quyết định. Đừng mua theo cảm tính hay nghe lời tư vấn mơ hồ. 

{'-'*50}

👇 Comment bên dưới nếu bạn đang phân vân giữa 2 gói - mình sẽ tư vấn {brand_info.get('Tôi hay dùng những từ như', 'trực tiếp support').split(',')[2] if 'Tôi hay dùng' in brand_info else 'chi tiết'}!

#WindowsLicense #DoanhNghiep #TechForBusiness #ChonDungGiaiPhap
"""
    
    return post

def main():
    # Đọc dữ liệu brand voice
    print("📖 Đang đọc dữ liệu brand voice từ database...")
    brand_data = read_brand_voice()
    
    if not brand_data:
        print("❌ Không tìm thấy dữ liệu trong bảng brand_voice. Hãy chạy script thêm dữ liệu trước.")
        return
    
    print(f"✅ Đã đọc {len(brand_data)} dòng từ bảng brand_voice.")
    
    # In ra thông tin brand voice đã đọc
    print("\n📋 Thông tin brand voice đã học:")
    for title, content in brand_data:
        print(f"   • {title}: {content[:100]}..." if len(content) > 100 else f"   • {title}: {content}")
    
    # Tạo bài post
    print("\n✍️ Đang tạo bài viết Facebook...")
    post_content = generate_facebook_post(brand_data)
    
    # Lưu ra file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(post_content)
    
    print(f"✅ Đã lưu bài viết vào file: {OUTPUT_FILE}")
    print("\n" + "="*60)
    print("📝 NỘI DUNG BÀI VIẾT:")
    print("="*60)
    print(post_content)

if __name__ == "__main__":
    main()
