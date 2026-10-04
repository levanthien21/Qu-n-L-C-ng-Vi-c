import { ExternalLink, AlertTriangle } from 'lucide-react';

export function SOPGuide() {
  return (
    <div className="space-y-8 p-2">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
        <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 text-center uppercase">Quy trình triển khai dịch vụ huấn luyện AI (DVHL AI)</h2>
        <p className="text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">(Thời gian triển khai: 30 ngày)</p>
      </div>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">I. NHẬN THÔNG TIN & CHUẨN BỊ (TỐI ĐA 1 NGÀY)</h3>
        <div className="space-y-4 pl-2 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">1. Nhận thông tin khách hàng</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Tiếp nhận khách hàng từ nhóm Support nội bộ</li>
              <li>Vào nhóm chào hỏi và giới thiệu, hẹn lịch hỗ trợ trong vòng 15 phút ngay sau khi tiếp nhận</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">2. Ghi chú & quản lý nội bộ</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Tạo ghi chú các chức năng cần triển khai lên nhóm triển khai Retion</li>
              <li>Ghi chú gói DVHL, thời gian bắt đầu thời gian kết thúc</li>
              <li>Gắn tag <strong className="text-red-500">DV-Gets</strong> cho nhóm vừa ghi chú</li>
              <li>Điền đầy đủ thông tin khách hàng vào link: <a href="https://docs.google.com/spreadsheets/d/1Mt_B9rm6w5xHyzRyu5Cv0RmTUNP0Uj80fzAGQrbvT9s/edit?gid=0#gid=0" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Khách hàng - DV Huấn Luyện AI <ExternalLink size={12}/></a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">3. Chuẩn bị & tạo file gửi khách hàng</h4>
            <p className="mt-1 mb-1 font-medium">Tạo đầy đủ các file sau:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sheet tổng hợp bao gồm: Timeline triển khai, Kiến thức AI</li>
              <li>Link tổng hợp triển khai dự án: <a href="https://docs.google.com/spreadsheets/d/1hFg3ujhJCsyjjU5e7QCmODrphrwqF0VTb_gy0aGQHYc/edit?gid=2092336761#gid=2092336761" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">[Tên nhóm] - gói DVHL <ExternalLink size={12}/></a> (Ghim link lên CRM theo ID sale cung cấp)</li>
              <li>Prompt AI (Không gửi cho khách): <a href="https://docs.google.com/document/d/1POSTXOZP34gJjZ5Of0gp5mXguztvdRI2TycOqZZHRO4/edit?tab=t.0" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Prompt mẫu v2.1 <ExternalLink size={12}/></a></li>
              <li>Tham khảo thêm: <a href="https://docs.google.com/document/d/12ulZ_vUYK2rLOeyyFG6Ie_wpJA1sZrI5YTCzA_W6m8A/edit?tab=t.w4wm4cpij7i6" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">DANH SÁCH PROMPT MẪU <ExternalLink size={12}/></a></li>
            </ul>
            <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded">
              <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-1">Lưu ý về Prompt AI bắt buộc phải có:</span>
              <ul className="list-disc pl-5 space-y-0.5 text-amber-900 dark:text-amber-200">
                <li>Thông tin doanh nghiệp, STK / thông tin thanh toán</li>
                <li>Cách chào hỏi, Cách xưng hô, Quy tắc tư vấn</li>
                <li>Bảo mật, không cung cấp thông tin nội bộ</li>
                <li>Không tự ý bịa thông tin khuyến mãi, giá tiền</li>
              </ul>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">4. Phân bổ & sắp xếp công việc</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Phân bổ thứ tự công việc rõ ràng</li>
              <li>Gắn tag theo từng giai đoạn trong DVHL</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">II. TRIỂN KHAI BAN ĐẦU (TỐI ĐA 07 - 10 NGÀY)</h3>
        <div className="space-y-4 pl-2 text-sm text-slate-700 dark:text-slate-300">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">1. Khảo sát, phân tích & nâng cấp gói (Tối đa 1 ngày)</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Buổi meeting đầu tiên tiến hành khảo sát theo phần kick-off: <a href="https://docs.google.com/spreadsheets/d/1hFg3ujhJCsyjjU5e7QCmODrphrwqF0VTb_gy0aGQHYc/edit?gid=1978371240#gid=1978371240" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">[Tên nhóm] - gói DVHL <ExternalLink size={12}/></a></li>
              <li>Sau meeting: điền đầy đủ ngày tháng vào timeline - Gửi tin nhắn xác nhận lên nhóm kèm record.</li>
              <li>Clear với khách các thông tin: <a href="https://docs.google.com/document/d/1mHlnJqAFat1xOakt2HfUpUPjnWYipBmyuMFPjt-Ff8s/edit?tab=t.b19zt2eup5v4" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Clear với khách từ ban đầu <ExternalLink size={12}/></a></li>
              <li>Note lại thông tin gói lên nhóm Retion (ID Qtv, ID tổ chức…)</li>
              <li>Nếu khách thanh toán chưa đủ: tạo nhắc lịch theo dõi thanh toán</li>
              <li>Gắn tag <strong className="text-red-500">DV-Gets</strong></li>
              <li>Thông báo bắt đầu DVHL và tạo ticket DVHL</li>
              <li>Hẹn lịch đầy đủ nhân viên để hướng dẫn sử dụng Retion (thời gian 1- 2 giờ) - Buổi 2</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">2. Chuẩn bị môi trường & tài khoản (Ngay sau khảo sát)</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Thêm tài khoản của support vào tổ chức của khách để lấy hội thoại làm prompt, test AI</li>
              <li>Tiến hành meeting buổi 2, điền đủ thông tin và yêu cầu khách xác nhận vào sheet Lộ trình triển khai</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">3. Chuẩn bị file training AI</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Gửi file mẫu kiến thức mô tả chi tiết cho khách và hướng dẫn cách điền</li>
              <li>Xác nhận rõ ai là người phụ trách làm kiến thức ở phía khách hàng</li>
              <li>Deadline khách điền kiến thức: 03 - 05 ngày (báo rõ với khách)</li>
              <li>Gắn tag: <strong className="text-purple-600">DV – CB Kiến Thức</strong></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">4. Xây dựng Prompt AI</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Xin thông tin quy trình tư vấn bán hàng, thông tin nội bộ, trường hợp đặc biệt… của khách</li>
              <li>Support làm prompt theo thông tin đã nhận (Gắn tag DV – Prompt)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">5. Tạo page demo & test AI (3-5 ngày)</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Tạo page demo (Deadline SP: 03 - 05 ngày - báo khách ngày sẽ gửi test)</li>
              <li>Gắn tag <strong className="text-amber-600">DV – Set AI</strong> (Hoặc DV - Test AI)</li>
              <li>Giả lập lại 30-50 tình huống tư vấn thực tế và điều chỉnh prompt - Chụp bằng chứng test đưa lên timeboxing</li>
              <li>Khi test xong đưa link test vào báo cáo kèm số lượng hội thoại</li>
              <li>Thông báo lên nhóm đang test AI thời gian 3-5 ngày</li>
              <li className="font-medium text-amber-600 dark:text-amber-400">Lưu ý: Trước khi gửi khách test phải gửi lên nhóm Hậu Kiểm. Sau khi Audit đánh giá đạt mới được gửi khách.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">6. Test AI với khách hàng</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Gửi page demo cho khách, báo khách hỗ trợ test quy trình cùng (Khuyên khách test trên tâm thế người mua hàng)</li>
              <li>Nếu AI phát sinh lỗi nhiều: báo khách tạm ngưng, quay lại quy trình test 1-2 ngày</li>
              <li>Tăng cường test để hoàn thiện trong 2-3 ngày</li>
              <li>Gắn tag <strong className="text-amber-600">DV – Test AI</strong></li>
              <li>Xác nhận đưa lên triển khai ở page chính. Trao đổi nhanh 15p về các lưu ý.</li>
            </ul>
            <div className="mt-2 bg-slate-100 dark:bg-slate-800 p-3 rounded space-y-2">
              <p className="font-semibold">Các tình huống xử lý:</p>
              <ul className="space-y-1">
                <li><strong>TH1: Khách phối hợp test:</strong> Nhận góp ý → điều chỉnh → cho test tiếp (cần giả lập thêm).</li>
                <li><strong>TH2: Khách không phối hợp:</strong> Quay video test AI. Đưa số liệu cụ thể (Bao nhiêu khách, bao nhiêu hội thoại) và hỏi khách đã đưa lên page chính được chưa.</li>
                <li><strong>TH3: Khách không đồng nhất ý kiến:</strong> Dựa trên form khảo sát mong muốn AI để điều chỉnh.</li>
                <li><strong>TH4: Khách cố tình làm khó:</strong> Luôn đưa ra số liệu test cụ thể làm căn cứ. Gửi báo cáo tiến độ.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">III. TRIỂN KHAI THỰC TẾ</h3>
        <div className="space-y-2 pl-2 text-sm text-slate-700 dark:text-slate-300">
          <p>Gắn tag <strong className="text-blue-600">DV – Actual Run</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sau khi cài lên page chính tiếp tục gửi lên nhóm Hậu Kiểm kiểm tra</li>
            <li>Chủ động theo dõi AI trên page hằng ngày</li>
            <li>Kiểm tra hội thoại AI theo 2 điều kiện: Khách có SĐT & Khách chưa phản hồi</li>
            <li>Gửi báo cáo đầu tuần & cuối tuần. Chủ động hỏi thăm khách theo đúng tag giai đoạn.</li>
          </ul>
          <div className="mt-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded">
            <strong>Trường hợp lỗi nhiều:</strong> Nếu AI phát sinh lỗi liên tiếp do thiếu kiến thức/prompt (từ 3 lần trở lên), thông báo khách tạm dừng ở page chính, chuyển về page test 2 ngày để điều chỉnh.
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">IV. BÀN GIAO & NGHIỆM THU</h3>
        <div className="space-y-4 pl-2 text-sm text-slate-700 dark:text-slate-300">
          <p className="font-medium italic text-slate-500">Cách ngày kết thúc dịch vụ 3-4 ngày chuẩn bị trước các phần bàn giao và hẹn lịch hướng dẫn trước 1 ngày (Buổi 3)</p>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">1. Bàn giao</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Hướng dẫn chỉnh sửa & tối ưu AI</li>
              <li>Hướng dẫn huấn luyện bài viết</li>
              <li>Hướng dẫn điều chỉnh Chatbot</li>
              <li>Hướng dẫn sử dụng GHL</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">2. Nghiệm thu</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Yêu cầu khách xác nhận bảng nghiệm thu</li>
              <li>Khoá các sheet khách đã xác nhận</li>
              <li>Điền đầy đủ thông tin vào file khách hàng: <a href="https://docs.google.com/spreadsheets/d/1Mt_B9rm6w5xHyzRyu5Cv0RmTUNP0Uj80fzAGQrbvT9s/edit?gid=0#gid=0" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Khách hàng - DV Huấn Luyện AI <ExternalLink size={12}/></a></li>
              <li>Gửi báo cáo lên nhóm hậu kiểm và xin ý kiến khách hàng</li>
              <li>Gắn tag <strong className="text-emerald-600">DV – Done</strong></li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">V. BÁO CÁO & HẬU KIỂM</h3>
        <div className="space-y-2 pl-2 text-sm text-slate-700 dark:text-slate-300">
          <ul className="list-disc pl-5 space-y-1">
            <li>Lưu toàn bộ báo cáo, phản hồi khách hàng</li>
            <li>Tổng hợp đánh giá để cải tiến quy trình nội bộ</li>
          </ul>
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded border-l-4 border-slate-500">
            <p className="font-bold flex items-center gap-1 mb-2"><AlertTriangle size={16}/> LƯU Ý QUAN TRỌNG:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Các trường hợp khách không phản hồi, không hợp tác test… thời gian quá 15 ngày. Sau khi đã báo sale và nhắn lên nhóm tiến hành tạm thời đóng ticket.</li>
              <li>Sau mỗi buổi meeting khách hàng <strong>phải xác nhận vào file Lộ trình triển khai</strong> tương ứng.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
