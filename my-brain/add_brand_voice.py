import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, 'brain.db')

def add_brand_voice_details():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Dữ liệu mới cho brand_voice (mỗi dòng là một bản ghi)
    # Lưu ý: cần đặt title và content vào cặp dấu ngoặc tròn ()
    new_records = [
        ('Tone của tôi', 'thẳng thắn, chuyên nghiệp nhưng gần gũi, không dùng từ quá technical, hay dùng số cụ thể'),
        ('Tôi hay dùng những từ như', 'tư vấn miễn phí, giải pháp phù hợp, trực tiếp support, không rắc rối'),
        ('Tôi không bao giờ dùng', 'optimal solution, leverage, synergy, những từ quá marketing'),
        ('Đối tượng viết cho', 'doanh nghiệp nhỏ, cty startup 10-50 người cần license Windows hợp lệ, chưa biết chọn gói nào'),
        ('Bài viết mẫu 1', 'alo, mình mới vừa làm xong website đầu tay bán bản quyền Windows cần nộp bài test để chụp screenshot lại nên e vào link xem thử rồi comment dùm mình nha'),
        ('Bài viết mẫu 2', 'alo, cho xin 30s cho quảng cáo nha ae ! Bên mình có liên kết phân phối bản quyền phần mềm chính hãng :\n- Windows 10/11 Home & Pro\n- Windows Server / SQL Server\n- Office 2019 / 2021\n- Microsoft 365\n✅ Bản quyền chính hãng\n✅ Giá cực tốt\n✅ Quan trọng là có xuất hóa đơn VAT và tem phân phối chính ngạch đầy đủ\nAnh em có nhu cầu hay biết bạn bè, đơn vị nào cần thì giới thiệu giúp nha...vừa giúp người cần mua đúng hàng lại giúp người bán kiếm thêm tả sữa cho con ;p \nxin đa tạ ! /-thanks')
    ]
    
    # Kiểm tra xem đã có dữ liệu chưa (tránh trùng lặp)
    cursor.execute("SELECT COUNT(*) FROM brand_voice")
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Nếu bảng trống, insert toàn bộ
        cursor.executemany('INSERT INTO brand_voice (title, content) VALUES (?, ?)', new_records)
        print(f"✅ Đã thêm {len(new_records)} dòng vào bảng brand_voice.")
    else:
        # Nếu đã có, kiểm tra từng title để tránh trùng
        for title, content in new_records:
            cursor.execute("SELECT COUNT(*) FROM brand_voice WHERE title = ?", (title,))
            if cursor.fetchone()[0] == 0:
                cursor.execute("INSERT INTO brand_voice (title, content) VALUES (?, ?)", (title, content))
                print(f"   ✅ Đã thêm dòng '{title}'")
            else:
                print(f"   ⏭️ Bỏ qua '{title}' (đã tồn tại)")
    
    conn.commit()
    conn.close()
    print("🎯 Hoàn tất cập nhật brand voice!")

if __name__ == "__main__":
    add_brand_voice_details()
