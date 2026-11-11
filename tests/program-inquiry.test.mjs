import assert from "node:assert/strict";
import {test} from "node:test";
import {programInquiryHref} from "../src/features/programs/utils/program-inquiry.ts";
import {departureMonth} from "../src/features/programs/utils/program-discovery.ts";
test("program enquiries preserve the configured recipient and safely encode the program identity",()=>{
  for(const lang of ["ar","en"]) {
    const href = new URL(programInquiryHref("https://wa.me/966541812449", "نور & برنامج؟", "test & package", lang));
    assert.equal(href.origin,"https://wa.me");
    assert.equal(href.pathname,"/966541812449");
    assert.match(href.searchParams.get("text"), /نور & برنامج؟/);
    assert.ok(href.searchParams.get("text").includes(`https://nourappglobal.com/programs/test%20%26%20package?lang=${lang}`));
  }
  for (const bad of ["", "#contact", "javascript:alert(1)","https://evil.test/123"]) assert.equal(programInquiryHref(bad,"x","x","ar"),"#contact");
});
test("departure month uses the published timezone across a month boundary",()=>{
  assert.equal(departureMonth("2026-12-01T01:00:00Z","America/Los_Angeles"),"2026-11");
  assert.equal(departureMonth("2026-12-01T01:00:00Z","Asia/Riyadh"),"2026-12");
  assert.equal(departureMonth("invalid",null),"");
});
