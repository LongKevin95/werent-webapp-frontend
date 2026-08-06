import { Clock3, Home, Mail, MapPin, Phone } from "lucide-react";

const footerColumns = [
  {
    title: "VỀ WERENT",
    items: ["Giới thiệu", "Blog", "Tuyển dụng", "Liên hệ"],
  },
  {
    title: "QUY ĐỊNH",
    items: [
      "Quy định đăng tin",
      "Quy chế hoạt động",
      "Điều khoản thỏa thuận",
      "Chính sách bảo mật",
      "Giải quyết khiếu nại",
    ],
  },
  {
    title: "HỖ TRỢ",
    items: [
      "Trung tâm trợ giúp",
      "Điều khoản sử dụng",
      "Chính sách bảo mật",
      "Chính sách thanh toán",
    ],
  },
];

const socialLinks = [
  { className: "bg-[#1877F2] text-white", label: "Facebook", text: "f" },
  { className: "bg-[#0A84FF] text-white", label: "Zalo", text: "Zalo" },
  { className: "bg-[#FF1F1F] text-white", label: "YouTube", text: "▶" },
  { className: "bg-black text-white", label: "TikTok", text: "♪" },
];

const contactItems = [
  {
    icon: MapPin,
    text: "Tòa nhà WeRent, 1 Trường Chinh, Phường Bảy Hiền, Tp. HCM",
  },
  { icon: Phone, text: "1900 1234" },
  { icon: Mail, text: "support@werent.vn" },
  { icon: Clock3, text: "8:00 - 22:00 (T2 - CN)" },
];

function AppFooter() {
  return (
    <footer className="mt-8 rounded-[18px] border border-[#E3E9E5] bg-[linear-gradient(90deg,#F8FBF5_0%,#F4F9F3_45%,#EDF3EB_100%)] px-8 py-11 shadow-[0_14px_36px_rgba(41,63,50,0.06)] sm:px-12 lg:px-14">
      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr_1.25fr_1fr_1.35fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-[#E8F5EC] text-[#12803A]">
              <Home className="size-8" />
            </span>
            <div>
              <p className="text-[28px] font-bold leading-none text-[#12803A]">
                WeRent
              </p>
              <p className="mt-3 text-[13px] font-medium text-[#66707A]">
                Thuê nhà dễ dàng, an tâm mỗi ngày
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-[300px] text-[15px] leading-7 text-[#4F5965]">
            WeRent là nền tảng kết nối người thuê và người cho thuê uy tín,
            nhanh chóng và an toàn.
          </p>

          <div className="mt-6 flex items-center gap-4">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                aria-label={item.label}
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold shadow-sm transition hover:-translate-y-0.5 ${item.className}`}
                href="#"
              >
                {item.text}
              </a>
            ))}
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="text-[13px] font-bold uppercase text-[#303847]">
              {column.title}
            </h3>
            <ul className="mt-5 space-y-4 text-[15px] font-medium text-[#303847]">
              {column.items.map((item) => (
                <li key={item}>
                  <a className="transition hover:text-[#12803A]" href="#">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-[13px] font-bold uppercase text-[#303847]">
            LIÊN HỆ
          </h3>
          <ul className="mt-5 space-y-4 text-[15px] font-medium leading-6 text-[#303847]">
            {contactItems.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-[#12803A]" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-[#DDE3DF] pt-5 text-center text-[15px] font-medium text-[#6E7784]">
        © 2025 WeRent. All rights reserved.
      </div>
    </footer>
  );
}

export default AppFooter;
