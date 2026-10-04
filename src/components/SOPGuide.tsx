import { ExternalLink, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Customer } from '../domain/types';
import { ProgressBar } from './ui';
import { sendTelegramMessage } from '../utils/telegram';

export function SOPGuide({ customer }: { customer: Customer }) {
  const updateCustomer = useStore(s => s.updateCustomer);
  const checklist = customer.sopChecklist || {};

  // Define total items for the progress bar calculation
  const totalItems = 38; // Pre-counted all actionable CheckItems
  const completedItems = Object.values(checklist).filter(v => v).length;
  const percent = Math.round((completedItems / totalItems) * 100) || 0;

  const CheckItem = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const isChecked = checklist[id] || false;
    const toggle = () => {
      const newChecklist = { ...checklist, [id]: !isChecked };
      updateCustomer(customer.id, { sopChecklist: newChecklist });
      
      const { settings } = useStore.getState();
      if (!isChecked && settings.telegramToken && settings.telegramChatId && settings.telegramNotifyProgress) {
         let stepName = "";
         if(typeof children === 'string') stepName = children;
         else if(Array.isArray(children)) stepName = children.map(x => typeof x === 'string' ? x : '').join('');
         
         if(stepName.length > 50) stepName = stepName.substring(0,50) + '...';
         sendTelegramMessage(
            settings.telegramToken,
            settings.telegramChatId,
            `✅ <b>CẬP NHẬT TIẾN ĐỘ SOP</b>\n\nKhách hàng: <b>${customer.name}</b>\nVừa hoàn thành bước:\n<i>${stepName || 'Một hạng mục trong lộ trình'}</i>`
         );
      }
    };
    return (
      <div onClick={toggle} className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded -ml-1.5 transition-colors group">
        <div className="mt-0.5 text-indigo-500 shrink-0">
          {isChecked ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-400" />}
        </div>
        <span className={`text-sm ${isChecked ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}>
          {children}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-2">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
        <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 text-center uppercase">Quy trình triển khai dịch vụ huấn luyện AI (DVHL AI)</h2>
        <p className="text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1 mb-4">(Thời gian triển khai: 30 ngày)</p>
        
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700/50">
           <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
             <span>Tiến độ hoàn thành SOP (Checklist)</span>
             <span className={percent === 100 ? "text-emerald-600" : "text-indigo-600"}>{completedItems}/{totalItems} ({percent}%)</span>
           </div>
           <ProgressBar percent={percent} tone={percent === 100 ? 'green' : 'indigo'} />
        </div>
      </div>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">I. NHẬN THÔNG TIN & CHUẨN BỊ (TỐI ĐA 1 NGÀY)</h3>
        <div className="space-y-4 pl-2">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">1. Nhận thông tin khách hàng</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="i_1_1">Tiếp nhận khách hàng từ nhóm Support nội bộ</CheckItem>
              <CheckItem id="i_1_2">Vào nhóm chào hỏi và giới thiệu, hẹn lịch hỗ trợ trong vòng 15 phút ngay sau khi tiếp nhận</CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">2. Ghi chú & quản lý nội bộ</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="i_2_1">Tạo ghi chú các chức năng cần triển khai lên nhóm triển khai Retion</CheckItem>
              <CheckItem id="i_2_2">Ghi chú gói DVHL, thời gian bắt đầu thời gian kết thúc</CheckItem>
              <CheckItem id="i_2_3">Gắn tag <strong className="text-red-500">DV-Gets</strong> cho nhóm vừa ghi chú</CheckItem>
              <CheckItem id="i_2_4">Điền đầy đủ thông tin khách hàng vào link: <a href="https://docs.google.com/spreadsheets/d/1Mt_B9rm6w5xHyzRyu5Cv0RmTUNP0Uj80fzAGQrbvT9s/edit?gid=0#gid=0" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 hover:underline inline-flex items-center gap-1">Khách hàng - DV Huấn Luyện AI <ExternalLink size={12}/></a></CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">3. Chuẩn bị & tạo file gửi khách hàng</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="i_3_1">Tạo Sheet tổng hợp bao gồm: Timeline triển khai, Kiến thức AI</CheckItem>
              <CheckItem id="i_3_2">Tạo Link tổng hợp triển khai dự án (Ghim link lên CRM theo ID sale cung cấp)</CheckItem>
              <CheckItem id="i_3_3">Chuẩn bị Prompt AI (Không gửi cho khách) dựa trên Prompt mẫu và tuân thủ các quy tắc bảo mật, thông tin thanh toán</CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">4. Phân bổ & sắp xếp công việc</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="i_4_1">Phân bổ thứ tự công việc rõ ràng</CheckItem>
              <CheckItem id="i_4_2">Gắn tag theo từng giai đoạn trong DVHL</CheckItem>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">II. TRIỂN KHAI BAN ĐẦU (TỐI ĐA 07 - 10 NGÀY)</h3>
        <div className="space-y-4 pl-2">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">1. Khảo sát, phân tích & nâng cấp gói (Tối đa 1 ngày)</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="ii_1_1">Buổi meeting đầu tiên tiến hành khảo sát theo phần kick-off</CheckItem>
              <CheckItem id="ii_1_2">Sau meeting: điền đầy đủ ngày tháng vào timeline - Gửi tin nhắn xác nhận lên nhóm kèm record.</CheckItem>
              <CheckItem id="ii_1_3">Clear với khách các thông tin ngay từ ban đầu</CheckItem>
              <CheckItem id="ii_1_4">Note lại thông tin gói lên nhóm Retion (ID Qtv, ID tổ chức…)</CheckItem>
              <CheckItem id="ii_1_5">Tạo nhắc lịch theo dõi thanh toán (Nếu khách thanh toán chưa đủ)</CheckItem>
              <CheckItem id="ii_1_6">Thông báo bắt đầu DVHL và tạo ticket DVHL</CheckItem>
              <CheckItem id="ii_1_7">Hẹn lịch đầy đủ nhân viên để hướng dẫn sử dụng Retion (Buổi 2)</CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">2. Chuẩn bị môi trường & tài khoản (Ngay sau khảo sát)</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="ii_2_1">Thêm tài khoản của support vào tổ chức của khách để lấy hội thoại làm prompt, test AI</CheckItem>
              <CheckItem id="ii_2_2">Tiến hành meeting buổi 2, điền đủ thông tin và yêu cầu khách xác nhận vào sheet Lộ trình triển khai</CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">3. Chuẩn bị file training AI</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="ii_3_1">Gửi file mẫu kiến thức mô tả chi tiết cho khách và hướng dẫn cách điền</CheckItem>
              <CheckItem id="ii_3_2">Xác nhận rõ ai là người phụ trách làm kiến thức ở phía khách hàng</CheckItem>
              <CheckItem id="ii_3_3">Deadline khách điền kiến thức: 03 - 05 ngày (báo rõ với khách)</CheckItem>
              <CheckItem id="ii_3_4">Gắn tag: <strong className="text-purple-600">DV – CB Kiến Thức</strong></CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">4. Xây dựng Prompt AI</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="ii_4_1">Xin thông tin quy trình tư vấn bán hàng, thông tin nội bộ, trường hợp đặc biệt… của khách</CheckItem>
              <CheckItem id="ii_4_2">Support làm prompt theo thông tin đã nhận (Gắn tag DV – Prompt)</CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">5. Tạo page demo & test AI (3-5 ngày)</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="ii_5_1">Tạo page demo và Gắn tag <strong className="text-amber-600">DV – Set AI</strong></CheckItem>
              <CheckItem id="ii_5_2">Giả lập lại 30-50 tình huống tư vấn thực tế và điều chỉnh prompt - Chụp bằng chứng test đưa lên timeboxing</CheckItem>
              <CheckItem id="ii_5_3">Gửi lên nhóm Hậu Kiểm kiểm tra đánh giá trước khi gửi khách</CheckItem>
              <CheckItem id="ii_5_4">Đưa link test vào báo cáo kèm số lượng hội thoại</CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">6. Test AI với khách hàng</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="ii_6_1">Gửi page demo cho khách, báo khách hỗ trợ test quy trình cùng (Khuyên khách test trên tâm thế người mua hàng)</CheckItem>
              <CheckItem id="ii_6_2">Theo dõi sát và xử lý các tình huống: khách phản hồi, cần quay video test mẫu, gửi báo cáo tiến độ</CheckItem>
              <CheckItem id="ii_6_3">Gắn tag <strong className="text-amber-600">DV – Test AI</strong></CheckItem>
              <CheckItem id="ii_6_4">Xác nhận đưa lên triển khai ở page chính. Trao đổi nhanh 15p về các lưu ý.</CheckItem>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">III. TRIỂN KHAI THỰC TẾ</h3>
        <div className="space-y-2 pl-2">
          <div className="flex flex-col gap-0.5">
            <CheckItem id="iii_1">Gắn tag <strong className="text-blue-600">DV – Actual Run</strong></CheckItem>
            <CheckItem id="iii_2">Sau khi cài lên page chính tiếp tục gửi lên nhóm Hậu Kiểm kiểm tra</CheckItem>
            <CheckItem id="iii_3">Chủ động theo dõi AI trên page hằng ngày (kiểm tra khách có SĐT, chưa phản hồi)</CheckItem>
            <CheckItem id="iii_4">Gửi báo cáo đầu tuần & cuối tuần. Chủ động hỏi thăm khách theo đúng tag giai đoạn.</CheckItem>
          </div>
          <div className="mt-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded text-sm">
            <strong>Trường hợp lỗi nhiều:</strong> Nếu AI phát sinh lỗi liên tiếp do thiếu kiến thức/prompt (từ 3 lần trở lên), thông báo khách tạm dừng ở page chính, chuyển về page test 2 ngày để điều chỉnh.
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">IV. BÀN GIAO & NGHIỆM THU</h3>
        <div className="space-y-4 pl-2">
          <p className="font-medium italic text-slate-500 text-sm">Cách ngày kết thúc dịch vụ 3-4 ngày chuẩn bị trước các phần bàn giao và hẹn lịch hướng dẫn trước 1 ngày (Buổi 3)</p>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">1. Bàn giao</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="iv_1_1">Hướng dẫn chỉnh sửa & tối ưu AI</CheckItem>
              <CheckItem id="iv_1_2">Hướng dẫn huấn luyện bài viết</CheckItem>
              <CheckItem id="iv_1_3">Hướng dẫn điều chỉnh Chatbot & sử dụng GHL</CheckItem>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">2. Nghiệm thu</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="iv_2_1">Yêu cầu khách xác nhận bảng nghiệm thu</CheckItem>
              <CheckItem id="iv_2_2">Khoá các sheet khách đã xác nhận</CheckItem>
              <CheckItem id="iv_2_3">Điền đầy đủ thông tin vào file khách hàng (GG Sheet tổng)</CheckItem>
              <CheckItem id="iv_2_4">Gửi báo cáo lên nhóm hậu kiểm và xin ý kiến khách hàng</CheckItem>
              <CheckItem id="iv_2_5">Gắn tag <strong className="text-emerald-600">DV – Done</strong></CheckItem>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-base text-indigo-700 dark:text-indigo-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">V. BÁO CÁO & HẬU KIỂM</h3>
        <div className="space-y-2 pl-2">
          <div className="flex flex-col gap-0.5">
            <CheckItem id="v_1">Lưu toàn bộ báo cáo, phản hồi khách hàng</CheckItem>
            <CheckItem id="v_2">Tổng hợp đánh giá để cải tiến quy trình nội bộ</CheckItem>
          </div>
          <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded border-l-4 border-slate-500 text-sm">
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
