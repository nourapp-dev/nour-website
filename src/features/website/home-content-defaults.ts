import { WEBSITE_BOOKING_ENABLED } from "../../core/config/website-booking";
export const services = [
  {
    titleAr: "برامج وباقات العمرة",
    titleEn: "Umrah programs and packages",
    textAr:
      "خيارات مدروسة تناسب الاحتياجات والميزانيات المختلفة، مع تفاصيل واضحة لكل برنامج.",
    textEn:
      "Carefully designed options for different needs and budgets, with clear details for every program.",
    labelAr: "استكشف البرامج",
    labelEn: "Explore programs",
    icon: "packages",
    badgeAr: "",
    badgeEn: "",
  },
  {
    titleAr: "خدمات التأشيرات",
    titleEn: "Visa services",
    textAr:
      "إجراءات رقمية مبسطة تساعد على تجهيز المتطلبات ومتابعة حالة الطلب بوضوح.",
    textEn:
      "Simplified digital steps for preparing requirements and following application status clearly.",
    labelAr: "تعرف على الخدمة",
    labelEn: "Learn more",
    icon: "visa",
    badgeAr: "إجراءات مبسطة",
    badgeEn: "Simplified",
  },
  {
    titleAr: "حجوزات الفنادق",
    titleEn: "Hotel bookings",
    textAr:
      "خيارات سكن متنوعة بالقرب من الحرمين، مع مقارنة واضحة للموقع والخدمات والتكلفة.",
    textEn:
      "A range of accommodation near the holy mosques, with clear comparisons of location, service, and price.",
    labelAr: "استعرض الفنادق",
    labelEn: "Browse hotels",
    icon: "hotel",
  },
  {
    titleAr: "النقل والتنقلات",
    titleEn: "Transport and transfers",
    textAr:
      "تنسيق خدمات النقل بين المطار والسكن والمشاعر بما يمنح المعتمر راحة وطمأنينة أكبر.",
    textEn:
      "Coordinated transfers between airports, accommodation, and key destinations for greater comfort.",
    labelAr: "تفاصيل النقل",
    labelEn: "Transport details",
    icon: "transport",
    badgeAr: "تنسيق أسرع",
    badgeEn: "Faster coordination",
  },
  {
    titleAr: "الإرشاد والمساندة",
    titleEn: "Guidance and assistance",
    textAr:
      "معلومات وإرشادات عملية تساعد المعتمر على الاستعداد ومتابعة تفاصيل رحلته بثقة.",
    textEn:
      "Practical information and guidance helping pilgrims prepare and follow their journey confidently.",
    labelAr: "اعرف المزيد",
    labelEn: "Learn more",
    icon: "guidance",
  },
  {
    titleAr: WEBSITE_BOOKING_ENABLED ? "الدفع المرن" : "الحجز والدفع",
    titleEn: WEBSITE_BOOKING_ENABLED
      ? "Flexible payment"
      : "Booking and payment",
    textAr: WEBSITE_BOOKING_ENABLED
      ? "خيارات دفع آمنة ومرنة تساعدك على اختيار الطريقة الأنسب لميزانيتك وإتمام الحجز بسهولة."
      : "الحجز والدفع عبر الموقع متوقفان مؤقتًا. تواصل مع فريق نور آب للاستفسار عن البرامج والخدمات.",
    textEn: WEBSITE_BOOKING_ENABLED
      ? "Secure and flexible payment options that help you choose what fits your budget and complete booking easily."
      : "Website booking and payment are temporarily paused. Contact the NourApp team with questions about programs and services.",
    labelAr: WEBSITE_BOOKING_ENABLED ? "استعرض خيارات الدفع" : "تواصل معنا",
    labelEn: WEBSITE_BOOKING_ENABLED ? "View payment options" : "Contact us",
    icon: "payment",
    badgeAr: WEBSITE_BOOKING_ENABLED ? "خيارات متعددة" : "متوقف مؤقتًا",
    badgeEn: WEBSITE_BOOKING_ENABLED
      ? "Multiple options"
      : "Temporarily paused",
    paymentMethods: WEBSITE_BOOKING_ENABLED
      ? ["Tabby", "Tamara", "Visa", "Mastercard", "Apple Pay"]
      : undefined,
  },
];
export const reasons = [
  {
    id: "details",
    titleAr: "تفاصيل واضحة",
    titleEn: "Clear program details",
    descriptionAr:
      "راجع المدة والسكن والنقل والخدمات المنشورة لكل برنامج في مكان واحد.",
    descriptionEn:
      "Review each program’s published duration, accommodation, transport and services in one place.",
    icon: "FileText",
  },
  {
    id: "options",
    titleAr: "خيارات يسهل استعراضها",
    titleEn: "Easy-to-browse options",
    descriptionAr:
      "ابحث عن برامج العمرة وصفِّ الخيارات حسب بلد الانطلاق ومدة الرحلة.",
    descriptionEn:
      "Find Umrah programs and filter the options by departure country and trip duration.",
    icon: "SlidersHorizontal",
  },
  {
    id: "pricing",
    titleAr: "معلومات السعر",
    titleEn: "Price information",
    descriptionAr:
      "اطّلع على السعر الابتدائي، وما تنشره بيانات البرنامج عن المشمول وغير المشمول.",
    descriptionEn:
      "See the starting price and the program’s published details about what is included and excluded.",
    icon: "Tag",
  },
  {
    id: "contact",
    titleAr: "تواصل واستفسارات",
    titleEn: "Contact and enquiries",
    descriptionAr:
      "استفسر عن تفاصيل البرامج والخدمات عبر قنوات التواصل الموضّحة في الموقع.",
    descriptionEn:
      "Ask about programs and services through the contact channels listed on the website.",
    icon: "MessageCircle",
  },
];

export const priorities = [
  {
    valueAr: "اطّلاع",
    valueEn: "Browse",
    labelAr: "البرامج",
    labelEn: "Programs",
    descriptionAr: "استعرض بلد الانطلاق والمدة وتفاصيل البرنامج المنشورة.",
    descriptionEn:
      "Browse published departure countries, durations and program details.",
  },
  {
    valueAr: "وضوح",
    valueEn: "Clarity",
    labelAr: "الخدمات",
    labelEn: "Services",
    descriptionAr: "راجع معلومات الإقامة والنقل وما يشمله كل برنامج.",
    descriptionEn:
      "Review accommodation, transport and each program's inclusions.",
  },
  {
    valueAr: "خيارات",
    valueEn: "Explore",
    labelAr: "الوجهات",
    labelEn: "Origins",
    descriptionAr: "ابحث حسب بلد الانطلاق وتعرّف على الخيارات المنشورة.",
    descriptionEn: "Search by departure country and explore published options.",
  },
  {
    valueAr: "تواصل",
    valueEn: "Contact",
    labelAr: "الاستفسارات",
    labelEn: "Enquiries",
    descriptionAr: "تواصل معنا إذا احتجت إلى توضيح قبل اتخاذ قرارك.",
    descriptionEn: "Contact us if you need clarification before deciding.",
  },
];
