import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { languageHref } from "../src/core/i18n/public-language.ts";
import { programPageMetadata } from "../src/features/programs/utils/program-metadata.ts";
import { defaultPresentation } from "../src/features/website/presentation.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const program = {
  id: "program-one", slug: "sample", titleAr: "عمرة تجريبية", titleEn: "Sample Umrah",
  summaryAr: "وصف تجريبي", summaryEn: "Sample description", descriptionAr: "تفاصيل", descriptionEn: "Details",
  countryId: "sa", countryNameAr: "السعودية", countryNameEn: "Saudi Arabia",
  durationDays: 5, durationNights: 4, basePrice: 125, currencyCode: "SAR",
  isFeatured: false, flightInclusion: "excluded", flightNotesAr: "", flightNotesEn: "",
  coverUrl: "/images/site/v-logo.png", hotels: [], flights: [],
};
const result = (data, extra = {}) => ({ data, isLoading: false, isPending: false, isError: false, refetch() {}, ...extra });

for(const language of ['ar','en'])for(const theme of ['light','dark'])test(`${language} ${theme}: programme title, isolated price and short no-stay state retain their semantics`,async()=>{
 const title='Very long programme title '.repeat(12);const fixture={...program,titleAr:title,titleEn:title,durationNights:0,summaryAr:'UNWANTED LONG DESCRIPTION',summaryEn:'UNWANTED LONG DESCRIPTION'};
 await withUI('src/features/programs/components/ProgramCard.tsx',{props:{program:fixture,language}},async()=>{
  document.documentElement.dataset.theme=theme;
  const css=document.createElement('style');css.textContent=(readFileSync(resolve(repo,'src/styles/public-content.module.css'),'utf8')+'\n'+readFileSync(resolve(repo,'src/features/programs/components/ProgramCard.module.css'),'utf8')).replaceAll(':global(html[data-theme="dark"])','html[data-theme="dark"]');document.head.append(css);
  const heading=document.querySelector('h3');assert.equal(heading.textContent,title);assert.equal(heading.title,title);assert.equal(window.getComputedStyle(heading).getPropertyValue('-webkit-line-clamp'),'2');
  const amount=document.querySelector('.amount');assert.equal(amount.dir,'ltr');assert.equal(amount.querySelectorAll('bdi').length,2);assert.equal(amount.lastElementChild.textContent,'SAR');assert.equal(window.getComputedStyle(amount).direction,'ltr');
  assert.doesNotMatch(document.body.textContent,/UNWANTED LONG DESCRIPTION/);assert.match(document.querySelector('.summary').textContent,language==='ar'?/دون إقامة فندقية/:/No hotel stay/);
 });
});

for(const language of ['ar','en'])for(const theme of ['light','dark'])test(`${language} ${theme}: article card reserves image space and separates metadata, clamped copy and action`,async()=>{
 const title='A long article title '.repeat(10),article={id:'test',slug:'test',title_ar:title,title_en:title,image:'',excerpt_ar:'ملخص اختبار '.repeat(20),excerpt_en:'Test excerpt '.repeat(20),article_categories:{id:'c',name_ar:'تصنيف',name_en:'Category'},published_at:'2026-01-08T10:00:00Z'};
 await withUI('src/features/articles/ArticleCard.tsx',{props:{article,language}},async()=>{
  document.documentElement.dataset.theme=theme;const css=document.createElement('style');css.textContent=(readFileSync(resolve(repo,'src/styles/public-content.module.css'),'utf8')+'\n'+readFileSync(resolve(repo,'src/features/articles/ArticleCard.module.css'),'utf8')).replaceAll(':global(html[data-theme="dark"])','html[data-theme="dark"]');document.head.append(css);
  assert.equal(window.getComputedStyle(document.querySelector('.image')).aspectRatio,'16/9');assert.equal(window.getComputedStyle(document.querySelector('h3')).getPropertyValue('-webkit-line-clamp'),'2');assert.equal(document.querySelector('h3').title,title);assert.equal(window.getComputedStyle(document.querySelector('.excerpt')).getPropertyValue('-webkit-line-clamp'),'3');
  assert.ok(document.querySelector('.meta time'));assert.equal(document.querySelectorAll('article a').length,1);assert.match(document.querySelector('article a').textContent,language==='ar'?/قراءة المقال/:/Read article/);assert.equal(document.querySelector('.meta a'),null);
 });
});

for(const language of ['ar','en'])for(const theme of ['light','dark'])for(const width of [390,768,1024,1440])test(`${language} ${theme} ${width}: map card owns its palette and compact layout`,async()=>{
 const facts={travelMode:'bus',priceBasis:'per_person',taxStatus:'included',origins:[{nameAr:'مدينة لا تتكرر',nameEn:'Do not repeat city'}],departures:[],stays:[],transports:[],actualFlightCount:0};
 await withUI('src/features/programs/components/ProgramCard.tsx',{props:{language,compact:true,program:{...program,titleAr:'عنوان طويل '.repeat(20),titleEn:'Long title '.repeat(20),display:facts}}},async()=>{
  document.documentElement.dataset.theme=theme;const root=document.getElementById('root');root.className='panel details';root.style.width=width+'px';
  const css=document.createElement('style');const card=(readFileSync(resolve(repo,'src/styles/public-content.module.css'),'utf8')+'\n'+readFileSync(resolve(repo,'src/features/programs/components/ProgramCard.module.css'),'utf8')).replaceAll(':global(html[data-theme="dark"])','html[data-theme="dark"]');css.textContent=card+'\n'+readFileSync(resolve(repo,'app/components/home/why-nour/NourWorldMap.module.css'),'utf8');document.head.append(css);
  const article=document.querySelector('article');const style=window.getComputedStyle(article);
  const resolveColor=(element,property)=>{let color=window.getComputedStyle(element).getPropertyValue(property);if(color.startsWith('var(')){const key=color.slice(4,-1);let current=element;while(current){const value=window.getComputedStyle(current).getPropertyValue(key);if(value)return value.trim();current=current.parentElement;}}return color;};
  const luminance=color=>{let c=color.startsWith('#')?color.slice(1).match(/../g).map(v=>parseInt(v,16)):color.match(/[\d.]+/g).slice(0,3).map(Number);return c.map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);};
  const bg=luminance(resolveColor(article,'background-color'));
  for(const element of article.querySelectorAll('h3,p,small,strong')){const fg=luminance(resolveColor(element,'color'));assert.ok((Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5,JSON.stringify({tag:element.tagName,color:resolveColor(element,'color'),bg:resolveColor(article,'background-color'),fg,bg}));}
  const a=article.querySelector('a'),fg=luminance(resolveColor(a,'color')),abg=luminance(resolveColor(a,'background-color'));assert.ok((Math.max(fg,abg)+.05)/(Math.min(fg,abg)+.05)>=4.5,JSON.stringify({foreground:resolveColor(a,"color"),background:resolveColor(a,"background-color"),fg,abg}));
  assert.equal(style.height,'auto');assert.equal(style.minHeight,'0px');assert.equal(article.classList.contains('nr-all-programs-card'),false);assert.equal(window.getComputedStyle(article.querySelector('.body')).flexGrow,'0');assert.equal(window.getComputedStyle(article.querySelector('h3')).overflowWrap,'anywhere');
  assert.equal(article.querySelector('img'),null);assert.doesNotMatch(article.textContent,/Do not repeat city|مدينة لا تتكرر/);assert.equal(article.querySelectorAll('a').length,1);
 });
});

for(const language of ['ar','en'])test(language+': non-applicable visa is hidden while excluded and unknown remain distinct',async()=>{
 let status='not_applicable';const state={language,query:({queryKey})=>result(['transports','visas'].includes(queryKey.at(-1))?[]:{...program,visaStatus:status})};
 await withUI('app/programs/[slug]/ProgramDetailsClient.tsx',state,async({render})=>{
  assert.equal(document.querySelector('#visas'),null);assert.equal(document.querySelector('a[href="#visas"]'),null);
  status='excluded';await render();assert.match(document.querySelector('#visas').textContent,language==='ar'?/غير مشمولة/:/not included/);
  status=null;await render();assert.match(document.querySelector('#visas').textContent,language==='ar'?/غير محددة/:/unspecified/);assert.ok(document.querySelector('a[href="#visas"]'));
 });
});

test('missing full-card cover has a stable 16:9 placeholder and compact form leaves other cards intact',async()=>{
 await withUI('src/features/programs/components/ProgramCard.tsx',{props:{program:{...program,coverUrl:null},language:'en'}},async()=>{
  assert.match(document.querySelector('.image').textContent,/image unavailable/);assert.equal(document.querySelector('article').classList.contains('compact'),false);assert.ok(document.querySelector('.summary'));assert.ok(document.querySelector('.nr-all-programs-card'));
 });
});

for(const language of ['ar','en'])test(language+': article service failure can retry and is distinct from an unpublished article',async()=>{
 let retries=0;const state={language,query:()=>result(undefined,{isError:true,refetch:()=>retries++})};
 await withUI('app/articles/[slug]/ArticleDetailsClient.tsx',state,async({click,render})=>{
  assert.ok(document.querySelector('[role="alert"]'));assert.doesNotMatch(document.body.textContent,/404/);await click(document.querySelector('[role="alert"] button'));assert.equal(retries,1);
  state.query=()=>result(null);await render();assert.match(document.body.textContent,/404/);assert.equal(document.querySelector('[role="alert"]'),null);
 });
});

test('related article cards require the same actual category and do not invent author/date metadata',async()=>{
 const a={id:'a',slug:'a',title_ar:'مقال',title_en:'Current article',content_en:'Local content',excerpt_en:'Excerpt',category_id:'c',article_categories:{id:'c',name_en:'Category',name_ar:'تصنيف'},image:'',published_at:null};
 const related=[a,{...a,id:'b',slug:'b',title_en:'Same category'},{...a,id:'x',slug:'x',title_en:'Different category',category_id:'other'}];
 await withUI('app/articles/[slug]/ArticleDetailsClient.tsx',{language:'en',query:({queryKey})=>result(queryKey[1]==='article'?a:related)},async()=>{
  assert.equal(document.querySelectorAll('.public-article-card').length,1);assert.match(document.querySelector('.public-article-card').textContent,/Same category/);assert.doesNotMatch(document.body.textContent,/Different category/);assert.equal(document.querySelector('time'),null);
 });
});

test('homepage program selection uses ordered references and never revives unpublished selections',async()=>{
 const content=structuredClone(defaultPresentation);content.programs.ids=['two','missing',program.id];
 await withUI('app/components/home/ProgramsPreview.tsx',{props:{language:'en'},catalog:result([program,{...program,id:'two',slug:'two',titleEn:'Second selected program'}])},async()=>{
  assert.deepEqual([...document.querySelectorAll('article h3')].map(h=>h.textContent),['Second selected program','Sample Umrah']);
  assert.equal(document.querySelectorAll('article').length,2);
 },name=>name.endsWith('usePresentation')?{usePresentation:()=>content}:undefined);
});

for(const language of ['ar','en']) test(language+': shared card shows stored price facts and honest no-date state with a reversible list URL',async()=>{
 const display={travelMode:'bus',priceBasis:'per_person',taxStatus:'included',origins:[{id:'r',nameAr:'الرياض',nameEn:'Riyadh'}],departures:[{startAt:'2020-01-01',status:'scheduled'}],stays:[],transports:[],actualFlightCount:0};
 await withUI('src/features/programs/components/ProgramCard.tsx',{props:{program:{...program,display},language,returnTo:'/programs?country=sa&city=r&q=test&page=2&sort=price_asc'}},async()=>{
  assert.match(document.body.textContent,language==='ar'?/لا توجد مواعيد قادمة منشورة/:/No upcoming published departures/);
  assert.match(document.body.textContent,language==='ar'?/للفرد.*شامل الضريبة/:/per person.*Tax included/);
  assert.equal(document.querySelectorAll('article a').length,1);assert.equal(document.querySelectorAll('article button').length,0);
  const link=new URL(document.querySelector('article a').href);const from=new URL(link.searchParams.get('from'),'https://nour.test');
  assert.equal(from.searchParams.get('page'),'2');assert.equal(from.searchParams.get('city'),'r');assert.equal(from.searchParams.get('lang'),language);
 });
});

test('catalogue currency/price/page filters persist through a details link and clearing is atomic',async()=>{
 const many=Array.from({length:12},(_,i)=>({...program,id:String(i),slug:'sample-'+i,basePrice:100+i}));
 const state={url:'https://nour.test/programs?lang=en&currency=SAR&min=100&max=150&page=2',catalog:result(many)};
 await withUI('app/programs/ProgramCatalogClient.tsx',state,async({click,render})=>{
  assert.equal(document.querySelectorAll('.nr-all-programs-card').length,3);
  assert.match(document.querySelector('[aria-label="Active filters"]').textContent,/Currency: SAR/);
  assert.equal(new URL(new URL(document.querySelector('.nr-all-programs-card a').href).searchParams.get('from'),'https://nour.test').searchParams.get('page'),'2');
  const clear=[...document.querySelectorAll('button')].find(b=>/^Reset$|Clear all|Clear filters/.test(b.textContent));assert.ok(clear);await click(clear);await render();
  assert.equal(window.location.search,'?lang=en');assert.equal(document.querySelectorAll('.nr-all-programs-card').length,9);
 });
});

test('a bus program hides the flight section even if legacy free text claims dynamic flight pricing',async()=>{
 const display={travelMode:'bus',priceBasis:null,taxStatus:null,origins:[],departures:[],stays:[],transports:[],actualFlightCount:0};
 await withUI('app/programs/[slug]/ProgramDetailsClient.tsx',{language:'en',query:({queryKey})=>result(['transports','visas'].includes(queryKey.at(-1))?[]:{...program,flightInclusion:'dynamic',display})},async()=>{
  assert.equal(document.querySelector('#flights'),null);assert.equal(document.querySelector('a[href="#flights"]'),null);assert.match(document.body.textContent,/Bus/);
 });
});

function loader(mocks, dom) {
  const cache = new Map();
  function load(path) {
    const file = [path, `${path}.tsx`, `${path}.ts`, resolve(path, "index.ts")].find(candidate => existsSync(candidate) && statSync(candidate).isFile());
    if (!file) throw new Error(`Missing test module ${path}`);
    if (cache.has(file)) return cache.get(file).exports;
    const loaded = { exports: {} };
    cache.set(file, loaded);
    const source = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(source, {
      module: loaded, exports: loaded.exports, console, URL, URLSearchParams, AbortSignal, process,
      window: dom?.window, document: dom?.window.document, get localStorage(){return dom?.window.localStorage;}, CustomEvent: dom?.window.CustomEvent,
      MutationObserver: dom?.window.MutationObserver,
      IntersectionObserver: dom?.window.IntersectionObserver,
      require(name) {
        if (name === "server-only") return {}; // Next build verifies the boundary; VM tests exercise the implementation.
        const mocked = mocks(name);
        if (mocked !== undefined) return mocked;
        if (name.startsWith(".")) return load(resolve(dirname(file), name));
        return require(name);
      },
    }, { filename: file });
    return loaded.exports;
  }
  return load;
}

async function withUI(file, state, run, extraMocks = () => undefined) {
  const dom = new JSDOM('<div id="root"></div>', { url: state.url ?? "https://nour.test/programs?lang=en" });
  dom.window.requestAnimationFrame = callback => dom.window.setTimeout(() => callback(0), 0);
  dom.window.cancelAnimationFrame = id => dom.window.clearTimeout(id);
  state.setupDom?.(dom);
  if (state.matchMedia) dom.window.matchMedia = state.matchMedia;
  dom.window.IntersectionObserver = state.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} };
  const previous = { window: globalThis.window, document: globalThis.document, act: globalThis.IS_REACT_ACT_ENVIRONMENT };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  if (state.savedLanguage) dom.window.localStorage.setItem("nour-language", JSON.stringify(state.savedLanguage));
  const motionElements = new Map();
  const motion = new Proxy({}, { get: (_, tag) => {
    if (!motionElements.has(tag)) motionElements.set(tag, React.forwardRef(function MotionElement(props, ref) {
      const clean = Object.fromEntries(Object.entries(props).filter(([key]) => !["initial", "animate", "exit", "transition", "variants", "whileInView", "viewport", "whileHover", "whileTap"].includes(key)));
      return React.createElement(tag, { ...clean, ref });
    }));
    return motionElements.get(tag);
  } });
  const load = loader(name => {
    const custom = extraMocks(name);
    if (custom !== undefined) return custom;
    if(name.endsWith("usePresentation"))return {usePresentation:()=>structuredClone(defaultPresentation)};
    if (name === "framer-motion") return { motion, AnimatePresence: ({ children }) => children, useReducedMotion: () => state.reduceMotion ?? false, useMotionValue: () => ({ set() {} }), useSpring: () => 0, useTransform: () => 0 };
    if (name === "styled-jsx/css") return { __esModule: true, default: { global: (strings, ...values) => String.raw({ raw: strings }, ...values) } };
    if (name.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (name === "next/dynamic") return { __esModule: true, default: () => () => React.createElement("div", { "data-testid": "geographic-map" }) };
    if (name.endsWith("usePublicContact")) return { __esModule: true, default: () => ({ phoneLabel: "Contact", phoneHref: "tel:+000", whatsappHref: "#contact" }) };
    if (name === "next/image") return { __esModule: true, default: ({ src, alt, onError }) => React.createElement("img", { src, alt, onError }) };
    if (name === "next/link") return { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) };
    if (name === "next/navigation") return {
      usePathname: () => dom.window.location.pathname,
      useParams: () => ({ slug: "sample" }),
      useSearchParams: () => new URLSearchParams(dom.window.location.search),
      useRouter: () => ({ replace: href => dom.window.history.replaceState(null, "", href), push: href => dom.window.history.pushState(null, "", href) }),
    };
    if (name.endsWith("core/i18n")) return { useLanguage: () => ({ language: state.language ?? "en" }) };
    if (name.endsWith("usePublicProgramCatalog")) return { __esModule: true, default: () => state.catalog };
    if (name === "@tanstack/react-query") return { useQuery: options => state.query?.(options) ?? result(undefined) };
    if (name.endsWith("supabase/client")) return { createClient: () => ({}) };
    if (name.endsWith(".css")) return {};
    if (name.includes("services") || name.endsWith("journey.service")) return {};
    return undefined;
  }, dom);
  const Component = load(resolve(repo, file)).default;
  const root = createRoot(document.getElementById("root"));
  const render = () => act(async () => root.render(React.createElement(React.Fragment, null, React.createElement(Component, state.props ?? null, state.children?.(load)), state.sibling?.(load))));
  const click = element => act(async () => element.click());
  const select = async (element, value) => {
    await act(async () => { element.value = value; element.dispatchEvent(new dom.window.Event("change", { bubbles: true })); });
    await render();
  };
  try { await render(); await run({ dom, render, click, select, load }); }
  finally {
    await act(async () => root.unmount()); dom.window.close();
    globalThis.window = previous.window; globalThis.document = previous.document; globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
  }
}

test("catalog opens filters, filters results, removes chips and resets without losing language", async () => {
  const state = { catalog: result([program, { ...program, id: "two", slug: "other", countryId: "eg", countryNameEn: "Egypt", durationDays: 10 }]) };
  await withUI("app/programs/ProgramCatalogClient.tsx", state, async ({ click, select, render }) => {
    const panel = () => document.getElementById("program-filter-panel");
    const cards = () => document.querySelectorAll(".nr-all-programs-card");
    assert.equal(panel().hidden, true);
    const toggle = document.querySelector('[aria-controls="program-filter-panel"]');
    await click(toggle);
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
    assert.equal(panel().hidden, false);
    assert.equal(cards().length, 2);
    await select(panel().querySelector("select"), "sa");
    assert.equal(cards().length, 1);
    assert.match(document.querySelector(".program-active-filters").textContent, /Saudi Arabia/);
    const remove = document.querySelector(".program-active-filters button");
    await click(remove); await render();
    assert.equal(cards().length, 2);
    await select(panel().querySelectorAll("select")[1], "long");
    assert.equal(cards().length, 1);
    const reset = [...document.querySelectorAll("button")].find(button => button.textContent === "Reset");
    await click(reset); await render();
    assert.equal(cards().length, 2);
    assert.equal(window.location.search, "?lang=en");
    assert.equal(cards()[0].querySelector("a").getAttribute("href"), "/programs/sample?lang=en");
  });
});

test("catalog distinguishes loading, server failure, empty catalog and unmatched filters; retries the failed request", async () => {
  let retries = 0;
  const state = { catalog: result(undefined, { isLoading: true }) };
  await withUI("app/programs/ProgramCatalogClient.tsx", state, async ({ render, click, select }) => {
    assert.ok(document.querySelector('[aria-busy="true"]'));
    assert.equal(document.querySelector("[role=alert]"), null);
    assert.doesNotMatch(document.querySelector(".nr-all-programs-content").textContent, /No programs/);
    state.catalog = result(undefined, { isError: true, refetch: () => retries++ }); await render();
    assert.ok(document.querySelector("[role=alert]"));
    await click(document.querySelector("[role=alert] button")); assert.equal(retries, 1);
    state.catalog = result([]); await render();
    assert.equal(document.querySelector("[role=alert]"), null);
    assert.match(document.body.textContent, /No programs are available right now/);
    state.catalog = result([program]); await render();
    await click(document.querySelector('[aria-controls="program-filter-panel"]'));
    await select(document.querySelectorAll("#program-filter-panel select")[1], "long");
    assert.equal(document.querySelectorAll(".nr-all-programs-card").length, 0);
    assert.doesNotMatch(document.body.textContent, /No programs are available right now/);
    await click([...document.querySelectorAll("button")].find(button => button.textContent === "Clear filters and show all programs")); await render();
    assert.equal(document.querySelectorAll(".nr-all-programs-card").length, 1);
  });
});

test("city lookup failure is retriable rather than a misleading empty result", async () => {
  let retries = 0;
  const state = { url: "https://nour.test/programs?city=c&lang=en", catalog: result([program]), query: () => result(undefined, { isError: true, refetch: () => retries++ }) };
  await withUI("app/programs/ProgramCatalogClient.tsx", state, async ({ click }) => {
    assert.ok(document.querySelector("[role=alert]"));
    await click(document.querySelector("[role=alert] button")); assert.equal(retries, 1);
    assert.doesNotMatch(document.body.textContent, /No programs are available/);
  });
});

test("Arabic catalog has RTL, localized filters and Arabic return links; mixed currencies are not price-sorted", async () => {
  const state = { language: "ar", catalog: result([program, { ...program, id: "usd", currencyCode: "USD" }]) };
  await withUI("app/programs/ProgramCatalogClient.tsx", state, async ({ click }) => {
    assert.equal(document.querySelector("main").getAttribute("dir"), "rtl");
    assert.match(document.querySelector("h1").textContent, /العمرة/);
    await click(document.querySelector('[aria-controls="program-filter-panel"]'));
    assert.equal(document.querySelector('option[value="price-low"]').disabled, true);
    assert.equal(document.querySelector(".nr-all-programs-card a").getAttribute("href"), "/programs/sample?lang=ar");
    assert.match([...document.querySelectorAll(".program-price-note")].map(note => note.textContent).join(" "), /الضريبة/);
  });
});

for (const language of ["ar", "en"]) test(`${language}: details remain readable during secondary loading/failure, with independent retries and booking paused`, async () => {
  let transportRetries = 0, visaRetries = 0;
  const state = { language, transport: result(undefined, { isLoading: true }), visa: result(undefined, { isLoading: true }) };
  state.query = ({ queryKey }) => queryKey.at(-1) === "transports" ? state.transport : queryKey.at(-1) === "visas" ? state.visa : result(program);
  await withUI("app/programs/[slug]/ProgramDetailsClient.tsx", state, async ({ render, click }) => {
    assert.equal(document.querySelector("h1").textContent, language === "ar" ? program.titleAr : program.titleEn);
    assert.ok(document.querySelector(".nr-program-details-hero-content .nr-booking-notice"));
    assert.ok(document.querySelector('.nr-program-details-subnav a[href="#departures"]'));
    assert.ok(document.querySelector('.nr-program-details-subnav a[href="#additional-information"]'));
    assert.doesNotMatch(document.body.textContent, /Updated program details|تفاصيل البرنامج محدثة|Base price fields|حقول السعر/);
    assert.equal(document.querySelectorAll('.program-section-state[aria-busy="true"]').length, 2);
    state.transport = result(undefined, { isError: true, refetch: () => transportRetries++ });
    state.visa = result(undefined, { isError: true, refetch: () => visaRetries++ }); await render();
    assert.ok(document.querySelector("h1"));
    const errors = document.querySelectorAll(".program-section-state[role=alert]");
    assert.equal(errors.length, 2);
    await click(errors[0].querySelector("button"));
    assert.equal(transportRetries, 1); assert.equal(visaRetries, 0);
    await click(errors[1].querySelector("button")); assert.equal(visaRetries, 1);
    assert.equal(document.querySelector('a[href^="nourapp:"]'), null);
    assert.match(document.body.textContent, language === "ar" ? /متوقف/ : /paused/i);
    state.transport = result([]); state.visa = result([]); await render();
    assert.equal(document.querySelectorAll(".program-section-state[role=alert]").length, 0);
    assert.match(document.querySelector("#transport").textContent, language === "ar" ? /لم تتم إضافة تفاصيل النقل/ : /Transport details have not been added/);
  });
});

test("URL language overrides saved preference, follows navigation and refreshes the URL when toggled", async () => {
  const state = { savedLanguage: "ar", url: "https://nour.test/programs/sample?country=sa&lang=en#transport" };
  let useLanguage;
  function Probe() {
    const value = useLanguage();
    return React.createElement("button", { onClick: value.toggleLanguage }, value.language);
  }
  state.children = load => {
    useLanguage = load(resolve(repo, "src/core/i18n/LanguageProvider.tsx")).useLanguage;
    return React.createElement(Probe);
  };
  await withUI("src/core/i18n/LanguageProvider.tsx", state, async ({ render, click }) => {
    assert.equal(document.documentElement.lang, "en");
    assert.equal(document.documentElement.dir, "ltr");
    assert.equal(JSON.parse(window.localStorage.getItem("nour-language")), "en");
    window.history.replaceState(null, "", "/programs/sample?country=sa&lang=ar#transport"); await render();
    assert.equal(document.documentElement.lang, "ar");
    assert.equal(document.documentElement.dir, "rtl");
    await click(document.querySelector("button")); await render();
    assert.equal(window.location.search, "?country=sa&lang=en");
    assert.equal(window.location.hash, "#transport");
    assert.equal(document.documentElement.lang, "en");
  });
});

test("metadata reads only published, active content anonymously and handles missing content and service errors", async () => {
  const keys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
  const saved = keys.map(key => process.env[key]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-test-only";
  const calls = [];
  let response = { data: { title_ar: "برنامج", title_en: "Program", summary_ar: "وصف", summary_en: "Description", cover_media: { bucket: "public-media", path: "cover.jpg" } }, error: null };
  const builder = {};
  for (const method of ["select", "eq", "is", "abortSignal", "retry"]) builder[method] = (...args) => { calls.push([method, ...args]); return builder; };
  builder.maybeSingle = async () => response;
  const load = loader(name => name === "@supabase/supabase-js" ? { createClient: (url, key, options) => {
    assert.equal(url, "http://127.0.0.1:54321"); assert.equal(key, "local-test-only");
    assert.equal(options.auth.persistSession, false);
    return { from: table => { assert.equal(table, "programs"); return builder; }, storage: { from: bucket => ({ getPublicUrl: path => ({ data: { publicUrl: `https://images.test/${bucket}/${path}` } }) }) } };
  } } : undefined);
  try {
    const { getPublicProgramMetadata } = load(resolve(repo, "src/server/programs/public-program-metadata.server.ts"));
    const value = await getPublicProgramMetadata("sample");
    assert.equal(value.coverUrl, "https://images.test/public-media/cover.jpg");
    assert.ok(calls.some(([method, key, value]) => method === "eq" && key === "slug" && value === "sample"));
    assert.ok(calls.some(([method, key, value]) => method === "eq" && key === "status" && value === "published"));
    assert.ok(calls.some(([method, key, value]) => method === "eq" && key === "is_active" && value === true));
    assert.ok(calls.some(([method, key, value]) => method === "is" && key === "deleted_at" && value === null));
    response = { data: null, error: null }; assert.equal(await getPublicProgramMetadata("missing"), null);
    response = { data: null, error: { message: "test failure" } }; assert.equal(await getPublicProgramMetadata("sample"), null);
    builder.maybeSingle = async () => { throw new Error("offline"); }; assert.equal(await getPublicProgramMetadata("sample"), null);
  } finally { keys.forEach((key, index) => { if (saved[index] === undefined) delete process.env[key]; else process.env[key] = saved[index]; }); }
});

test("main program failure has a retry; an unavailable program has no booking action", async () => {
  let retries = 0;
  const state = { main: result(undefined, { isLoading: true }) };
  state.query = ({ queryKey }) => queryKey.length === 3 ? state.main : result([]);
  await withUI("app/programs/[slug]/ProgramDetailsClient.tsx", state, async ({ click, render }) => {
    assert.equal(document.querySelector("main").getAttribute("aria-busy"), "true");
    state.main = result(undefined, { isError: true, refetch: () => retries++ }); await render();
    await click([...document.querySelectorAll("button")].find(button => button.textContent === "Try again"));
    assert.equal(retries, 1);
    state.main = result(null); await render();
    assert.match(document.body.textContent, /does not exist or is not published/i);
    assert.equal(document.querySelector(".nr-program-details-book"), null);
  });
});

test("language URLs preserve filters and fragments, and program metadata is specific to program and language", () => {
  assert.equal(languageHref("/programs/sample?country=sa#transport", "en"), "/programs/sample?country=sa&lang=en#transport");
  for (const language of ["ar", "en"]) {
    const metadata = programPageMetadata({ path: "/programs/sample", language, title: "Sample", description: "Published description", image: "https://images.test/cover.jpg" });
    assert.equal(metadata.alternates.canonical, `/programs/sample?lang=${language}`);
    assert.equal(metadata.alternates.languages.en, "/programs/sample?lang=en");
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.openGraph.images[0].url, "https://images.test/cover.jpg");
    assert.equal(metadata.description, "Published description");
  }
  assert.equal(programPageMetadata({ path: "/programs/missing", language: "en", title: "Unavailable", description: "Unavailable", available: false }).robots.index, false);
});

for (const language of ["ar", "en"]) test(`${language}: unreleased app is informational with no launch, download or QR actions`, async () => {
  const presentation = structuredClone(defaultPresentation);
  presentation.download.googlePlay = "https://play.google.com/store/apps/details?id=com.nourumrah.app";
  presentation.download.visible = true;
  for (const file of ["app/components/AppLaunchPanel.tsx", "app/components/AppBookingLink.tsx", "app/components/home/CTA.tsx"]) {
    await withUI(file, { language, props: { language } }, async () => {
      assert.match(document.body.textContent, language === "ar" ? /التطبيق قريبًا/ : /App coming soon/);
      assert.equal(document.querySelector("a, button, img[src^='data:']"), null);
      assert.equal(window.location.pathname, "/programs");
    }, name => name.endsWith("usePresentation") ? { usePresentation: () => presentation } : name.endsWith(".module.css") ? { __esModule: true, default: {} } : undefined);
  }
});

test("home search submits the selected filters with the current language", async () => {
  const state = { catalog: result([program]), props: { language: "en" } };
  await withUI("app/components/home/ProgramSearch.tsx", state, async ({ select, dom }) => {
    await select(document.querySelector("#hero-country"), "sa");
    await select(document.querySelector("#hero-duration"), "short");
    await act(async () => document.querySelector("form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
    const params = new URLSearchParams(window.location.search);
    assert.equal(params.get("country"), "sa"); assert.equal(params.get("duration"), "short"); assert.equal(params.get("lang"), "en");
  });
});

for (const language of ["ar", "en"]) test(`${language}: mobile program status never launches the app and disappears with unavailable content`, async () => {
  await withUI("app/programs/ProgramDetailsExperience.tsx", { language, url: "https://nour.test/programs/sample" }, async () => {
    assert.equal(document.querySelector(".nr-program-mobile-booking"), null);
    const programStatus = document.createElement("span");
    programStatus.className = "nr-program-details-book";
    await act(async () => { document.body.append(programStatus); await Promise.resolve(); });
    const strip = document.querySelector(".nr-program-mobile-booking");
    assert.ok(strip);
    assert.equal(strip.querySelector("a"), null);
    assert.equal(strip.querySelectorAll("button").length, 1);
    assert.ok(strip.querySelector(".nr-program-privacy-button"));
    assert.match(strip.textContent, language === "ar" ? /التطبيق قريبًا/ : /App coming soon/);
    await act(async () => { programStatus.remove(); await Promise.resolve(); });
    assert.equal(document.querySelector(".nr-program-mobile-booking"), null);
  });
});


test("clearing the city preserves other filters and language", async () => {
  const state = { url: "https://nour.test/programs?city=c&country=sa&duration=short&lang=en", catalog: result([program]), query: () => result({ cities: [{ id: "c", name_en: "City" }], departures: [{ origin_city_id: "c", program_id: program.id }] }) };
  await withUI("app/programs/ProgramCatalogClient.tsx", state, async ({ click, select, render }) => {
    await click(document.querySelector('[aria-controls="program-filter-panel"]'));
    await select(document.querySelectorAll("#program-filter-panel select")[2], "all");
    await click([...document.querySelectorAll("button")].find(button => button.textContent === "Clear city filter")); await render();
    const query = new URLSearchParams(window.location.search);
    assert.equal(query.has("city"), false);
    assert.equal(query.get("country"), "sa"); assert.equal(query.get("duration"), "short"); assert.equal(query.get("lang"), "en");
    assert.equal(document.querySelectorAll("#program-filter-panel select")[2].value, "all");
    assert.equal(document.querySelectorAll(".nr-all-programs-card").length, 1);
  });
});

test("Escape closes filters and restores keyboard focus without clearing selections", async () => {
  await withUI("app/programs/ProgramCatalogClient.tsx", { catalog: result([program]) }, async ({ click, select, dom }) => {
    const toggle = document.querySelector('[aria-controls="program-filter-panel"]');
    await click(toggle);
    const field = document.querySelectorAll("#program-filter-panel select")[2];
    await select(field, "bus"); field.focus();
    await act(async () => field.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    assert.equal(document.querySelector("#program-filter-panel").hidden, true);
    assert.equal(document.activeElement, toggle); assert.equal(field.value, "bus");
  });
});

for (const language of ["ar", "en"]) test(`${language}: missing inclusion lists are explicit and never imply all services are covered`, async () => {
  const content = { itinerary: [], inclusions: [{ id: "item", inclusionType: "included", titleAr: "إقامة", titleEn: "Accommodation" }], cancellation: [], meetingPoints: [], priceTiers: [], faqs: [] };
  const state = { language, query: ({ queryKey }) => queryKey[1] === "program-structured-content-id" ? result("id") : result(content) };
  await withUI("app/programs/ProgramStructuredContent.tsx", state, async ({ render }) => {
    assert.match(document.querySelector(".psc-excluded").textContent, language === "ar" ? /لا يعني أن جميع الخدمات مشمولة/ : /does not mean all services are included/);
    content.inclusions[0].inclusionType = "excluded"; await render();
    assert.match(document.querySelector(".psc-included").textContent, language === "ar" ? /لا تفترض شمول خدمة/ : /do not assume a service is included/);
  });
});

test("detail navigation observes late-loading sections and releases removed sections", async () => {
  const seen = [], removed = []; let callback; let disconnected = false;
  class Observer {
    constructor(fn) { callback = fn; }
    observe(element) { seen.push(element); }
    unobserve(element) { removed.push(element); }
    disconnect() { disconnected = true; }
  }
  await withUI("app/programs/ProgramDetailsExperience.tsx", { url: "https://nour.test/programs/sample", IntersectionObserver: Observer }, async () => {
    assert.equal(seen.length, 0);
    const section = document.createElement("section"); section.id = "departures";
    const nav = document.createElement("nav"); nav.className = "nr-program-details-subnav";
    nav.innerHTML = '<a href="#departures">Departures</a>';
    await act(async () => { document.body.append(section, nav); await Promise.resolve(); });
    assert.equal(seen.includes(section), true);
    await act(async () => callback([{ target: section, isIntersecting: true, intersectionRatio: 1 }]));
    assert.equal(nav.querySelector("a").getAttribute("aria-current"), "true");
    await act(async () => { section.remove(); await Promise.resolve(); });
    assert.equal(removed.includes(section), true);
    nav.remove();
  });
  assert.equal(disconnected, true);
});


for (const language of ["ar", "en"]) test(`${language}: home priorities and trust copy make no unsupported number or payment claims`, async () => {
  await withUI("app/components/home/NourStatistics.tsx", { props: { language } }, async () => {
    const cards = [...document.querySelectorAll(".nr-statistic-card")];
    assert.equal(cards.length, 4);
    for (const card of cards) assert.doesNotMatch(card.querySelector("strong").textContent, /[0-9]/);
    assert.doesNotMatch(document.body.textContent, /12000|12,000|24\/7/);
    assert.match(document.querySelector(".nr-statistics-heading").textContent, language === "ar" ? /ما نركز عليه/ : /Our focus/);
  });
  await withUI("app/components/home/WhyNour.tsx", { props: { language } }, async () => {
    assert.match(document.body.textContent, language === "ar" ? /السعر الابتدائي/ : /starting price/);
    assert.doesNotMatch(document.body.textContent, /Secure flexible payments|دفع آمن ومرن|Continuous support|24\/7/);
  });
  await withUI("app/components/home/HeroPhones.tsx", { catalog: result([]), props: { t: { lang: language === "ar" ? "English" : "العربية" }, hero: defaultPresentation.hero } }, async () => {
    assert.doesNotMatch(document.body.textContent, /24\/7/);
    assert.equal(document.querySelector('img[src="/images/site/front-view.png"]') !== null, true);
    assert.equal(document.querySelector('img[src="/images/site/rotated-right.png"]') !== null, true);
  });
});

test("reduced motion suppresses the intro without locking page scrolling", async () => {
  await withUI("app/components/SiteIntro.tsx", { props: { language: "ar" }, reduceMotion: true }, async () => {
    assert.equal(document.querySelector(".nr-site-intro"), null);
    assert.equal(document.body.style.overflow, "");
  });
});

test("the intro can be skipped by button, Escape or Tab and never locks scrolling", async () => {
  for (const action of ["button", "Escape", "Tab"]) {
    await withUI("app/components/SiteIntro.tsx", { props: { language: "en" } }, async ({ click, dom }) => {
      await act(async () => new Promise(resolve => window.setTimeout(resolve, 20)));
      assert.ok(document.querySelector(".nr-site-intro"));
      assert.equal(document.body.style.overflow, "");
      if (action === "button") await click(document.querySelector(".nr-site-intro-skip"));
      else await act(async () => window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: action })));
      assert.equal(document.querySelector(".nr-site-intro"), null);
    });
  }
});

test("map mounts only when its reserved container approaches the viewport", async () => {
  let notify, disconnects = 0;
  class Observer { constructor(fn) { notify = fn; } observe() {} disconnect() { disconnects++; } }
  await withUI("app/components/home/why-nour/NourWorldMap.tsx", { props: { language: "en" }, IntersectionObserver: Observer }, async () => {
    assert.equal(document.querySelector('[data-testid="geographic-map"]'), null);
    assert.match(document.querySelector(".map").textContent, /as you approach/);
    await act(async () => notify([{ isIntersecting: false }]));
    assert.equal(document.querySelector('[data-testid="geographic-map"]'), null);
    await act(async () => notify([{ isIntersecting: true }]));
    assert.ok(document.querySelector('[data-testid="geographic-map"]'));
    assert.ok(disconnects > 0);
  });
});

test("keyboard focus restores a hidden header and keeps it visible while scrolling", async () => {
  const noop = () => {};
  await withUI("app/components/layout/Header.tsx", { props: { language: "en", t: { lang: "العربية" }, theme: "light", menuOpen: false, activeSection: "home", navItems: [], actionHref: "/programs?lang=en", actionLabel: "Explore Umrah programs", onLanguageChange: noop, onThemeChange: noop, onMenuToggle: noop, onMenuClose: noop } }, async ({ dom }) => {
    const scroll = async value => act(async () => {
      Object.defineProperty(window, "scrollY", { configurable: true, value });
      window.dispatchEvent(new dom.window.Event("scroll"));
      await new Promise(done => window.setTimeout(done, 5));
    });
    await scroll(400);
    assert.ok(document.querySelector("header").classList.contains("is-hidden"));
    await act(async () => document.querySelector("header a").focus());
    assert.equal(document.querySelector("header").classList.contains("is-hidden"), false);
    await scroll(600);
    assert.equal(document.querySelector("header").classList.contains("is-hidden"), false);
  });
});


test("home metadata follows the requested language, uses real query URLs and preserves configured copy", async () => {
  const settings = { "seo.meta_title_en": "Configured English title", "seo.meta_description_en": "Configured description" };
  const load = loader(name => name === "./HomeClient" ? { __esModule: true, default: () => null }
    : name.endsWith("public-settings.server") ? { getPublicServerSettings: async () => settings, getServerTextSetting: (values, key, fallback) => values[key] ?? fallback } : undefined);
  const { generateMetadata } = load(resolve(repo, "app/page.tsx"));
  for (const [requested, resolved] of [["en", "en"], ["ar", "ar"], ["invalid", "ar"], [["en", "ar"], "ar"]]) {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({ lang: requested }) });
    assert.equal(metadata.alternates.canonical, `/?lang=${resolved}`);
    assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
    assert.equal(metadata.alternates.languages.en, "/?lang=en");
    assert.ok(existsSync(resolve(repo, "public" + metadata.openGraph.images[0].url)));
    if (resolved === "en") { assert.equal(metadata.title.absolute, settings["seo.meta_title_en"]); assert.equal(metadata.description, settings["seo.meta_description_en"]); }
    else assert.match(metadata.title.absolute, /نور/);
  }
});


test("real fixture API and journey services produce country codes that render in both map modes", async () => {
  const { createFixtureServer } = await import("../scripts/ui-preview.mjs");
  const { createClient } = require("@supabase/supabase-js");
  const server = createFixtureServer();
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  try {
    const client = createClient("http://127.0.0.1:" + server.address().port, "local-preview-test-only", { auth: { persistSession: false, autoRefreshToken: false } });
    const load = loader(() => undefined);
    const { getJourneyCatalog } = load(resolve(repo, "src/features/journeys/journey.service.ts"));
    const data = await getJourneyCatalog(client);
    assert.equal(data.countries.length, 2);
    assert.equal(data.countries[0].iso2, "SA"); assert.equal(data.countries[1].iso2, "EG");
    for (const language of ["ar", "en"]) {
      const state = { props: { language }, query: () => result(undefined, { isPending: true }) };
      await withUI("app/components/home/why-nour/NourWorldMap.tsx", state, async ({ render, click }) => {
        state.query = () => result(data); await render();
        assert.doesNotMatch(document.body.textContent, /country code is incomplete|رمز البلد غير مكتمل/);
        await click([...document.querySelectorAll("button")].find(button => button.textContent === (language === "ar" ? "من خارج المملكة" : "International")));
        assert.match(document.body.textContent, language === "ar" ? /مصر/ : /Egypt/);
      });
    }
  } finally { server.closeAllConnections(); await new Promise(done => server.close(done)); }
});

for (const language of ["ar", "en"]) test(`${language}: incomplete country codes cannot crash the map or be misclassified as international`, async () => {
  const base = { id: "country", nameAr: "دولة غير مكتملة", nameEn: "Incomplete country", latitude: 20, longitude: 30 };
  const codes = [undefined, null, 123, "", " ", "SAU"];
  const countries = codes.map((iso2, index) => ({ ...base, id: "bad-" + index, iso2 }));
  countries.push({ ...base, id: "sa", iso2: " sa ", nameAr: "السعودية", nameEn: "Saudi Arabia" });
  countries.push({ ...base, id: "eg", iso2: "eg", nameAr: "مصر", nameEn: "Egypt" });
  const data = { countries, cities: [{ id: "city", country_id: "sa", name_ar: "الرياض", name_en: "Riyadh", latitude: 24, longitude: 46 }], programs: [], departures: [] };
  await withUI("app/components/home/why-nour/NourWorldMap.tsx", { props: { language }, query: () => result(data) }, async ({ click }) => {
    assert.match(document.body.textContent, language === "ar" ? /الرياض/ : /Riyadh/);
    assert.match(document.body.textContent, language === "ar" ? /رمز البلد غير مكتمل/ : /country code is incomplete/);
    await click([...document.querySelectorAll("button")].find(button => button.textContent === (language === "ar" ? "من خارج المملكة" : "International")));
    assert.match(document.body.textContent, language === "ar" ? /مصر/ : /Egypt/);
    assert.doesNotMatch(document.querySelector("aside").textContent, /Incomplete country|دولة غير مكتملة|Saudi Arabia|السعودية/);
  });
});

const mapCatalog = {
  countries: [
    { id: "sa", iso2: "SA", nameAr: "السعودية", nameEn: "Saudi Arabia", latitude: 24, longitude: 45 },
    { id: "eg", iso2: "EG", nameAr: "مصر", nameEn: "Egypt", latitude: 26, longitude: 30 },
  ],
  cities: [
    { id: "riyadh", country_id: "sa", name_ar: "الرياض", name_en: "Riyadh", latitude: 24.7, longitude: 46.7 },
    { id: "missing", country_id: "sa", name_ar: "مدينة بلا إحداثيات", name_en: "Missing coordinates", latitude: null, longitude: null },
  ],
  programs: [program, { ...program, id: "egypt", slug: "egypt", countryId: "eg" }],
  departures: [
    { id: "d1", origin_city_id: "riyadh", program_id: program.id, start_at: "2099-01-01T09:00:00Z" },
    { id: "d2", origin_city_id: "riyadh", program_id: program.id, start_at: "2099-02-01T09:00:00Z" },
  ],
};
for (const language of ["ar", "en"]) test(language + ": map origins select real programs, count once, preserve language and isolate meeting failure", async () => {
  let retries = 0;
  const state = { props: { language }, query: options => options.queryKey[1] === "journey-map"
    ? result(mapCatalog) : result(undefined, { isError: true, refetch: () => retries++ }) };
  await withUI("app/components/home/why-nour/NourWorldMap.tsx", state, async ({ click, select }) => {
    const origins = document.querySelector(".locations");
    assert.match(origins.textContent, language === "ar" ? /برنامج واحد منشور/ : /1 published program/);
    assert.doesNotMatch(origins.textContent, /2 published programs|2 برامج منشورة/);
    assert.ok(document.querySelector("aside").contains(origins));
    await click(origins.querySelector("button"));
    assert.ok(document.querySelector("aside h3"));
    const detailLink=new URL(document.querySelector('a[href*="/programs/sample"]').href);assert.equal(detailLink.searchParams.get("lang"),language);assert.equal(new URL(detailLink.searchParams.get("from"),"https://nour.test").searchParams.get("city"),"riyadh");
    assert.equal(new URL(document.querySelector('a[href*="city="]').href).searchParams.get("city"), "riyadh");
    await select(document.querySelector("select"), "d1");
    assert.match(document.querySelector(".pickups").textContent, language === "ar" ? /تعذر تحميل/ : /could not be loaded/);
    assert.ok(document.querySelector('a[href*="/programs/sample"]'));
    await click(document.querySelector(".pickups button")); assert.equal(retries, 1);
    await click(document.querySelector("aside > button"));
    await click(document.querySelectorAll(".locations button")[1]);
    assert.match(document.querySelector("aside").textContent, language === "ar" ? /لا توجد برامج منشورة/ : /No published programs/);
    assert.match(document.querySelector("aside").textContent, language === "ar" ? /غير محدد على الخريطة/ : /coordinates are missing/);
    assert.equal(document.querySelector('aside a[href*="/programs/sample"]'), null);
    await click([...document.querySelectorAll(".tabs button")][1]);
    await click(document.querySelector(".locations button"));
    assert.equal(document.querySelector('a[href*="country="]').getAttribute("href"), "/programs?country=eg&lang=" + language);
    assert.match(document.querySelector(".notice").textContent, language === "ar" ? /متوقف/ : /paused/);
  });
});

for (const width of [390, 768, 1440]) test("map visibility at " + width + " keeps the origin list accessible", async () => {
  let notify;
  class Observer { constructor(fn) { notify = fn; } observe() {} disconnect() {} }
  const state = { props: { language: "en" }, query: () => result(mapCatalog), IntersectionObserver: Observer,
    matchMedia: () => ({ matches: width <= 760, addEventListener() {}, removeEventListener() {} }) };
  await withUI("app/components/home/why-nour/NourWorldMap.tsx", state, async ({ click }) => {
    assert.ok(document.querySelector(".locations button"));
    if (width <= 760) {
      assert.equal(document.querySelector("#journey-map").hidden, true);
      assert.equal(document.querySelector('[data-testid="geographic-map"]'), null);
      await click(document.querySelector(".locations button"));
      assert.ok(document.querySelector('a[href*="/programs/sample"]'));
      const toggle = document.querySelector(".mapToggle");
      await click(toggle);
      assert.equal(toggle.getAttribute("aria-expanded"), "true");
      assert.ok(document.querySelector('[data-testid="geographic-map"]'));
      await click(toggle);
      assert.equal(document.querySelector("#journey-map").hidden, true);
      assert.ok(document.querySelector('a[href*="/programs/sample"]'));
    } else {
      assert.equal(document.querySelector(".mapToggle"), null);
      assert.equal(document.querySelector('[data-testid="geographic-map"]'), null);
      await act(async () => notify([{ isIntersecting: true }]));
      assert.ok(document.querySelector('[data-testid="geographic-map"]'));
    }
  });
});

test("map catalog distinguishes pending, error with retry, and an empty response", async () => {
  let retries = 0;
  const state = { props: { language: "en" }, query: () => result(undefined, { isPending: true }) };
  await withUI("app/components/home/why-nour/NourWorldMap.tsx", state, async ({ render, click }) => {
    assert.match(document.querySelector("aside").textContent, /Loading locations/);
    state.query = () => result(mapCatalog, { isError: true, refetch: () => retries++ }); await render();
    assert.equal(document.querySelector(".locations"), null);
    await click(document.querySelector("aside button")); assert.equal(retries, 1);
    state.query = () => result({ countries: [], cities: [], programs: [], departures: [] }); await render();
    assert.match(document.querySelector("aside").textContent, /No published origins/);
    assert.equal(document.querySelector("aside button"), null);
  });
});

test("nearby map markers group by screen position while selected and destination remain distinct", () => {
  const load = loader(() => undefined);
  const { groupMarkers } = load(resolve(repo, "src/components/maps/marker-groups.ts"));
  const points = [{id:"a",x:5,y:5},{id:"b",x:12,y:12},{id:"c",x:200,y:200},{id:"m",x:5,y:5,destination:true}];
  assert.equal(groupMarkers(points).find(group => group.length === 2).map(point => point.id).join(","), "a,b");
  assert.equal(groupMarkers(points, "a").length, 4);
});

function fakeLeaflet() {
  const state = { maps: [], tiles: [], markers: [], views: [] };
  const L = {
    map(element) {
      const events = new Map();
      const instance = {
        zoom: 5,
        setView(center, zoom) { this.zoom = zoom; state.views.push({ center, zoom }); events.get("zoomend")?.(); return this; },
        fitBounds(bounds) { state.views.push({ bounds }); return this; },
        getZoom() { return this.zoom; }, getContainer() { return element; },
        project(latlng, zoom) { return { x: latlng[1] * zoom, y: latlng[0] * zoom }; },
        on(name, fn) { events.set(name, fn); return this; },
        off(name) { events.delete(name); return this; },
        invalidateSize() {}, remove() { this.removed = true; },
        events,
      };
      state.maps.push(instance); return instance;
    },
    tileLayer() {
      const tile = { events: {}, on(name, fn) { this.events[name] = fn; return this; }, addTo() { return this; } };
      state.tiles.push(tile); return tile;
    },
    layerGroup() { return { addTo() { return this; }, clearLayers() {}, remove() {} }; },
    divIcon(options) { return options; },
    marker(latlng, options) {
      const element = document.createElement("div");
      const marker = { options, latlng, element, events: {},
        addTo() { return this; }, bindTooltip() { return this; },
        on(name, fn) { this.events[name] = fn; return this; }, getElement() { return element; },
        getLatLng() { return { lat: latlng[0], lng: latlng[1] }; },
      };
      state.markers.push(marker); return marker;
    },
    polyline() { return { addTo() { return this; } }; },
  };
  return { L, state };
}

test("map engine retries tile failure, retains visitor view on language update, and selects with Space", async () => {
  const { L, state: engine } = fakeLeaflet();
  let selected;
  const state = { props: { language: "en", label: "Origins", points: [
    { id: "a", name: "Origin", latitude: 24, longitude: 45 },
  ], onSelect: id => { selected = id; }, cluster: true } };
  await withUI("src/components/maps/GeographicMap.tsx", state, async ({ click, render, dom }) => {
    assert.equal(engine.maps.length, 1);
    const viewCount = engine.views.length;
    state.props = { ...state.props, language: "ar" }; await render();
    assert.equal(engine.views.length, viewCount, "language must not reset pan or zoom");
    await act(async () => engine.markers.at(-1).element.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: " ", bubbles: true })));
    assert.equal(selected, "a");
    await act(async () => engine.tiles[0].events.tileerror());
    assert.match(document.querySelector('[role="status"]').textContent, /تعذر تحميل/);
    await click(document.querySelector("button"));
    assert.equal(engine.maps[0].removed, true);
    assert.equal(engine.maps.length, 2);
    assert.equal(document.querySelector("button"), null);
  }, name => name === "leaflet" ? L : undefined);
});

test("map engine can retry a failed library load", async () => {
  const { L, state: engine } = fakeLeaflet();
  let fail = true;
  await withUI("src/components/maps/GeographicMap.tsx", { props: { language: "en", label: "Origins", points: [] } }, async ({ click }) => {
    assert.match(document.querySelector('[role="status"]').textContent, /could not fully load/);
    assert.equal(engine.maps.length, 0); fail = false;
    await click(document.querySelector("button"));
    assert.equal(engine.maps.length, 1);
  }, name => { if (name === "leaflet") { if (fail) throw Error("Offline map library"); return L; } });
});

test("coordinate picker behavior retains click and drag callbacks without clustering", async () => {
  const { L, state: engine } = fakeLeaflet();
  let coords;
  await withUI("src/components/maps/GeographicMap.tsx", { props: {
    label: "Coordinates", selectedId: "pin",
    points: [{ id: "pin", name: "Pin", latitude: 24, longitude: 45 }],
    onPosition: (lat, lon) => { coords = [lat, lon]; },
  } }, async () => {
    assert.equal(engine.markers[0].options.draggable, true);
    engine.maps[0].events.get("click")({ latlng: { lat: 25.1234567, lng: 44.1 } });
    assert.deepEqual(coords, [25.123457, 44.1]);
    engine.markers[0].events.dragend();
    assert.deepEqual(coords, [24, 45]);
  }, name => name === "leaflet" ? L : undefined);
});

test("map component failure is contained while origin browsing keeps working", async () => {
  let notify;
  class Observer { constructor(fn) { notify = fn; } observe() {} disconnect() {} }
  const savedError = console.error; console.error = () => {};
  try {
    await withUI("app/components/home/why-nour/NourWorldMap.tsx", {
      props: { language: "en" }, query: () => result(mapCatalog), IntersectionObserver: Observer,
    }, async ({ click }) => {
      await act(async () => notify([{ isIntersecting: true }]));
      assert.match(document.querySelector(".map").textContent, /could not start/);
      await click(document.querySelector(".locations button"));
      assert.ok(document.querySelector('a[href*="/programs/sample"]'));
    }, name => name === "next/dynamic" ? { __esModule: true, default: () => () => { throw Error("Map chunk unavailable"); } } : undefined);
  } finally { console.error = savedError; }
});

for (const language of ["ar", "en"]) for (const detail of [false, true]) {
  test(language + ": public header offers " + (detail ? "program enquiry" : "no duplicate browsing CTA") + " instead of customer login", async () => {
    const noop = () => {};
    let closes = 0;
    const contact = { phoneHref: "tel:+966567488377", phoneLabel: "Contact", whatsappHref: "https://wa.me/966567488377" };
    const state = { url: detail ? "https://nour.test/programs/sample?lang=" + language : "https://nour.test/?lang=" + language,
      props: { language, t: { lang: language === "ar" ? "English" : "العربية" }, theme: "light",
        menuOpen: true, activeSection: "home", navItems: [], onLanguageChange: noop,
        onThemeChange: noop, onMenuToggle: noop, onMenuClose: () => closes++ } };
    await withUI("app/components/layout/PublicHeader.tsx", state, async ({ click }) => {
      const actions = document.querySelectorAll(".nr-v2-primary-action, .nr-v2-mobile-cta");
      assert.equal(actions.length, detail ? 2 : 0);
      const expectedLabel = detail
        ? language === "ar" ? "استفسر عن البرنامج" : "Ask about this program"
        : language === "ar" ? "استعرض برامج العمرة" : "Explore Umrah programs";
      for (const action of actions) {
        assert.equal(action.textContent, expectedLabel);
        assert.equal(action.getAttribute("href"), detail ? contact.whatsappHref : "/programs?lang=" + language);
        assert.equal(action.getAttribute("target"), detail ? "_blank" : null);
        if(detail) assert.equal(action.getAttribute("rel"), "noopener noreferrer");
      }
      assert.equal(document.querySelector('a[href*="/account"], a[href*="/login"]'), null);
      // Prevent external navigation in the DOM harness; still exercise menu close.
      if (detail) {
        actions[1].addEventListener("click", event => event.preventDefault());
        await click(actions[1]); assert.equal(closes, 1);
      }
    }, name => {
      if(name.endsWith("usePublicContact")) return { __esModule: true, default: () => contact };
      if(name.endsWith("supabase/client") || name.endsWith("account-access")) throw Error("Public header must not inspect customer sessions");
    });
  });
}
test("program enquiry falls back to the existing contact section when WhatsApp is unavailable", async () => {
  const noop = () => {};
  await withUI("app/components/layout/PublicHeader.tsx", {
    url: "https://nour.test/programs/sample",
    props: { language: "en", t: { lang: "العربية" }, theme: "light", menuOpen: false, activeSection: "programs", navItems: [],
      onLanguageChange: noop, onThemeChange: noop, onMenuToggle: noop, onMenuClose: noop },
  }, async () => {
    const action = document.querySelector(".nr-v2-primary-action");
    assert.equal(action.getAttribute("href"), "#contact");
    assert.equal(action.getAttribute("target"), null);
  }, name => name.endsWith("usePublicContact") ? { __esModule: true, default: () => ({ phoneHref: "", phoneLabel: "", whatsappHref: "" }) } : undefined);
});


for (const language of ["ar", "en"]) test(language + ": welcome expires and does not replay after a client remount", async () => {
  let finish;
  const state = {
    props: { language },
    setupDom(dom) {
      const original = dom.window.setTimeout.bind(dom.window);
      dom.window.setTimeout = (callback, delay, ...args) => {
        if (delay === 820) { finish = callback; return 4242; }
        return original(callback, delay, ...args);
      };
    },
  };
  await withUI("app/components/SiteIntro.tsx", state, async ({ render }) => {
    await act(async () => new Promise(resolve => window.setTimeout(resolve, 20)));
    assert.ok(document.querySelector(".nr-site-intro"));
    assert.equal(document.querySelector(".nr-site-intro").getAttribute("dir"), language === "ar" ? "rtl" : "ltr");
    assert.match(document.body.textContent, language === "ar" ? /رفيقك لرحلة السعادة/ : /Your companion for a joyful journey/);
    assert.equal(window.sessionStorage.getItem("nour-welcome-seen"), "1");
    assert.equal(typeof finish, "function");
    await act(async () => finish());
    assert.equal(document.querySelector(".nr-site-intro"), null);
    state.props = { language, key: "remount" };
    await render();
    await act(async () => new Promise(resolve => window.setTimeout(resolve, 20)));
    assert.equal(document.querySelector(".nr-site-intro"), null);
  });
});

test("a previously seen welcome stays hidden on a fresh component load", async () => {
  await withUI("app/components/SiteIntro.tsx", {
    props: { language: "ar" },
    setupDom(dom) { dom.window.sessionStorage.setItem("nour-welcome-seen", "1"); },
  }, async () => {
    assert.equal(document.querySelector(".nr-site-intro"), null);
    await act(async () => new Promise(resolve => window.setTimeout(resolve, 20)));
    assert.equal(document.querySelector(".nr-site-intro"), null);
  });
});

test("blocked storage still allows skipping and avoids replay during client navigation", async () => {
  const state = {
    props: { language: "en" },
    setupDom(dom) {
      Object.defineProperty(dom.window, "sessionStorage", { get() { throw new Error("Storage blocked"); } });
    },
  };
  await withUI("app/components/SiteIntro.tsx", state, async ({ render, click }) => {
    await act(async () => new Promise(resolve => window.setTimeout(resolve, 20)));
    assert.ok(document.querySelector(".nr-site-intro"));
    await click(document.querySelector(".nr-site-intro-skip"));
    assert.equal(document.querySelector(".nr-site-intro"), null);
    state.props = { language: "en", key: "remount" };
    await render();
    await act(async () => new Promise(resolve => window.setTimeout(resolve, 20)));
    assert.equal(document.querySelector(".nr-site-intro"), null);
    assert.equal(document.body.style.overflow, "");
  });
});


for (const component of ["HeroBackground", "DownloadOrnament"]) test(component + " pauses outside the viewport and in hidden tabs, and cleans up its observer", async () => {
  let notify, observed, disconnected = false, hidden = false;
  class Observer {
    constructor(callback) { notify = callback; }
    observe(node) { observed = node; }
    disconnect() { disconnected = true; }
  }
  await withUI("app/components/home/" + component + ".tsx", {
    IntersectionObserver: Observer,
    setupDom(dom) { Object.defineProperty(dom.window.document, "hidden", { get: () => hidden }); },
  }, async ({ dom }) => {
    const bg = document.querySelector('[data-active]');
    assert.equal(observed, bg);
    assert.equal(bg.getAttribute("aria-hidden"), "true");
    assert.equal(bg.dataset.active, "false");
    await act(async () => notify([{ isIntersecting: true }]));
    assert.equal(bg.dataset.active, "true");
    hidden = true;
    await act(async () => document.dispatchEvent(new dom.window.Event("visibilitychange")));
    assert.equal(bg.dataset.active, "false");
    hidden = false;
    await act(async () => document.dispatchEvent(new dom.window.Event("visibilitychange")));
    assert.equal(bg.dataset.active, "true");
    await act(async () => notify([{ isIntersecting: false }]));
    assert.equal(bg.dataset.active, "false");
    await act(async () => document.dispatchEvent(new dom.window.Event("visibilitychange")));
    assert.equal(bg.dataset.active, "false");
  });
  assert.equal(disconnected, true);
});

test("hero keeps the static decoration when visibility observation is unavailable", async () => {
  await withUI("app/components/home/HeroBackground.tsx", {
    setupDom(dom) { Object.defineProperty(dom.window, "IntersectionObserver", { get: () => undefined, set() {} }); },
  }, async () => {
    assert.equal(document.querySelector('[data-active]').dataset.active, "false");
    assert.ok(document.querySelector('svg[focusable="false"]'));
  });
});


for (const language of ["ar", "en"]) {
  test("privacy controls accept, reopen, customize and revoke in " + language, async () => {
    await withUI("app/components/PrivacyPreferences.tsx", {language}, async ({click, load}) => {
      const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
      assert.equal(privacy.analyticsAllowed(), false);
      assert.equal(document.querySelector("[role=region]").parentElement.dir, language === "ar" ? "rtl" : "ltr");
      const button = text => [...document.querySelectorAll("button")].find(b => b.textContent === text);
      await click(button(language === "ar" ? "قبول الكل" : "Accept all"));
      assert.equal(privacy.analyticsAllowed(), true);
      assert.equal(document.querySelector("[role=region]"), null);
      await click(button(language === "ar" ? "إعدادات الخصوصية" : "Privacy settings"));
      await act(async () => { await new Promise(r => setTimeout(r, 10)); });
      assert.equal(document.activeElement.id, "privacy-title");
      assert.equal(document.querySelector('input[type=checkbox]').checked, true);
      window.localStorage.setItem("nourapp_visitor_session_key", "analytics-id");
      window.localStorage.setItem("nour-theme", "dark");
      window.localStorage.setItem("sb-admin-auth", "preserve");
      window.sessionStorage.setItem("nour:map-events", "[]");
      await click(document.querySelector('input[type=checkbox]'));
      await click(button(language === "ar" ? "حفظ اختياراتي" : "Save my choices"));
      assert.equal(privacy.analyticsAllowed(), false);
      assert.equal(window.localStorage.getItem("nourapp_visitor_session_key"), null);
      assert.equal(window.sessionStorage.getItem("nour:map-events"), null);
      assert.equal(window.localStorage.getItem("sb-admin-auth"), "preserve");
      assert.equal(window.localStorage.getItem("nour-theme"), "dark");
      assert.equal(JSON.parse(window.localStorage.getItem(privacy.CONSENT_KEY)).analytics, false);
    });
  });
}

test("privacy decline is remembered on remount and Escape does not change it", async () => {
  const state = {props: {key: 1}};
  await withUI("app/components/PrivacyPreferences.tsx", state, async ({click, render}) => {
    await click([...document.querySelectorAll("button")].find(b => b.textContent === "Reject optional"));
    state.props = {key: 2};
    await render();
    assert.equal(document.querySelector("[role=region]"), null);
    await click([...document.querySelectorAll("button")].find(b => b.textContent === "Privacy settings"));
    await click(document.querySelector("input"));
    await act(async () => document.querySelector("[role=region]").dispatchEvent(new window.KeyboardEvent("keydown", {key:"Escape", bubbles:true})));
    assert.equal(document.querySelector("[role=region]"), null);
    assert.equal(JSON.parse(window.localStorage.getItem("nour:privacy:v1")).analytics, false);
  });
});

test("privacy defaults reject corrupt, expired and unsupported consent", async () => {
  for (const raw of ["broken", JSON.stringify({version: 2, analytics: true}), JSON.stringify({version:1,analytics:true,savedAt:0,expiresAt:15552000000})]) {
    await withUI("app/components/PrivacyPreferences.tsx", {setupDom: dom => dom.window.localStorage.setItem("nour:privacy:v1", raw)}, async ({load}) => {
      assert.ok(document.querySelector("[role=region]"));
      const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
      assert.equal(privacy.analyticsAllowed(), false);
    });
  }
});

test("privacy controls remain usable when browser storage is blocked", async () => {
  await withUI("app/components/PrivacyPreferences.tsx", {setupDom: dom => {
    Object.defineProperty(dom.window, "localStorage", {get(){throw Error("blocked");}});
    Object.defineProperty(dom.window, "sessionStorage", {get(){throw Error("blocked");}});
  }}, async ({click, load}) => {
    const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
    await click([...document.querySelectorAll("button")].find(b => b.textContent === "Accept all"));
    assert.equal(privacy.analyticsAllowed(), true);
    assert.match(document.querySelector("[role=status]").textContent, /storage is unavailable/);
    await click([...document.querySelectorAll("button")].find(b => b.textContent === "Privacy settings"));
    await click([...document.querySelectorAll("button")].find(b => b.textContent === "Reject optional"));
    assert.equal(privacy.analyticsAllowed(), false);
  });
});

test("privacy changes in another tab and expiry stop optional tracking", async () => {
  await withUI("app/components/PrivacyPreferences.tsx", {}, async ({load}) => {
    const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
    await act(async () => privacy.saveConsent(true));
    assert.equal(privacy.analyticsAllowed(), true);
    const accepted = JSON.parse(window.localStorage.getItem(privacy.CONSENT_KEY));
    await act(async () => {
      window.localStorage.setItem(privacy.CONSENT_KEY, JSON.stringify({...accepted, analytics:false}));
      window.dispatchEvent(new window.StorageEvent("storage", {key:privacy.CONSENT_KEY}));
    });
    assert.equal(privacy.analyticsAllowed(), false);
    await act(async () => privacy.saveConsent(true));
    await act(async () => {
      window.localStorage.setItem(privacy.CONSENT_KEY, JSON.stringify({...accepted,savedAt:0,expiresAt:privacy.CONSENT_DURATION}));
      window.dispatchEvent(new window.Event("focus"));
    });
    assert.equal(privacy.analyticsAllowed(), false);
    assert.ok(document.querySelector("[role=region]"));
  });
});

test("both analytics entry points gate client creation, network calls, event queues and storage", async () => {
  let clients = 0, calls = 0, dispatched = 0, google = 0;
  const priorEnv = {url:process.env.NEXT_PUBLIC_SUPABASE_URL, key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54322";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "local-test-only";
  try {
    await withUI("app/components/PrivacyPreferences.tsx", {}, async ({load}) => {
      const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
      const service = load(resolve(repo, "src/features/analytics/services/visitor-analytics.service.ts"));
      const map = load(resolve(repo, "src/lib/analytics/map-events.ts"));
      window.dataLayer = [];
      window.gtag = () => google++;
      window.addEventListener("nour:analytics", () => dispatched++);
      const track = async () => {
        await service.recordVisitorPageVisit({pagePath:"/programs"});
        map.trackMapEvent("map_view_all_clicked");
      };
      await track();
      assert.equal(clients,0); assert.equal(calls,0); assert.equal(dispatched,0);
      assert.equal(window.dataLayer.length,0); assert.equal(google,0);
      assert.equal(window.localStorage.getItem("nourapp_visitor_session_key"),null);
      assert.equal(window.sessionStorage.getItem("nour:map-events"),null);
      await act(async () => privacy.saveConsent(true));
      await track();
      assert.equal(clients,1); assert.equal(calls,1); assert.equal(dispatched,1);
      assert.equal(window.dataLayer.length,1); assert.equal(google,1);
      assert.ok(window.localStorage.getItem("nourapp_visitor_session_key"));
      await act(async () => privacy.saveConsent(false));
      await track();
      assert.equal(calls,1); assert.equal(dispatched,1); assert.equal(google,1);
      assert.equal(window.localStorage.getItem("nourapp_visitor_session_key"),null);
      assert.equal(window.sessionStorage.getItem("nour:map-events"),null);
      await act(async () => privacy.saveConsent(true));
      window.history.replaceState(null,"","/admin/dashboard");
      await track();
      assert.equal(calls,1); assert.equal(google,1);
    }, name => name === "@supabase/ssr" ? {createBrowserClient: () => {
      clients++;
      return {rpc: async (method) => {assert.equal(method,"record_page_visit"); calls++; return {error:null};}};
    }} : undefined);
  } finally {
    if (priorEnv.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL=priorEnv.url;
    if (priorEnv.key === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=priorEnv.key;
  }
});

test("page tracker starts after acceptance and stops on withdrawal and account/admin routes", async () => {
  let calls = 0;
  await withUI("src/features/analytics/components/VisitorAnalyticsTracker.tsx", {}, async ({load, render}) => {
    const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
    assert.equal(calls,0);
    await act(async () => privacy.saveConsent(true));
    assert.equal(calls,1);
    await render();
    assert.equal(calls,1);
    await act(async () => privacy.saveConsent(false));
    window.history.replaceState(null,"","/articles"); await render();
    assert.equal(calls,1);
    await act(async () => privacy.saveConsent(true));
    assert.equal(calls,2);
    window.history.replaceState(null,"","/admin/dashboard"); await render();
    window.history.replaceState(null,"","/account/login"); await render();
    assert.equal(calls,2);
  }, name => name.endsWith("visitor-analytics.service") ? {recordVisitorPageVisit: async () => { calls++; }} : undefined);
});

test("privacy banner stays out of account and admin screens", async () => {
  for (const path of ["/admin/login", "/account/login"]) {
    await withUI("app/components/PrivacyPreferences.tsx", {url:"https://nour.test"+path}, async () => {
      assert.equal(document.querySelector("[role=region]"), null);
      assert.equal(document.querySelector("button"), null);
    });
  }
});


for (const language of ["ar", "en"]) {
  test(language + ": payment cards preserve provider identities and editable copy without an operational notice", async () => {
    await withUI("app/components/home/Payments.tsx", {props:{language}}, async () => {
      assert.equal(document.getElementById("payments").dir, language === "ar" ? "rtl" : "ltr");
      const cards = [...document.querySelectorAll(".payment-logos figure")];
      assert.equal(cards.length,6);
      for (const card of cards) {
        const name = card.querySelector("figcaption").textContent.trim();
        assert.equal(card.querySelector("img").alt, name);
        assert.equal(card.querySelectorAll("a,button").length,0);
        assert.equal(card.querySelector(".nr-payment-brand-meta span"),null);
      }
      assert.deepEqual(cards.map(c => c.querySelector("img").getAttribute("src")), [
        "/images/payments/mada.png", "/images/payments/visa.png",
        "/images/payments/mastercard.png", "/images/payments/apple-pay.png",
        "/images/payments/tabby.png", "/images/payments/tamara.png",
      ]);
      assert.equal(document.querySelectorAll(".nr-payment-flex-badge").length,0);
      assert.equal(document.querySelector("#payments a, #payments button"), null);
      assert.doesNotMatch(document.querySelector("#payments").textContent, /الحجز والدفع عبر الموقع متوقفان حاليًا|الشعارات تعريفية فقط|Website booking and payment are (currently )?paused|Logos are informational only/);
      assert.match(document.querySelector("#payments h2").textContent, language === "ar" ? /وسائل الدفع/ : /Payment methods/);
    });
  });
}

for (const language of ["ar", "en"]) test(language + ": privacy clearance follows bar wrapping, desktop visibility and navigation", async () => {
  let measure, disconnected = false;
  const property = "--nour-program-bar-clearance";
  const state = {
    language, url: "https://nour.test/programs/sample",
    setupDom(dom) {
      dom.window.ResizeObserver = class {
        constructor(callback) { measure = callback; }
        observe() {}
        disconnect() { disconnected = true; }
      };
    },
  };
  await withUI("app/programs/ProgramDetailsExperience.tsx", state, async ({ dom, render }) => {
    const programStatus = document.createElement("span");
    programStatus.className = "nr-program-details-book";
    await act(async () => { document.body.append(programStatus); });
    const bar = document.querySelector(".nr-program-mobile-booking");
    let height = 72;
    bar.getBoundingClientRect = () => ({ height });
    await act(async () => measure());
    assert.equal(document.documentElement.style.getPropertyValue(property), "82px");
    height = 124; // A second text line, translated copy or text zoom.
    await act(async () => measure());
    assert.equal(document.documentElement.style.getPropertyValue(property), "134px");
    height = 0; // CSS hides the bar above the tablet breakpoint.
    await act(async () => window.dispatchEvent(new dom.window.Event("resize")));
    assert.equal(document.documentElement.style.getPropertyValue(property), "0px");
    window.history.replaceState(null, "", "/programs");
    await render();
    assert.equal(document.documentElement.style.getPropertyValue(property), "");
    assert.equal(disconnected, true);
    assert.equal(document.querySelector(".nr-program-mobile-booking"), null);
  });
});

for (const language of ["ar", "en"]) for (const theme of ["light", "dark"]) {
  test(language + " " + theme + ": itinerary, meeting and inclusion labels meet normal-text contrast", async () => {
    const text = { titleAr: "مثال", titleEn: "Example", descriptionAr: "وصف", descriptionEn: "Description" };
    const content = {
      itinerary: [{ id: "day", dayNumber: 1, ...text }],
      inclusions: [{ id: "inc", inclusionType: "included", ...text }],
      meetingPoints: [{ id: "meeting", nameAr: "نقطة تجمع", nameEn: "Meeting point", addressAr: "عنوان", addressEn: "Address" }],
      cancellation: [], priceTiers: [], faqs: [],
    };
    await withUI("app/programs/ProgramStructuredContent.tsx", {
      language,
      query: options => result(options.queryKey[1] === "program-structured-content-id" ? "sample" : content),
    }, async () => {
      document.documentElement.dataset.theme = theme;
      document.getElementById("root").className = "programs-shell";
      const css = document.createElement("style");
      css.textContent = readFileSync(resolve(repo, "app/programs/programs-ui.css"), "utf8");
      document.body.append(css);
      const luminance = color => {
        const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
        assert.equal(channels?.length, 3, "Expected a resolved CSS color: " + color);
        return channels.map(v => { const s=v/255; return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4; })
          .reduce((sum,v,i) => sum+v*[0.2126,0.7152,0.0722][i],0);
      };
      for (const [textSelector, surfaceSelector] of [
        [".psc-day h4", ".psc-day"], [".psc-day p", ".psc-day"],
        [".psc-mini > strong", ".psc-mini"], [".psc-mini p", ".psc-mini"],
        [".psc-included h4", ".psc-included"], [".psc-excluded h4", ".psc-excluded"],
      ]) {
        const foreground = luminance(window.getComputedStyle(document.querySelector(textSelector)).color);
        const background = luminance(window.getComputedStyle(document.querySelector(surfaceSelector)).backgroundColor);
        const ratio = (Math.max(foreground,background)+0.05)/(Math.min(foreground,background)+0.05);
        assert.ok(ratio >= 4.5, textSelector + " contrast is " + ratio.toFixed(2));
      }
    });
  });
}

for (const language of ["ar", "en"]) test(language + ": embedded bar privacy control opens the shared panel and restores focus", async () => {
  const state = { language, url: "https://nour.test/programs/sample",
    sibling: load => React.createElement(load(resolve(repo, "app/components/PrivacyPreferences.tsx")).default),
  };
  await withUI("app/programs/ProgramDetailsExperience.tsx", state, async ({ click, load, render }) => {
    const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
    await act(async () => privacy.saveConsent(false));
    const content = document.createElement("span"); content.className = "nr-program-details-book";
    await act(async () => document.body.append(content));
    const trigger = document.querySelector(".nr-program-privacy-button");
    assert.ok(trigger.closest(".nr-program-mobile-booking"));
    assert.equal(trigger.getAttribute("aria-label"), language === "ar" ? "إعدادات الخصوصية" : "Privacy settings");
    trigger.getClientRects = () => [{width:100,height:44}];
    trigger.focus(); await click(trigger);
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    assert.equal(document.activeElement.id, "privacy-title");
    assert.equal(document.querySelector("input[type=checkbox]").checked, false);
    await act(async () => document.querySelector("[role=region]").dispatchEvent(new window.KeyboardEvent("keydown", {key:"Escape",bubbles:true})));
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    assert.equal(document.activeElement, trigger);
    assert.equal(privacy.analyticsAllowed(), false);
    // A desktop resize while open must return focus to the normal launcher.
    trigger.focus(); await click(trigger);
    trigger.getClientRects = () => [];
    await act(async () => document.querySelector("[role=region]").dispatchEvent(new window.KeyboardEvent("keydown", {key:"Escape",bubbles:true})));
    await act(async () => { await new Promise(r => setTimeout(r, 10)); });
    assert.equal(document.activeElement.className, "launcher");
    window.history.replaceState(null, "", "/programs"); await render();
    assert.equal(document.querySelector(".nr-program-mobile-booking"), null);
    assert.ok(document.querySelector("button.launcher"));
  });
});

test("English result count distinguishes zero, one and multiple programs after filtering", async () => {
  const state = {language:"en", catalog:result([program])};
  await withUI("app/programs/ProgramCatalogClient.tsx", state, async ({render}) => {
    const count=()=>document.querySelector(".nr-all-programs-result-row strong").textContent;
    assert.equal(count(),"1 program");
    state.catalog=result([]); await render(); assert.equal(count(),"0 programs");
    state.catalog=result([program,{...program,id:"two",slug:"two"}]); await render(); assert.equal(count(),"2 programs");
  });
});

for (const language of ["ar", "en"]) for (const theme of ["light", "dark"]) {
  test(language + " " + theme + ": all flight inclusion notices have readable titles and notes", async () => {
    let inclusion="excluded";
    const state={language, query:({queryKey})=>result(["transports","visas"].includes(queryKey.at(-1))?[]:{...program,flightInclusion:inclusion,flightNotesAr:"تفاصيل الطيران",flightNotesEn:"Flight details",display:{travelMode:"air",origins:[],departures:[],stays:[],transports:[],actualFlightCount:1},flights:[{id:"real",departureAirportEn:"RUH",arrivalAirportEn:"JED",departureAt:"2099-01-01T09:00:00Z",arrivalAt:"2099-01-01T11:00:00Z"}]})};
    await withUI("app/programs/[slug]/ProgramDetailsClient.tsx",state,async ({render})=>{
      document.documentElement.dataset.theme=theme; document.getElementById("root").className="programs-shell";
      const css=document.createElement("style");css.textContent=readFileSync(resolve(repo,"app/programs/programs-ui.css"),"utf8");document.body.append(css);
      const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      for(const variant of ["included","excluded","dynamic"]){
        inclusion=variant;await render();
        const notice=document.querySelector(".nr-program-flight-policy");assert.ok(notice);
        const bg=luminance(window.getComputedStyle(notice).backgroundColor);
        for(const element of notice.querySelectorAll("strong,span")){
          const fg=luminance(window.getComputedStyle(element).color);
          assert.ok((Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5,variant+": "+element.textContent);
        }
      }
    });
  });
}

for (const language of ["ar", "en"]) test(language + ": Escape closes privacy after language switch with external focus", async () => {
  const state = {language, url:"https://nour.test/"};
  await withUI("app/components/PrivacyPreferences.tsx", state, async ({click, load, render}) => {
    const privacy = load(resolve(repo, "src/core/privacy/consent.ts"));
    await act(async () => privacy.saveConsent(false));
    const saved = window.localStorage.getItem(privacy.CONSENT_KEY);
    const trigger = document.querySelector("button.launcher");
    trigger.focus(); await click(trigger);
    await click(document.querySelector("input[type=checkbox]")); // Unsaved choice must be discarded.
    const languageButton = document.createElement("button");
    languageButton.textContent="Switch language"; document.body.append(languageButton);
    languageButton.focus(); state.language = language === "ar" ? "en" : "ar"; await render();
    assert.equal(document.activeElement, languageButton);
    assert.ok(document.querySelector("[role=region]"));
    await act(async () => languageButton.dispatchEvent(new window.KeyboardEvent("keydown", {key:"Escape",bubbles:true,cancelable:true})));
    await act(async () => {await new Promise(r=>setTimeout(r,10));});
    assert.ok(!document.querySelector("[role=region]"), "Escape must close the panel even with external focus");
    assert.equal(document.activeElement.className, "launcher");
    assert.equal(window.localStorage.getItem(privacy.CONSENT_KEY), saved);
    // Closed panels must not intercept Escape elsewhere.
    const closedEvent = new window.KeyboardEvent("keydown", {key:"Escape",bubbles:true,cancelable:true});
    languageButton.dispatchEvent(closedEvent); assert.equal(closedEvent.defaultPrevented, false);
    await click(document.querySelector("button.launcher"));
    window.history.replaceState(null,"","/admin/login"); await render();
    const hiddenEvent = new window.KeyboardEvent("keydown", {key:"Escape",bubbles:true,cancelable:true});
    languageButton.dispatchEvent(hiddenEvent); assert.equal(hiddenEvent.defaultPrevented, false);
  });
});

for (const language of ["ar", "en"]) for (const theme of ["light", "dark"]) {
  test(language + " " + theme + ": price-card coming-soon status is centered and readable", async () => {
    const state={language,query:({queryKey})=>result(["transports","visas"].includes(queryKey.at(-1))?[]:program)};
    await withUI("app/programs/[slug]/ProgramDetailsClient.tsx",state,async ()=>{
      document.documentElement.dataset.theme=theme;document.getElementById("root").className="programs-shell";
      const css=document.createElement("style");css.textContent=readFileSync(resolve(repo,"app/programs/programs-ui.css"),"utf8");document.body.append(css);
      const status=document.querySelector(".nr-program-details-booking > .nr-program-details-book");
      assert.equal(status.getAttribute("role"),"status");assert.equal(status.hasAttribute("href"),false);
      assert.equal(status.textContent,language==="ar"?"التطبيق قريبًا":"App coming soon");
      const style=window.getComputedStyle(status);
      assert.equal(style.display,"flex");assert.equal(style.alignItems,"center");assert.equal(style.justifyContent,"center");
      const lum=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      assert.ok(!style.color.startsWith("rgba"),"Status text must be opaque");
      const fg=lum(style.color),bg=lum(style.backgroundColor);
      assert.ok((Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5,"Status text contrast");
    });
  });
}

for(const language of ['ar','en'])test(language+': international country drills into cities and list/map use the same selection after refetch',async()=>{
 const data=structuredClone(mapCatalog);data.cities.push({id:'cairo',country_id:'eg',name_ar:'القاهرة',name_en:'Cairo',latitude:30,longitude:31});data.departures.push({id:'de',origin_city_id:'cairo',program_id:'egypt',start_at:'2099-01-01T10:00:00Z'});
 let notify;const state={props:{language},IntersectionObserver:class{constructor(fn){notify=fn;}observe(){}disconnect(){}},query:()=>result(data)};
 await withUI('app/components/home/why-nour/NourWorldMap.tsx',state,async({click,render})=>{
  await act(async()=>notify([{isIntersecting:true}]));await click(document.querySelectorAll('.tabs button')[1]);await click(document.querySelector('.locations button'));
  const city=document.querySelector('.locations button');assert.match(city.textContent,/Cairo|القاهرة/);await click(city);const before=document.querySelector('aside').textContent;assert.ok(document.querySelector('a[href*="city=cairo"]'));
  await click(document.querySelector('[data-map-point="cairo"]'));assert.equal(document.querySelector('aside').textContent,before);await render();assert.equal(document.querySelector("aside").textContent,before);
 },name=>name==='next/dynamic'?{__esModule:true,default:()=>props=>React.createElement('div',null,props.points.filter(p=>!p.destination).map(p=>React.createElement('button',{key:p.id,'data-map-point':p.id,onClick:()=>props.onSelect(p.id)},p.name)))}:undefined);
});
test('map resource failure preserves locations and reports unavailable counts instead of successful zero',async()=>{
 const data={...mapCatalog,programs:[],departures:[],errors:['programs','departures']};let retried=0;
 await withUI('app/components/home/why-nour/NourWorldMap.tsx',{props:{language:'en'},query:()=>result(data,{refetch:()=>retried++})},async({click})=>{
  assert.match(document.querySelector('.locations').textContent,/counts unavailable/);assert.doesNotMatch(document.querySelector('.locations').textContent,/No published programs/);await click(document.querySelector('[role=alert] button'));assert.equal(retried,1);await click(document.querySelector('.locations button'));assert.match(document.querySelector('aside').textContent,/could not be loaded/);
 });
});

for(const [name,file] of [['services','Services'],['map','why-nour/NourWorldMap'],['journey','Journey'],['why','WhyNour'],['payments','Payments'],['priorities','NourStatistics']])test(name+': actual home component renders edited bilingual section content',async()=>{
 const {copy}=await import('../app/data/home.ts');const presentation=structuredClone(defaultPresentation);presentation.sections[name].title={ar:'عنوان مسودة فعلي',en:'Actual draft heading'};presentation.sections[name].description={ar:'وصف مسودة فعلي',en:'Actual draft description'};
 for(const language of ['ar','en'])await withUI('app/components/home/'+file+'.tsx',{props:{language,t:copy[language]},query:()=>result(mapCatalog)},async()=>{assert.equal(document.querySelector('h2').textContent,language==='ar'?'عنوان مسودة فعلي':'Actual draft heading');assert.match(document.body.textContent,language==='ar'?/وصف مسودة فعلي/:/Actual draft description/);},module=>module.endsWith('usePresentation')?{usePresentation:()=>presentation}:undefined);
});

for (const canPublish of [true, false]) test(`country create/edit forms receive publication permission ${canPublish} and preserve saved market state`, async () => {
 const country={id:'us',nameAr:'الولايات المتحدة',nameEn:'United States',iso2:'US',iso3:'USA',phoneCode:'+1',currencyCode:'USD',currencyNameAr:'دولار',currencyNameEn:'US Dollar',timezone:'America/Los_Angeles',latitude:38,longitude:-97,status:'active',sortOrder:0,updatedAt:'2026-11-09',marketStatus:'browsable',publicationStatus:'published',showPublic:true,showOnMap:true,statusLabelAr:'أسعار مؤقتة',statusLabelEn:'Provisional prices',phoneCodes:['+1'],currencyCodes:['USD'],timezones:['America/Los_Angeles'],directorySource:'directory',flagEmoji:'🇺🇸'};
 let formProps;
 const permissions={'countries.create':true,'countries.update':true,'countries.publish':canPublish,'countries.delete':false,'countries.archive':false};
 await withUI('src/features/countries/index.tsx',{url:'https://nour.test/admin/countries'},async({click})=>{
  await click([...document.querySelectorAll('button')].find(b=>b.textContent==='Add country'));
  assert.equal(formProps.canPublish,canPublish);
  await click(document.querySelector('[aria-label="Close dialog"]'));
  await click(document.querySelector('[data-edit-country]'));
  assert.equal(formProps.canPublish,canPublish);
  for(const key of ['marketStatus','publicationStatus','showPublic','showOnMap','statusLabelAr','statusLabelEn','phoneCodes','currencyCodes','timezones','directorySource','flagEmoji']) assert.deepEqual(JSON.parse(JSON.stringify(formProps.initialValues[key])),country[key],key);
 }, name=>{
  if(name==='@tanstack/react-query')return {useQuery:({queryKey})=>result(queryKey.includes('permissions')?permissions:queryKey.includes('deleted')?[]:[country]),useMutation:()=>({isPending:false,mutate(){},mutateAsync:async()=>{}}),useQueryClient:()=>({invalidateQueries:async()=>{}})};
  if(name.endsWith('core/i18n'))return {useLanguage:()=>({language:'en'}),getAdminTranslations:()=>({countries:{pageTitle:'Countries',pageDescription:'Manage countries',recycleBin:'Trash',addCountry:'Add country'}})};
  if(name.endsWith('core/hooks'))return {usePersistentState:(_key,value)=>React.useState(value)};
  if(name.endsWith('core/notifications'))return {useToast:()=>({showToast(){}})};
  if(name.endsWith('core/dialogs'))return {ConfirmDialog:()=>null};
  if(name.endsWith('core/pagination'))return {Pagination:()=>null};
  if(name.endsWith('core/states'))return {ErrorState:()=>null,TableSkeleton:()=>null};
  if(name==='./services')return {countriesQuery:()=>({queryKey:['countries']}),deletedCountriesQuery:()=>({queryKey:['countries','deleted']})};
  if(name==='./tables/CountriesTable')return {__esModule:true,default:({onEdit})=>React.createElement('button',{'data-edit-country':true,onClick:()=>onEdit(country)},'Edit country')};
  if(name==='./forms/CountryForm')return {__esModule:true,default:props=>{formProps=props;return React.createElement('output',null,'Country form');}};
 });
});

for(const scenario of [{demo:true,ports:true},{demo:false,ports:true},{demo:true,ports:false}]) test(`program form accepts pending demo airline only with route airports: ${JSON.stringify(scenario)}`,async()=>{
 let submitted=0;
 const flight={direction:'outbound',airlineNameAr:'',airlineNameEn:'',flightNumber:'',departureAirportAr:scenario.ports?'لوس أنجلوس':'',departureAirportEn:scenario.ports?'LAX':'',arrivalAirportAr:'جدة',arrivalAirportEn:'JED',departureAt:'',arrivalAt:'',flightType:'direct',transitAirportAr:'',transitAirportEn:'',transitDurationMinutes:null,cabinClassAr:'',cabinClassEn:'',baggageAllowanceKg:null,notesAr:'مسار مقترح',notesEn:'Proposed route',sortOrder:0};
 await withUI('src/features/programs/forms/ProgramForm.tsx',{url:'https://nour.test/admin/programs',props:{initialValues:{...program,status:'published',isDemo:scenario.demo,flights:[flight],transports:[],visas:[],departures:[],flightNotesAr:'',flightNotesEn:''},countries:[{id:'sa',nameAr:'السعودية',nameEn:'Saudi Arabia'}],onSubmit:async()=>{submitted++;}}},async({dom})=>{
  const airline=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('Airline Arabic')).querySelector('input');
  assert.equal(airline.required,!scenario.demo);
  await act(async()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(submitted,scenario.demo&&scenario.ports?1:0);
 },name=>{
  if(name.endsWith('useUnsaved'))return {useDraftGuard:()=>()=>{}};
  if(name.endsWith('/ProgramCard')||name.endsWith('/MediaUploader')||name==='./DepartureFields')return {__esModule:true,default:()=>null};
 });
});

for(const language of ['ar','en']) test(`video section ${language} defers playback, labels the dialog and closes it`,async()=>{
 const video={id:'v',title_ar:'فيديو نور آب',title_en:'Nour App video',description_ar:'تجربة مرئية',description_en:'Visual experience',cover_url:'/images/videos/nour-teaser.jpg',source_kind:'link',source_url:'/videos/nour-teaser.mp4',orientation:'portrait',category:'about',duration_seconds:32,show_on_home:true,status:'published',is_featured:true,sort_order:0,updated_at:'today',cta_href:'/programs',cta_ar:'البرامج',cta_en:'Programs'};
 const state={language,props:{language},setupDom:dom=>{dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};},query:({queryKey})=>result(queryKey.includes('video-source')?{kind:'native',url:'/videos/nour-teaser.mp4'}:[video])};
 await withUI('src/features/videos/VideoShowcase.tsx',state,async({click})=>{
  assert.equal(document.querySelector('video'),null);assert.equal(document.querySelector('iframe'),null);
  assert.equal(document.querySelectorAll('article').length,1);
  const open=[...document.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')?.startsWith(language==='ar'?'مشاهدة:':'Watch:'));
  await click(open);assert.ok(document.querySelector('dialog[open]'));assert.ok(document.querySelector('video[controls]'));assert.equal(document.querySelector('video').hasAttribute('autoplay'),false);assert.equal(document.querySelector('video').getAttribute('preload'),'metadata');assert.equal(document.body.style.overflow,'hidden');
  await click(document.querySelector(`button[aria-label="${language==='ar'?'إغلاق الفيديو':'Close video'}"]`));assert.equal(document.querySelector('dialog'),null);assert.equal(document.body.style.overflow,'');
 },name=>name.endsWith('usePresentation')?{usePresentation:()=>({...defaultPresentation})}:undefined);
});
test('empty homepage video section hides while gallery offers an explicit empty state',async()=>{
 await withUI('src/features/videos/VideoShowcase.tsx',{props:{language:'en'},query:()=>result([])},async()=>assert.equal(document.querySelector('section'),null));
 await withUI('src/features/videos/VideoShowcase.tsx',{props:{language:'en',gallery:true},query:()=>result([])},async()=>assert.match(document.body.textContent,/No matching published videos/));
});
test('video gallery filters categories without confusing empty content and a failed request',async()=>{
 const state={props:{language:'en',gallery:true},query:()=>result(undefined,{isError:true})};
 await withUI('src/features/videos/VideoShowcase.tsx',state,async({render,select})=>{
  assert.ok(document.querySelector('[role="alert"]'));assert.doesNotMatch(document.body.textContent,/No matching/);
  state.query=()=>result([{id:'one',title_ar:'تعريف',title_en:'Introduction',description_ar:'',description_en:'',cover_url:'/images/videos/nour-teaser.jpg',orientation:'landscape',category:'about',duration_seconds:30,show_on_home:true,cta_href:''}]);await render();assert.equal(document.querySelectorAll('article').length,1);await select(document.querySelector('select'),'app');assert.equal(document.querySelectorAll('article').length,0);assert.match(document.body.textContent,/No matching published videos/);
 });
});
