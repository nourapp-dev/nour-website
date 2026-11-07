export type PageLanguage = "ar" | "en";
export type PageContent = {
  title: { ar: string; en: string };
  emphasis: { ar: string; en: string };
  description: { ar: string; en: string };
  faqs: {
    id: string;
    question: { ar: string; en: string };
    answer: { ar: string; en: string };
  }[];
};
const partnerFaqs = [
  [
    "من يمكنه تقديم طلب الاهتمام؟",
    "Who can submit an expression of interest?",
    "يمكن للمنشآت المهتمة بالتعاون في أسواقها المحلية أو بتقديم خدمات مرتبطة برحلة العمرة التقديم. يُقيّم كل طلب وفق النشاط والتراخيص ونطاق العمل.",
    "Organizations interested in local-market collaboration or providing services related to the Umrah journey can apply. Each application is assessed against its activity, licenses and scope.",
  ],
  [
    "ما الفرق بين الشريك الدولي ومزوّد الخدمات؟",
    "How do the two tracks differ?",
    "الشريك الدولي يتقدم للتعاون في سوق محدد، ويخضع نطاق العمل لمراجعة الدولة والتعاقد. أما مزوّد الخدمات فيتقدم بخدمة مثل الفنادق أو النقل أو الطيران أو التأشيرات، وتُحدد متطلباته بحسب نشاطه.",
    "An international partner proposes collaboration in a specific market, subject to country review and contracting. A service provider offers services such as hotels, transport, flights or visas, with requirements based on the activity.",
  ],
  [
    "هل يلزم رفع مستندات عند التقديم؟",
    "Do I need to upload documents when applying?",
    "لا. الطلب الأولي يقتصر على بيانات المنشأة والنطاق والتواصل. تُطلب وثائق التأهيل والهويات والبيانات البنكية لاحقًا عند الحاجة، عبر القناة المعتمدة المتفق عليها مع الفريق.",
    "No. The initial application covers your organization, scope and contact details. Qualification, identity and banking documents are requested later when needed, through the approved channel agreed with the team.",
  ],
  [
    "هل تقديم الطلب يعني اعتماد الشراكة؟",
    "Does submitting an application mean approval?",
    "لا. تقديم الطلب أو استكمال ملف التأهيل لا يمنح اعتمادًا أو صلاحية بيع أو تحصيل باسم نور آب. يبدأ التعاون بعد المراجعة والتعاقد وإشعار الاعتماد المحدد للنطاق.",
    "No. Submitting an application or completing the qualification pack does not grant approval or authority to sell or collect payments in Nour App's name. Collaboration follows review, contracting and a separate approval notice defining the scope.",
  ],
  [
    "كيف تُحدد الحصرية والشروط التجارية؟",
    "How are exclusivity and commercial terms decided?",
    "تُناقش هذه التفاصيل أثناء التقييم والتعاقد وتُحدد في الاتفاقية المعتمدة. تقديم الطلب لا يمنح حصرية أو التزامًا تجاريًا.",
    "These details are discussed during evaluation and contracting and set out in the approved agreement. Applying does not grant exclusivity or create a commercial commitment.",
  ],
  [
    "ماذا يحدث بعد إرسال الطلب؟",
    "What happens after I submit?",
    "بعد تأكيد التسجيل يظهر مرجع الطلب. يراجع فريق نور آب البيانات ويتواصل مع المسؤول بشأن الخطوة التالية وقناة استكمال المتطلبات. لا تُحدد مدة رد ثابتة ضمن هذا الطلب.",
    "Once registration is confirmed, you receive an application reference. The Nour App team reviews the details and contacts your representative about the next step and the channel for completing requirements. No fixed response time is specified.",
  ],
];
const careersFaqs = [
  [
    "هل توجد فرص للعمل عن بعد؟",
    "Are remote opportunities available?",
    "يُحدد نمط العمل بحسب كل فرصة. يمكنك تسجيل تفضيلك للحضور أو الهجين أو العمل عن بعد، لكنه لا يضمن توفر هذا النمط أو يغيّر شروط الفرصة.",
    "Work arrangements are determined for each opportunity. You can indicate an on-site, hybrid or remote preference, but this does not guarantee availability or change a role's conditions.",
  ],
  [
    "هل يمكن التقديم دون وجود وظيفة مناسبة؟",
    "Can I apply without a matching vacancy?",
    "نعم، يمكنك الانضمام إلى قاعدة المواهب. تستقبل هذه الصفحة بيانات الاهتمام والخبرة لبحث ملاءمتها للفرص المستقبلية.",
    "Yes. You can join the talent pool. This page accepts your professional interests and experience for consideration against future opportunities.",
  ],
  [
    "هل تتوفر فرص تدريب؟",
    "Are internships available?",
    "يمكنك تحديد التدريب كنوع الفرصة المفضل في قاعدة المواهب. هذا الاختيار لا يعني وجود فرصة تدريب منشورة أو ضمان القبول؛ يُبحث بحسب الفرص الفعلية.",
    "You can choose an internship as your preferred opportunity type in the talent pool. This does not imply a published internship or guarantee acceptance; consideration depends on actual opportunities.",
  ],
  [
    "ما صيغ السيرة الذاتية المقبولة؟",
    "Which CV formats are accepted?",
    "PDF وDOC وDOCX بحد أقصى 5MB. إرفاق السيرة اختياري. يُفحص الحجم والصيغة عند الإرسال، ويُحفظ الملف في مخزن خاص بالطلبات.",
    "PDF, DOC and DOCX up to 5MB. Attaching a CV is optional. Its size and format are checked when you submit, and the file is stored in private application storage.",
  ],
  [
    "ماذا يحدث بعد التقديم؟",
    "What happens after I apply?",
    "بعد تأكيد تسجيل الطلب يظهر مرجع الاستلام. يراجع الفريق البيانات والخبرة ويتواصل عند وجود ملاءمة لفرصة. لا توجد مدة رد ثابتة معلنة هنا.",
    "Once registration is confirmed, an application reference is displayed. The team reviews the details and experience and contacts you when there is a suitable opportunity. No fixed response time is stated here.",
  ],
  [
    "هل يضمن تقديم الطلب إجراء مقابلة؟",
    "Does applying guarantee an interview?",
    "لا. تقديم الطلب لا يعني القبول أو ضمان التواصل أو إجراء مقابلة أو التوظيف. تُحدد الخطوات التالية بحسب ملاءمة الملف ومتطلبات الفرصة.",
    "No. Applying does not guarantee acceptance, contact, an interview or employment. Next steps depend on the profile's suitability and the opportunity's requirements.",
  ],
];
export const defaultPages: Record<"partner" | "careers", PageContent> = {
  partner: {
    title: { ar: "وسّع أعمالك", en: "Grow your business" },
    emphasis: { ar: "مع نور آب", en: "with Nour App" },
    description: {
      ar: "نرحّب بالشركاء الدوليين ومزوّدي الخدمات لبناء تعاون يخدم رحلة المعتمر. اختر المسار المناسب لمنشأتك وابدأ بتعريفنا بنشاطك.",
      en: "We welcome international partners and service providers to explore collaboration that serves the Umrah journey. Choose the right track for your organization and tell us about your business.",
    },
    faqs: partnerFaqs.map((f, i) => ({
      id: String(i),
      question: { ar: f[0], en: f[1] },
      answer: { ar: f[2], en: f[3] },
    })),
  },
  careers: {
    title: { ar: "ساهم في تطوير", en: "Help shape" },
    emphasis: { ar: "رحلة المعتمر", en: "the Umrah journey" },
    description: {
      ar: "نجمع التقنية والخدمة والتشغيل لبناء تجربة أوضح للمعتمر. عرّفنا بخبرتك والمجال الذي ترغب في الإسهام فيه مع نور آب.",
      en: "We bring technology, service and operations together to build a clearer Umrah experience. Tell us about your expertise and where you would like to contribute to Nour App.",
    },
    faqs: careersFaqs.map((f, i) => ({
      id: String(i),
      question: { ar: f[0], en: f[1] },
      answer: { ar: f[2], en: f[3] },
    })),
  },
};
