import "server-only";
import { inflateRawSync } from "node:zlib";
import { cvMetadataError, cvMimeTypes, MAX_CV_BYTES } from "../../features/applications/utils/talent-application";

// Structural content identification, not antivirus scanning. Never render or log CV content.
export async function inspectCv(file: File): Promise<{ bytes: Buffer; extension: keyof typeof cvMimeTypes; mime: string }> {
  if (cvMetadataError(file)) throw new Error("cv_invalid");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_CV_BYTES || bytes.length !== file.size) throw new Error("cv_invalid");
  const extension = file.name.toLowerCase().split(".").at(-1) as keyof typeof cvMimeTypes;
  if (extension === "pdf") {
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-" || !bytes.subarray(Math.max(0, bytes.length - 2048)).includes(Buffer.from("%%EOF"))) throw new Error("cv_invalid");
  } else if (extension === "doc") {
    if (!bytes.subarray(0, 8).equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1])) || !bytes.includes(Buffer.from("WordDocument", "utf16le"))) throw new Error("cv_invalid");
  } else if (extension === "docx") {
    inspectDocx(bytes);
  } else throw new Error("cv_invalid");
  return { bytes, extension, mime: cvMimeTypes[extension] };
}
function inspectDocx(bytes: Buffer) {
  try {
    if (bytes.readUInt32LE(0) !== 0x04034b50) throw new Error();
    let end = -1;
    for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
      if (bytes.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
    }
    if (end < 0 || bytes.readUInt16LE(end+4) || bytes.readUInt16LE(end+6)) throw new Error();
    const entries = bytes.readUInt16LE(end+10);
    if (!entries || entries > 5000) throw new Error();
    let cursor = bytes.readUInt32LE(end+16), total = 0;
    const found = new Map<string, { compressed: number; uncompressed: number; method: number; local: number }>();
    for (let index=0; index<entries; index++) {
      if (cursor+46 > end || bytes.readUInt32LE(cursor)!==0x02014b50 || bytes.readUInt16LE(cursor+8)&1) throw new Error();
      const compressed=bytes.readUInt32LE(cursor+20), uncompressed=bytes.readUInt32LE(cursor+24);
      const nameLength=bytes.readUInt16LE(cursor+28), extra=bytes.readUInt16LE(cursor+30), comment=bytes.readUInt16LE(cursor+32);
      if (cursor+46+nameLength+extra+comment>end) throw new Error();
      const name=bytes.subarray(cursor+46,cursor+46+nameLength).toString("utf8");
      if (name.startsWith("/") || name.includes("\\") || name.split("/").includes("..") || /vbaProject|embeddings\//i.test(name) || found.has(name)) throw new Error();
      total += uncompressed;
      if (uncompressed > 20*1024*1024 || total > 50*1024*1024) throw new Error();
      found.set(name,{compressed,uncompressed,method:bytes.readUInt16LE(cursor+10),local:bytes.readUInt32LE(cursor+42)});
      cursor+=46+nameLength+extra+comment;
    }
    const readXml=(name:string)=>{
      const entry=found.get(name); if (!entry || entry.local+30>bytes.length || bytes.readUInt32LE(entry.local)!==0x04034b50) throw new Error();
      const start=entry.local+30+bytes.readUInt16LE(entry.local+26)+bytes.readUInt16LE(entry.local+28);
      if (start+entry.compressed>end || ![0,8].includes(entry.method)) throw new Error();
      const content=bytes.subarray(start,start+entry.compressed);
      const xml=entry.method===8?inflateRawSync(content,{maxOutputLength:20*1024*1024}):content;
      if(xml.length!==entry.uncompressed)throw new Error();
      return xml.toString("utf8");
    };
    if (!found.has("_rels/.rels") || !readXml("[Content_Types].xml").includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml") || !/<(?:\w+:)?document[\s>]/.test(readXml("word/document.xml"))) throw new Error();
  } catch { throw new Error("cv_invalid"); }
}
