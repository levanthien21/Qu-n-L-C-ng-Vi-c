import { ExternalLink, AlertTriangle, CheckSquare, Square, Copy, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Customer } from '../domain/types';
import { ProgressBar } from './ui';
import { useState } from 'react';
import { sendTelegramMessage } from '../utils/telegram';

const CopyBox = ({ title, text }: { title?: string, text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-2 mb-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md p-3 relative group ml-4 shadow-sm">
      {title && <div className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 mb-1.5 uppercase tracking-wide flex items-center gap-1"><Copy size={12}/> {title}</div>}
      <pre className="text-[13px] text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">{text}</pre>
      <button 
         onClick={handleCopy}
         className="absolute top-2 right-2 p-1.5 rounded bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
         title="Copy nhanh"
      >
         {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
    </div>
  );
};

export function SOPGuide({ customer }: { customer: Customer }) {
  const updateCustomer = useStore(s => s.updateCustomer);
  const checklist = customer.sopChecklist || {};

  const totalItems = 48;
  const completedItems = Math.min(Object.values(checklist).filter(v => v).length, totalItems);
  const percent = Math.min(100, Math.round((completedItems / totalItems) * 100) || 0);

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
              <CopyBox title="Mẫu chào hỏi & Hẹn lịch Kick-off" text={"@Kháchhang Chào anh/chị ạ.\nEm là Thiện - team Support sẽ đồng hành cùng anh/chị trong suốt quá trình triển khai AI nhé.\n\nEm gửi anh/chị tài liệu và các link setup AI ạ:\n- Link đăng nhập hệ thống: https://retion.ai/\n- Docs hướng dẫn: https://bbh.gitbook.io/bot-ban-hang-docs\n- Mẫu kiến thức: https://docs.google.com/spreadsheets/d/1hLnX21ibVpiklAcj7cx6qwnkiSMIKWKKR_Go3Vv3oNo/edit?usp=sharing\n\n- Link điền kiến thức và khảo sát: [Link ggsheet]\n\nSáng/Chiều Thứ … - ngày …. Lúc 10h30 chị tiện trao đổi không ạ, để em tạo meeting hướng dẫn anh/chị chuẩn bị các thông tin cần thiết cho AI nha."} />
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
              <CopyBox title="Mẫu gửi sau buổi Kick-off" text={"Cảm ơn anh/chị @KH đã tham gia buổi triển khai hôm nay ạ.\n\nEm gửi lại record buổi họp để anh/chị tiện xem lại: [Link Sider]\n\nAnh/chị hỗ trợ em hoàn thiện Bản khảo sát + File kiến thức. Sau khi nhận đủ thông tin, bên em sẽ tổng hợp và setup AI test trong khoảng 3–5 ngày để gửi anh/chị test nhé.\n\n- Link đăng nhập hệ thống: https://retion.ai/\n- Docs hướng dẫn: https://bbh.gitbook.io/bot-ban-hang-docs\n- Mẫu kiến thức: https://docs.google.com/spreadsheets/d/1hLnX21ibVpiklAcj7cx6qwnkiSMIKWKKR_Go3Vv3oNo/edit?usp=sharing\n\n- Link điền kiến thức và khảo sát: https://docs.google.com/spreadsheets/d/1-xlSVKJkLcELkM7nPyuUVNqnSvo6NIYyvZvP36XhQGQ/edit?usp=sharing\n\n📌 Buổi tiếp theo: [Khung giờ] ngày … – Hướng dẫn sử dụng hệ thống Retion.\n\nTrong quá trình thực hiện, nếu có thắc mắc hoặc phần nào chưa rõ, anh/chị cứ nhắn trực tiếp lên nhóm để em hỗ trợ anh/chị nha."} />
              
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
              <CopyBox title="Mẫu gửi Link Meeting Buổi 2" text={"Em gửi anh/chị link meeting hôm nay ạ [Link ggmeet]"} />
              <CheckItem id="ii_2_2">Tiến hành meeting buổi 2, điền đủ thông tin và yêu cầu khách xác nhận vào sheet Lộ trình triển khai</CheckItem>
              <CopyBox title="Mẫu gửi sau khi xong Buổi 2" text={"Dạ em cảm ơn anh/chị @KH đã tham gia buổi hướng dẫn hôm nay ạ.\n\n🎥 Record buổi họp : [Link sider]\n\nAnh/chị hỗ trợ em chuẩn bị thêm:\n- Rep comment (Khi khách vào từ bài viết): 3 câu rep Comment + 1 tin nhắn gửi khách + Kịch bản chăm sóc khách hàng khi chưa phản hồi\n-> Mẫu chuỗi CSKH: https://docs.google.com/spreadsheets/d/1k9_069Hk438cpVaQAt2SCoRPU6f800Bza5KxEfXZ4ac/edit?gid=1779037664#gid=1779037664\n\nCó phần nào chưa rõ, anh/chị cứ nhắn trực tiếp lên nhóm để em hỗ trợ nhé."} />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">3. Chuẩn bị file training AI</h4>
            <div className="flex flex-col gap-0.5">
              <CheckItem id="ii_3_1">Gửi file mẫu kiến thức mô tả chi tiết cho khách và hướng dẫn cách điền</CheckItem>
              <CheckItem id="ii_3_2">Xác nhận rõ ai là người phụ trách làm kiến thức ở phía khách hàng</CheckItem>
              <CheckItem id="ii_3_3">Deadline khách điền kiến thức: 03 - 05 ngày (báo rõ với khách)</CheckItem>
              <CopyBox title="Mẫu CSKH hằng ngày (Khách đang làm kiến thức)" text={"1. @KH Dạ em chào anh __. Trong quá trình hoàn thiện Bản khảo sát và File kiến thức, nếu có nội dung nào chưa rõ hoặc cần em hỗ trợ, anh/chị cứ nhắn lên nhóm để em hỗ trợ anh/chị nhé.\nSau khi nhận đủ thông tin, em sẽ tổng hợp và tiến hành setup AI bản test trong khoảng 3–5 ngày ạ.\n\n2. @KH Anh/chị ơi, file kiến thức mình cập nhật bổ sung lại chưa anh/chị ha. Có thắc mắc phần nào nhắn lên để em hỗ trợ anh/chị để triển khai AI sớm nhất ạ.\n\n3. Chào anh @KH, trong quá trình điền file kiến thức, có phần nào thắc mắc nhắn em hỗ trợ anh/chị nha."} />
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
              <CopyBox title="Mẫu Xác nhận khi nhận đủ kiến thức" text={"Em nhận được file kiến thức của anh/chị rồi nha.\nEm sẽ tiến hành setup AI trên page test anh/chị nhé, thời gian setup từ 3-5 ngày ạ. Khi hoàn thiện em sẽ gửi anh/chị [Tên KH] ngay ạ."} />
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
              <CopyBox title="Mẫu Thông báo đưa lên Page Chính" text={"Dạ hôm nay em sẽ tiến hành thiết lập và đưa AI sang page chính cho anh/chị ạ.\n\nSau khi hoàn tất cài đặt và kiểm tra, em sẽ thông báo lên nhóm để mọi người tiện theo dõi nha."} />
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
            <CopyBox title="Mẫu CSKH đầu tháng/giữa tháng" text={"@All Dạ em chào anh/chị tháng mới ạ\n\nThời gian qua AI bên mình tư vấn khách hàng có ổn định không ạ? Nếu có điểm nào chưa phù hợp, anh/chị phản hồi để bên em hỗ trợ tối ưu thêm nhé.\n\nAI V3 hiện đã nâng cấp: phân tích hình ảnh tốt hơn, trả lời ngắn gọn – tự nhiên hơn, đồng thời ghi nhớ thông tin khách hàng và sản phẩm đã tư vấn để hỗ trợ xuyên suốt cuộc trò chuyện ạ."} />
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
          <CopyBox title="Mẫu Hẹn lịch Buổi 3 (Bàn giao & Nghiệm thu)" text={"@KH Dạ anh/chị ơi, [Thứ_ ] tuần tới mình có trống lịch buổi nào không ạ, để em triển khai Buổi 3 – Hướng dẫn các tính năng nâng cao trên hệ thống và bàn giao AI cho mình nhé.\n\nBuổi này bên em sẽ hỗ trợ anh/chị:\n- Hướng dẫn các tính năng : Trợ lý ảo nội bộ, huấn luyện bài viết, chỉnh sửa & tối ưu, tự động gắn thẻ hội thoại bằng AI và thống kê.\n- Review lại toàn bộ các hạng mục đã triển khai.\n- Giải đáp và hỗ trợ các nội dung cần điều chỉnh.\n- Hướng dẫn bàn giao, kiểm tra và xác nhận nghiệm thu hệ thống.\n\nAnh/Chị sắp xếp giúp em thời gian phù hợp, em chủ động gửi lịch meeting cho mình ạ."} />
          
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
