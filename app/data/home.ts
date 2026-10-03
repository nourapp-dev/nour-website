import type { Variants } from "framer-motion";
import { WEBSITE_BOOKING_ENABLED } from "../../src/core/config/website-booking";

export type Language = "ar" | "en";
export type Theme = "light" | "dark";
export type SectionId = "home" | "programs" | "journey" | "about" | "contact";

export const sectionIds: SectionId[] = ["home", "programs", "journey", "about", "contact"];

export const copy = {
  ar: {
    nav: ["الرئيسية", "برامج العمرة", "كيف تعمل نور", "عن نور", "تواصل معنا"],
    heroEyebrow: "تطبيق  نور آب للعمرة",
    heroTitle: "رحلتك إلى العمرة تبدأ من  نور آب",
    heroText: "اكتشف برامج عمرة متنوعة، قارن بين الباقات والخدمات، وأكمل حجزك بسهولة ضمن تجربة رقمية واضحة وآمنة.",
    discover: "اكتشف  نور آب",
    contact: "تواصل معنا",
    goalsTitle: "أهداف  نور آب",
    goals: [["سهولة الوصول", "إلى برامج وخدمات العمرة"], ["تجربة مريحة", "من البحث وحتى الحجز"], ["كفاءة أعلى", "في إدارة تفاصيل الرحلة"], ["وضوح وثقة", "في الخدمات والأسعار"]],
    aboutLabel: "عن  نور آب",
    aboutTitle: "منصة ذكية لرحلة عمرة أكثر راحة",
    aboutText: " نور آب منصة رقمية متكاملة تجمع برامج العمرة، السكن، النقل والخدمات المساندة في تجربة واحدة واضحة، لتمنح المعتمر رحلة أكثر سهولة وثقة من لحظة الاختيار وحتى إتمام الرحلة.",
    featuresLabel: "ماذا نقدم",
    featuresTitle: "أفضل المزايا في تطبيق واحد",
    features: [["باقات عمرة متنوعة", "خيارات تناسب الاحتياجات والميزانيات المختلفة."], ["واجهة سهلة الاستخدام", "تجربة بسيطة وواضحة لجميع المستخدمين."], ["حجز سريع ومباشر", "إجراءات مختصرة ووثائق واضحة."], ["شراكات موثوقة", "مقدمو خدمات معتمدون وجودة يمكن الاعتماد عليها."], ["دعم على مدار الساعة", "مساندة مستمرة خلال مراحل الرحلة."], ["الأمان والخصوصية", "حماية البيانات والمعاملات الرقمية."]],
    showcaseTitle: "كل ما يحتاجه المعتمر في تطبيق واحد",
    showcaseText: "استعرض البرامج، راجع تفاصيل الرحلة، وتابع السكن والنقل والخدمات من خلال تجربة متكاملة.",
    ctaTitle: "رفيق رحلتك إلى السعادة",
    ctaText: "تطبيق  نور آب سيكون متاحًا قريبًا على Android وiOS.",
    journeyLabel: "كيف يعمل  نور آب؟",
    journeyTitle: "رحلتك تبدأ في أربع خطوات بسيطة",
    journeyText: "من اختيار برنامج العمرة إلى متابعة تفاصيل الرحلة، تجمع  نور آب كل الخطوات في تجربة رقمية واحدة.",
    journeySteps: [
      { number: "01", title: "استعرض البرامج", text: "تصفح برامج وباقات العمرة المتاحة واختر ما يناسب احتياجاتك." },
      { number: "02", title: "قارن الخدمات", text: "قارن بين السكن والنقل والخدمات والأسعار بكل وضوح." },
      { number: "03", title: WEBSITE_BOOKING_ENABLED ? "أكمل الحجز" : "الحجز الإلكتروني", text: WEBSITE_BOOKING_ENABLED ? "أدخل بياناتك، اختر وسيلة الدفع، وأكد الحجز بأمان." : "الحجز عبر الموقع متوقف مؤقتًا. سنعلن هنا عند تفعيل الخدمة." },
      { number: "04", title: WEBSITE_BOOKING_ENABLED ? "تابع رحلتك" : "تواصل معنا", text: WEBSITE_BOOKING_ENABLED ? "احصل على تفاصيل البرنامج والتحديثات من خلال تطبيق نور آب." : "تواصل مع فريق نور آب للاستفسار عن البرامج والخدمات." },
    ],
    footer: "© 2026  نور آب. جميع الحقوق محفوظة.",
    lang: "English",
  },
  en: {
    nav: ["Home", "Umrah programs", "How it works", "About Nour", "Contact"],
    heroEyebrow: "NourApp Umrah App",
    heroTitle: "Your Umrah journey begins with NourApp",
    heroText: "Discover diverse Umrah programs, compare packages and services, and complete your booking through a clear and secure digital experience.",
    discover: "Discover NourApp",
    contact: "Contact Us",
    goalsTitle: "NourApp Goals",
    goals: [["Easy access", "to Umrah programs and services"], ["Comfortable experience", "from discovery to booking"], ["Greater efficiency", "in managing journey details"], ["Clarity and trust", "in services and prices"]],
    aboutLabel: "About NourApp",
    aboutTitle: "A smarter platform for a more comfortable Umrah journey",
    aboutText: "NourApp brings Umrah programs, accommodation, transport, and supporting services together in one clear digital experience, helping pilgrims plan and complete their journey with greater ease and confidence.",
    featuresLabel: "What We Offer",
    featuresTitle: "The best features in one app",
    features: [["Wide range of packages", "Options for different needs and budgets."], ["Simple user interface", "A clear experience for every user."], ["Fast direct booking", "Shorter steps and clear documentation."], ["Reliable partnerships", "Trusted providers and dependable quality."], ["24/7 support", "Continuous assistance throughout the journey."], ["Security and privacy", "Protection for personal data and transactions."]],
    showcaseTitle: "Everything a pilgrim needs in one app",
    showcaseText: "Explore programs, review journey details, and follow accommodation, transport, and services in one integrated experience.",
    ctaTitle: "Your happiness journey companion",
    ctaText: "NourApp will soon be available on Android and iOS.",
    journeyLabel: "How NourApp Works",
    journeyTitle: "Your journey begins in four simple steps",
    journeyText: "From choosing an Umrah program to following your journey, NourApp brings every step into one digital experience.",
    journeySteps: [
      { number: "01", title: "Explore programs", text: "Browse available Umrah programs and choose the option that suits you." },
      { number: "02", title: "Compare services", text: "Compare accommodation, transport, services, and prices clearly." },
      { number: "03", title: WEBSITE_BOOKING_ENABLED ? "Complete booking" : "Online booking", text: WEBSITE_BOOKING_ENABLED ? "Enter your details, select a payment method, and confirm securely." : "Website booking is temporarily paused. We will announce here when the service opens." },
      { number: "04", title: WEBSITE_BOOKING_ENABLED ? "Follow your journey" : "Get in touch", text: WEBSITE_BOOKING_ENABLED ? "Access program information and updates through the NourApp app." : "Contact the NourApp team with questions about programs and services." },
    ],
    footer: "© 2026 NourApp. All rights reserved.",
    lang: "العربية",
  },
} as const;

export type HomeCopy = (typeof copy)[Language];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

export const paymentMethods = [
  { nameAr: "مدى", nameEn: "Mada", image: "/images/payments/mada.png", type: "card" },
  { nameAr: "فيزا", nameEn: "Visa", image: "/images/payments/visa.png", type: "card" },
  { nameAr: "ماستركارد", nameEn: "Mastercard", image: "/images/payments/mastercard.png", type: "card" },
  { nameAr: "Apple Pay", nameEn: "Apple Pay", image: "/images/payments/apple-pay.png", type: "wallet" },
  { nameAr: "تابي", nameEn: "Tabby", image: "/images/payments/tabby.png", type: "installment" },
  { nameAr: "تمارا", nameEn: "Tamara", image: "/images/payments/tamara.png", type: "installment" },
] as const;
