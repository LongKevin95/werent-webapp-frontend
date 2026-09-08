const FAQ_ITEMS = [
  {
    aliases: ["cach dang tin", "dang tin cho thue", "lam sao dang tin"],
    answer: {
      bullets: [
        "Tài khoản cần đăng nhập và có KYC được duyệt.",
        "Tin đăng nên có địa chỉ rõ, giá thuê, cọc, diện tích, tiện ích và ảnh thật.",
        "Nếu đăng tin có phí, hệ thống sẽ kiểm tra ví trước khi gửi duyệt.",
      ],
      intro: "Để đăng tin cho thuê trên WeRent, bạn có thể làm theo luồng này:",
      note: "Sau khi gửi, tin thường vào trạng thái chờ duyệt. Khi được duyệt, tin mới hiển thị công khai.",
      steps: [
        "Vào mục Đăng tin.",
        "Chọn loại bất động sản và nhập thông tin cơ bản.",
        "Thêm địa chỉ, vị trí bản đồ, ảnh/video và mô tả.",
        "Chọn gói hiển thị, kiểm tra phí và gửi duyệt.",
      ],
    },
    category: "listing",
    id: "post-listing-how",
    question: "Cách đăng tin cho thuê",
    related: [
      "post-listing-requirements",
      "listing-photos",
      "vip-difference",
      "listing-rejected",
    ],
  },
  {
    aliases: ["dieu kien dang tin", "tai sao chua dang tin duoc"],
    answer: {
      bullets: [
        "Bạn đã đăng nhập tài khoản WeRent.",
        "Hồ sơ KYC tài khoản đã được admin duyệt.",
        "Tài khoản không bị khóa hoặc giới hạn quyền đăng tin.",
        "Ví đủ số dư nếu gói đăng tin cần thanh toán.",
      ],
      intro: "Điều kiện quan trọng nhất để đăng tin là tài khoản phải đủ tin cậy.",
      note: "Nếu chưa đủ điều kiện, hãy vào Hồ sơ để kiểm tra trạng thái KYC trước.",
    },
    category: "listing",
    id: "post-listing-requirements",
    question: "Tại sao tôi chưa đăng tin được?",
    related: ["kyc-how", "kyc-review-time", "wallet-topup", "listing-verification"],
  },
  {
    aliases: ["anh dang tin", "can bao nhieu anh", "anh phong"],
    answer: {
      bullets: [
        "Nên dùng ảnh thật, sáng rõ, không che khuất phòng.",
        "Có đủ ảnh phòng ngủ/khu sinh hoạt, WC, bếp, lối vào và view nếu có.",
        "Tránh ảnh có watermark, số điện thoại chèn trực tiếp hoặc ảnh lấy từ nơi khác.",
        "Ảnh đầu tiên nên là ảnh dễ hiểu nhất về không gian chính.",
      ],
      intro: "Ảnh tốt giúp tin được duyệt nhanh hơn và tăng khả năng người thuê liên hệ.",
      note: "Nếu ảnh quá mờ hoặc không liên quan, admin có thể yêu cầu chỉnh sửa trước khi hiển thị.",
    },
    category: "listing",
    id: "listing-photos",
    question: "Ảnh tin đăng nên chuẩn bị thế nào?",
    related: ["post-listing-how", "listing-rejected", "listing-verification"],
  },
  {
    aliases: ["tin bi tu choi", "vi sao tin bi tu choi", "tin khong duoc duyet"],
    answer: {
      bullets: [
        "Thiếu ảnh thật hoặc ảnh quá mờ.",
        "Thông tin giá, địa chỉ, diện tích hoặc liên hệ không rõ.",
        "Nội dung có dấu hiệu spam, sai sự thật hoặc trùng lặp.",
        "Tin vi phạm chính sách an toàn hoặc có dấu hiệu rủi ro cho người thuê.",
      ],
      intro: "Tin đăng có thể bị từ chối khi chưa đủ thông tin hoặc chưa đạt tiêu chuẩn tin cậy.",
      note: "Bạn nên đọc lý do từ admin, chỉnh lại nội dung rồi gửi duyệt lại.",
    },
    category: "listing",
    id: "listing-rejected",
    question: "Vì sao tin đăng bị từ chối?",
    related: ["listing-photos", "listing-edit", "listing-verification"],
  },
  {
    aliases: ["sua tin dang", "cap nhat tin dang", "sua tin da duyet"],
    answer: {
      bullets: [
        "Chủ tin có thể sửa thông tin cơ bản, ảnh và trạng thái hiển thị.",
        "Nếu sửa nội dung quan trọng, tin có thể quay lại trạng thái chờ duyệt.",
        "Tin bị admin ẩn vì vi phạm cần chỉnh lý do vi phạm trước khi gửi lại.",
      ],
      intro: "Bạn có thể chỉnh sửa tin trong mục Tin đăng của tôi.",
      note: "Việc duyệt lại giúp bảo vệ người thuê khỏi thông tin bị thay đổi sai lệch sau khi công khai.",
    },
    category: "listing",
    id: "listing-edit",
    question: "Có thể sửa tin sau khi đăng không?",
    related: ["listing-rejected", "post-listing-how", "vip-difference"],
  },
  {
    aliases: ["kyc", "xac thuc kyc", "xac minh tai khoan"],
    answer: {
      bullets: [
        "Thông tin cá nhân nên trùng với giấy tờ bạn tải lên.",
        "Ảnh giấy tờ cần rõ mặt trước, mặt sau và không bị cắt góc.",
        "Selfie nên thấy rõ khuôn mặt, không dùng ảnh chụp lại từ màn hình.",
      ],
      intro: "Để xác thực KYC trên WeRent, bạn thực hiện theo các bước sau:",
      note: "KYC được duyệt giúp tài khoản có quyền đăng tin và tăng độ tin cậy trên nền tảng.",
      steps: [
        "Vào Hồ sơ cá nhân.",
        "Chọn Xác thực KYC.",
        "Điền thông tin cá nhân và tải giấy tờ theo hướng dẫn.",
        "Gửi hồ sơ và chờ admin duyệt.",
      ],
    },
    category: "kyc",
    id: "kyc-how",
    question: "Xác thực KYC thế nào?",
    related: ["kyc-documents", "kyc-review-time", "kyc-rejected", "kyc-edit"],
  },
  {
    aliases: ["giay to kyc", "can giay to gi", "cccd kyc"],
    answer: {
      bullets: [
        "CCCD/CMND hoặc hộ chiếu còn rõ thông tin.",
        "Ảnh mặt trước và mặt sau giấy tờ nếu là CCCD/CMND.",
        "Ảnh selfie để đối chiếu người gửi hồ sơ.",
        "Thông tin email và số điện thoại trong hồ sơ tài khoản.",
      ],
      intro: "Thông thường bạn cần chuẩn bị các giấy tờ và thông tin sau:",
      note: "Không gửi giấy tờ cá nhân qua chatbot. Chỉ tải lên trong form KYC chính thức của WeRent.",
    },
    category: "kyc",
    id: "kyc-documents",
    question: "KYC cần giấy tờ gì?",
    related: ["kyc-how", "kyc-review-time", "kyc-rejected"],
  },
  {
    aliases: ["kyc bao lau", "duyet kyc mat bao lau", "thoi gian duyet kyc"],
    answer: {
      bullets: [
        "Hồ sơ rõ và đầy đủ thường được xử lý nhanh hơn.",
        "Hồ sơ thiếu ảnh, mờ thông tin hoặc sai dữ liệu có thể cần bổ sung.",
        "Bạn sẽ nhận thông báo khi admin duyệt hoặc yêu cầu cập nhật.",
      ],
      intro: "Thời gian duyệt KYC phụ thuộc vào chất lượng hồ sơ và số lượng yêu cầu đang chờ.",
      note: "Trong bản demo hoặc môi trường học tập, thời gian duyệt có thể phụ thuộc vào admin đang vận hành hệ thống.",
    },
    category: "kyc",
    id: "kyc-review-time",
    question: "KYC mất bao lâu để duyệt?",
    related: ["kyc-documents", "kyc-rejected", "post-listing-requirements"],
  },
  {
    aliases: ["kyc bi tu choi", "vi sao kyc bi tu choi", "bo sung kyc"],
    answer: {
      bullets: [
        "Ảnh giấy tờ bị mờ, thiếu mặt trước/mặt sau hoặc bị che thông tin.",
        "Thông tin nhập không khớp giấy tờ.",
        "Selfie không rõ mặt hoặc không đủ điều kiện đối chiếu.",
        "Giấy tờ không thuộc loại được hệ thống chấp nhận.",
      ],
      intro: "KYC bị từ chối thường do hồ sơ chưa đủ rõ hoặc chưa khớp thông tin.",
      note: "Bạn nên xem lý do từ admin, chỉnh đúng phần được yêu cầu rồi gửi lại.",
    },
    category: "kyc",
    id: "kyc-rejected",
    question: "Vì sao KYC bị từ chối?",
    related: ["kyc-documents", "kyc-edit", "kyc-how"],
  },
  {
    aliases: ["sua thong tin kyc", "doi thong tin kyc", "cap nhat kyc"],
    answer: {
      bullets: [
        "Nếu hồ sơ chưa duyệt hoặc bị yêu cầu bổ sung, bạn có thể cập nhật theo hướng dẫn.",
        "Nếu đã duyệt nhưng thông tin cá nhân thay đổi, nên liên hệ bộ phận hỗ trợ hoặc admin.",
        "Không nên tạo nhiều hồ sơ KYC khác nhau cho cùng một người.",
      ],
      intro: "Việc sửa thông tin KYC phụ thuộc vào trạng thái hồ sơ hiện tại.",
      note: "Mục tiêu là giữ thông tin tài khoản nhất quán và tránh hồ sơ trùng lặp.",
    },
    category: "kyc",
    id: "kyc-edit",
    question: "Có thể sửa thông tin KYC không?",
    related: ["kyc-rejected", "kyc-documents", "post-listing-requirements"],
  },
  {
    aliases: ["nap vi", "nap tien", "nap tien vao vi"],
    answer: {
      bullets: [
        "Vào Ví tiền hoặc Nạp tiền.",
        "Chọn số tiền và phương thức thanh toán đang được hỗ trợ.",
        "Hoàn tất thanh toán theo hướng dẫn của cổng thanh toán.",
        "Kiểm tra lại số dư và lịch sử giao dịch sau khi thanh toán.",
      ],
      intro: "Bạn có thể nạp tiền vào ví WeRent để thanh toán gói đăng tin.",
      note: "Nếu giao dịch đã trừ tiền nhưng ví chưa cập nhật, hãy lưu mã giao dịch để đối soát.",
    },
    category: "payment",
    id: "wallet-topup",
    question: "Cách nạp tiền vào ví",
    related: ["wallet-payment-failed", "wallet-deduct-time", "vip-difference"],
  },
  {
    aliases: ["khi nao tru tien", "vi bi tru tien luc nao", "thanh toan goi dang tin"],
    answer: {
      bullets: [
        "Khi bạn gửi tin có chọn gói trả phí, hệ thống sẽ kiểm tra số dư ví.",
        "Nếu đủ số dư, phí gói đăng tin được ghi nhận cho tin đó.",
        "Nếu quá trình tạo tin lỗi sau khi upload ảnh, hệ thống cần tránh tạo giao dịch sai hoặc sẽ được đối soát.",
      ],
      intro: "Tiền thường được xử lý khi bạn xác nhận gửi tin với gói đăng tin có phí.",
      note: "Bạn có thể kiểm tra giao dịch trong lịch sử ví để biết tin nào đã dùng phí.",
    },
    category: "payment",
    id: "wallet-deduct-time",
    question: "Khi nào ví bị trừ tiền?",
    related: ["wallet-topup", "wallet-payment-failed", "post-listing-how"],
  },
  {
    aliases: ["thanh toan that bai", "nap tien that bai", "vi chua cap nhat"],
    answer: {
      bullets: [
        "Kiểm tra lại kết nối mạng và trạng thái giao dịch.",
        "Xem lịch sử ví để biết giao dịch đang chờ, thành công hay thất bại.",
        "Nếu tiền đã bị trừ ở ngân hàng nhưng ví chưa cập nhật, lưu mã giao dịch và liên hệ hỗ trợ.",
        "Không thực hiện quá nhiều lần liên tiếp nếu chưa rõ trạng thái giao dịch cũ.",
      ],
      intro: "Khi thanh toán hoặc nạp ví thất bại, bạn nên kiểm tra theo thứ tự sau:",
      note: "Thông tin đối soát nên gồm mã giao dịch, thời gian, số tiền và phương thức thanh toán.",
    },
    category: "payment",
    id: "wallet-payment-failed",
    question: "Thanh toán thất bại thì làm gì?",
    related: ["wallet-topup", "wallet-deduct-time"],
  },
  {
    aliases: ["tin vip", "goi vip", "vip khac gi"],
    answer: {
      bullets: [
        "Gói cao hơn thường giúp tin nổi bật hơn trong danh sách hoặc khu vực hiển thị.",
        "Thời hạn và phí có thể khác nhau tùy gói.",
        "Tin vẫn cần nội dung rõ, ảnh tốt và tuân thủ kiểm duyệt.",
      ],
      intro: "Tin VIP chủ yếu giúp tăng khả năng người thuê nhìn thấy tin của bạn.",
      note: "Gói hiển thị không thay thế việc xác thực thông tin. Tin chất lượng vẫn là yếu tố quan trọng nhất.",
    },
    category: "package",
    id: "vip-difference",
    question: "Tin VIP có gì khác?",
    related: ["package-expire", "post-listing-how", "listing-photos"],
  },
  {
    aliases: ["tin het han", "goi het han", "het thoi gian hien thi"],
    answer: {
      bullets: [
        "Tin có thể giảm ưu tiên hoặc ngừng hiển thị theo cấu hình gói.",
        "Bạn nên kiểm tra mục Tin đăng của tôi để gia hạn hoặc cập nhật lại tin.",
        "Nếu phòng đã cho thuê, nên ẩn tin để tránh người thuê tiếp tục liên hệ.",
      ],
      intro: "Khi gói đăng tin hết hạn, trạng thái hiển thị có thể thay đổi tùy loại gói.",
      note: "Gia hạn tin đúng lúc giúp tránh mất lượt tiếp cận từ người thuê.",
    },
    category: "package",
    id: "package-expire",
    question: "Tin hết hạn thì sao?",
    related: ["vip-difference", "listing-edit", "wallet-topup"],
  },
  {
    aliases: ["xac thuc tin dang", "chinh chu", "uy quyen cho thue"],
    answer: {
      bullets: [
        "KYC xác thực tài khoản người đăng.",
        "Xác thực tin đăng chứng minh quyền cho thuê hoặc thông tin căn nhà đáng tin hơn.",
        "Có thể cần giấy tờ sở hữu, hợp đồng ủy quyền hoặc tài liệu liên quan tùy trường hợp.",
      ],
      intro: "Xác thực tin đăng khác với KYC tài khoản.",
      note: "Tin được xác thực giúp người thuê yên tâm hơn, nhưng vẫn nên kiểm tra thực tế trước khi đặt cọc.",
    },
    category: "verification",
    id: "listing-verification",
    question: "Xác thực tin đăng là gì?",
    related: ["kyc-how", "post-listing-requirements", "safety-scam"],
  },
  {
    aliases: ["tim nha", "tim phong", "loc tin dang"],
    answer: {
      bullets: [
        "Khu vực hoặc địa điểm muốn ở gần.",
        "Ngân sách thuê hàng tháng và tiền cọc tối đa.",
        "Loại nhà: phòng trọ, căn hộ, nhà riêng hoặc mặt bằng.",
        "Tiện ích cần có như máy lạnh, nội thất, bảo vệ, chỗ xe, thang máy.",
      ],
      intro: "Để tìm nhà hiệu quả trên WeRent, bạn nên bắt đầu bằng các tiêu chí rõ ràng.",
      note: "Ví dụ tốt: Căn hộ 2 phòng ngủ ở Quận 7 dưới 15 triệu, ưu tiên full nội thất.",
    },
    category: "search",
    id: "search-how",
    question: "Cách tìm nhà hiệu quả",
    related: ["search-budget", "favorites-how", "compare-listings"],
  },
  {
    aliases: ["ngan sach thue nha", "chon phong theo gia", "duoi 5 trieu"],
    answer: {
      bullets: [
        "Tính cả tiền thuê, cọc, điện, nước, internet, gửi xe và phí dịch vụ.",
        "Ưu tiên khu vực giúp giảm thời gian di chuyển mỗi ngày.",
        "Nếu ngân sách thấp, hãy cân nhắc phòng nhỏ hơn hoặc xa trung tâm hơn một chút.",
        "Đừng chỉ nhìn giá thuê, hãy so tổng chi phí tháng đầu và chi phí hàng tháng.",
      ],
      intro: "Ngân sách thuê nhà nên được tính theo tổng chi phí, không chỉ tiền thuê.",
      note: "Một phòng rẻ hơn nhưng đi lại xa hơn đôi khi không tiết kiệm bằng phòng gần nơi học/làm.",
    },
    category: "search",
    id: "search-budget",
    question: "Nên chọn nhà theo ngân sách thế nào?",
    related: ["search-how", "compare-listings", "safety-scam"],
  },
  {
    aliases: ["yeu thich", "luu tin", "tin da luu"],
    answer: {
      bullets: [
        "Bấm biểu tượng trái tim trên tin để lưu vào danh sách yêu thích.",
        "Vào mục Yêu thích để xem lại các tin đã lưu.",
        "Bạn nên lưu các tin đang phân vân để so sánh trước khi liên hệ.",
      ],
      intro: "Tính năng Yêu thích giúp bạn không mất các tin phù hợp khi đang tìm nhà.",
      note: "Nếu chưa đăng nhập, hệ thống có thể yêu cầu đăng nhập trước khi lưu.",
    },
    category: "search",
    id: "favorites-how",
    question: "Lưu tin yêu thích thế nào?",
    related: ["compare-listings", "search-how", "contact-owner"],
  },
  {
    aliases: ["so sanh tin", "so sanh listing", "chon giua hai phong"],
    answer: {
      bullets: [
        "Tổng chi phí tháng đầu: tiền thuê, cọc và phí phát sinh.",
        "Vị trí so với nơi học/làm và thời gian di chuyển.",
        "Diện tích, ánh sáng, nội thất, an ninh và tiện ích.",
        "Điều khoản thuê: thời hạn tối thiểu, số người ở, thú cưng, giờ giấc.",
      ],
      intro: "Khi so sánh listing, bạn nên nhìn cả chi phí, vị trí và điều kiện sống.",
      note: "Ở bản hiện tại, tôi có thể hướng dẫn tiêu chí. Bước tiếp theo sẽ cho AI lấy listing thật từ WeRent để so sánh tự động.",
    },
    category: "search",
    id: "compare-listings",
    question: "Nên so sánh 2 tin theo tiêu chí nào?",
    related: ["search-budget", "favorites-how", "safety-scam"],
  },
  {
    aliases: ["lien he chu nha", "goi chu nha", "dat lich xem phong"],
    answer: {
      bullets: [
        "Đọc kỹ mô tả, giá, cọc, phí điện nước và quy định nhà.",
        "Lưu lại tin để so sánh nếu bạn đang phân vân.",
        "Khi liên hệ, hỏi rõ phòng còn trống không, ngày vào ở và chi phí phát sinh.",
        "Nên xem phòng thực tế trước khi đặt cọc.",
      ],
      intro: "Trước khi liên hệ chủ nhà, bạn nên kiểm tra nhanh các thông tin quan trọng.",
      note: "Không chia sẻ OTP, mật khẩu hoặc thông tin nhạy cảm cho bất kỳ ai.",
    },
    category: "search",
    id: "contact-owner",
    question: "Trước khi liên hệ chủ nhà cần hỏi gì?",
    related: ["safety-scam", "compare-listings", "report-listing"],
  },
  {
    aliases: ["bao cao tin", "tin sai", "tin lua dao", "report listing"],
    answer: {
      bullets: [
        "Mở tin đăng cần báo cáo.",
        "Chọn chức năng Báo cáo hoặc liên hệ hỗ trợ nếu chưa thấy nút báo cáo.",
        "Chọn lý do: sai thông tin, đã cho thuê, nghi ngờ lừa đảo, ảnh không đúng hoặc nội dung vi phạm.",
        "Gửi thêm mô tả ngắn để admin kiểm tra nhanh hơn.",
      ],
      intro: "Nếu thấy tin sai hoặc có dấu hiệu rủi ro, bạn nên báo cáo để WeRent kiểm tra.",
      note: "Báo cáo đúng giúp cộng đồng tìm nhà an toàn hơn.",
    },
    category: "safety",
    id: "report-listing",
    question: "Làm sao báo cáo tin sai?",
    related: ["safety-scam", "contact-owner", "listing-verification"],
  },
  {
    aliases: ["tranh lua dao", "an toan thue nha", "dat coc an toan"],
    answer: {
      bullets: [
        "Cảnh giác với giá quá rẻ so với khu vực.",
        "Không chuyển cọc khi chưa xem phòng hoặc chưa xác minh người nhận.",
        "Không gửi OTP, mật khẩu, ảnh giấy tờ cá nhân qua chat.",
        "Ưu tiên tin có thông tin rõ, ảnh thật, chủ nhà phản hồi minh bạch.",
        "Báo cáo ngay nếu tin yêu cầu chuyển tiền bất thường.",
      ],
      intro: "Khi thuê nhà online, bạn nên kiểm tra kỹ trước khi đặt cọc.",
      note: "WeRent hỗ trợ tăng độ tin cậy, nhưng quyết định giao dịch vẫn cần bạn kiểm tra thực tế.",
    },
    category: "safety",
    id: "safety-scam",
    question: "Làm sao tránh tin lừa đảo?",
    related: ["report-listing", "listing-verification", "contact-owner"],
  },
];

export const POPULAR_FAQ_IDS = [
  "post-listing-how",
  "kyc-how",
  "wallet-topup",
  "vip-difference",
];

export const MORE_FAQ_GROUPS = [
  [
    "post-listing-requirements",
    "listing-rejected",
    "listing-verification",
    "search-how",
  ],
  ["kyc-documents", "kyc-review-time", "wallet-payment-failed", "safety-scam"],
  ["compare-listings", "favorites-how", "contact-owner", "report-listing"],
];

const FAQ_BY_ID = new Map(FAQ_ITEMS.map((item) => [item.id, item]));

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFaqById(id) {
  return FAQ_BY_ID.get(id) ?? null;
}

export function getFaqItems(ids) {
  return ids.map(getFaqById).filter(Boolean);
}

export function findFaqByQuestion(question) {
  const normalizedQuestion = normalizeText(question);

  if (!normalizedQuestion) {
    return null;
  }

  return (
    FAQ_ITEMS.find((item) => {
      const candidates = [item.question, ...(item.aliases ?? [])].map(normalizeText);

      return candidates.some(
        (candidate) =>
          candidate === normalizedQuestion ||
          (candidate.length >= 8 && normalizedQuestion.includes(candidate)),
      );
    }) ?? null
  );
}

export function getRelatedFaqIdsForText(text) {
  const normalizedText = normalizeText(text);

  if (/\bkyc|xac thuc|xac minh|cccd|cmnd|ho chieu\b/.test(normalizedText)) {
    return ["kyc-how", "kyc-documents", "kyc-review-time", "kyc-rejected"];
  }

  if (/\bdang tin|cho thue|tin dang|duyet tin|anh\b/.test(normalizedText)) {
    return [
      "post-listing-how",
      "post-listing-requirements",
      "listing-photos",
      "listing-rejected",
    ];
  }

  if (/\bvi|nap|thanh toan|tien|phi|goi|vip\b/.test(normalizedText)) {
    return ["wallet-topup", "wallet-deduct-time", "wallet-payment-failed", "vip-difference"];
  }

  if (/\btim|thue|phong|can ho|nha|listing|so sanh|yeu thich\b/.test(normalizedText)) {
    return ["search-how", "search-budget", "compare-listings", "favorites-how"];
  }

  if (/\blua dao|bao cao|an toan|dat coc|sai thong tin\b/.test(normalizedText)) {
    return ["safety-scam", "report-listing", "listing-verification", "contact-owner"];
  }

  return ["kyc-how", "post-listing-how", "wallet-topup", "search-how"];
}
