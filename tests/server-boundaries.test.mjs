import assert from "node:assert/strict";
import { test } from "node:test";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { loadServerModule } from "./helpers/load-server-module.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
function files(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory()
    ? files(resolve(dir,e.name)) : /\.tsx?$/.test(e.name) ? [resolve(dir,e.name)] : []);
}
test("server modules carry a boundary marker and no client import chain reaches them", () => {
  const all = [...files(resolve(root,"app")), ...files(resolve(root,"src"))];
  const server = files(resolve(root,"src/server"));
  for (const file of server) assert.match(readFileSync(file,"utf8"), /import ["']server-only["']/);
  const graph = new Map();
  const client = [];
  for (const file of all) {
    const sf = ts.createSourceFile(file, readFileSync(file,"utf8"), ts.ScriptTarget.Latest, true);
    if (sf.statements.some(n=>ts.isExpressionStatement(n)&&ts.isStringLiteral(n.expression)&&n.expression.text==="use client")) client.push(file);
    const imports = [];
    function visit(n) {
      let spec;
      if ((ts.isImportDeclaration(n)||ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) spec=n.moduleSpecifier.text;
      if (ts.isCallExpression(n) && n.arguments.length && ts.isStringLiteral(n.arguments[0]) && (n.expression.kind===ts.SyntaxKind.ImportKeyword||n.expression.getText(sf)==="require")) spec=n.arguments[0].text;
      if (spec && (spec.startsWith(".")||spec.startsWith("@/"))) {
        const base=spec.startsWith("@/")?resolve(root,spec.slice(2)):resolve(dirname(file),spec);
        const target=[base,base+".ts",base+".tsx",base+"/index.ts",base+"/index.tsx"].find(f=>all.includes(f));
        if(target)imports.push(target);
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);graph.set(file,imports);
  }
  const visited = new Set();
  function walk(file, chain) {
    assert.ok(!server.includes(file), "Client imports server: "+chain.map(f=>relative(root,f)).join(" -> "));
    if(visited.has(file))return;
    visited.add(file);
    for(const dependency of graph.get(file)??[])walk(dependency,[...chain,dependency]);
  }
  for(const file of client)walk(file,[file]);
  assert.ok(client.length>0 && server.length>=5);
  assert.ok(existsSync(resolve(root,"app/api/bookings/route.ts")));
});

test("moved server session client preserves admin/pilgrim cookie separation and cookie forwarding", async () => {
  const previous = {...process.env};
  process.env.NEXT_PUBLIC_SUPABASE_URL="https://test-scope.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="test-public";
  const configs=[], written=[];
  const jar={getAll:()=>[{name:"test-cookie",value:"local-only"}],set:(...args)=>written.push(args)};
  try {
    const service=loadServerModule("src/server/supabase/session.ts", {
      "next/headers":{cookies:async()=>jar},
      "@supabase/ssr":{createServerClient:(url,key,options)=>{configs.push(options);return {url,key};}},
    });
    await service.createClient();
    await service.createClient("pilgrim");
    assert.notEqual(configs[0].cookieOptions.name, configs[1].cookieOptions.name);
    assert.equal(configs[0].cookieOptions.secure,true);
    assert.equal(configs[0].cookieOptions.sameSite,"lax");
    assert.equal(configs[0].cookies.getAll()[0].name,"test-cookie");
    configs[0].cookies.setAll([{name:"test-cookie",value:"new",options:{path:"/"}}]);
    assert.equal(written[0][1],"new");
  } finally {
    for(const key of ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]) {
      if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];
    }
  }
});

test("moved admin client rejects missing configuration and preserves server-only auth settings", () => {
  const keys=["NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"];
  const previous=keys.map(k=>process.env[k]);
  let calls=0;
  try {
    const service=loadServerModule("src/server/supabase/admin.ts", {
      "@supabase/supabase-js":{createClient:(url,key,options)=>{calls++;assert.equal(options.auth.persistSession,false);assert.equal(options.auth.autoRefreshToken,false);assert.equal(options.auth.detectSessionInUrl,false);return {url};}},
    });
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.throws(()=>service.createAdminClient(),/environment variables are missing/);
    assert.equal(calls,0);
    process.env.NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54322";
    process.env.SUPABASE_SERVICE_ROLE_KEY="local-mocked-key";
    assert.equal(service.createAdminClient().url,"http://127.0.0.1:54322");
    assert.equal(calls,1);
  } finally {
    keys.forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];});
  }
});
