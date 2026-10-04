import type {Candle,Setup} from "./types";

function pivots(c:Candle[],left=2,right=2){
  const highs:number[]=[]; const lows:number[]=[];
  for(let i=left;i<c.length-right;i++){
    let hi=true,lo=true;
    for(let j=i-left;j<=i+right;j++){ if(j===i) continue; hi &&= c[i].high>=c[j].high; lo &&= c[i].low<=c[j].low; }
    if(hi) highs.push(i); if(lo) lows.push(i);
  }
  return {highs,lows};
}

/*
  CRT engine starter.
  Source-driven rules: HTF/ITF/LTF, C1/C2/C3, meaningful old highs/lows
  and sweep-before-entry. Ambiguous transcript rules remain configurable.
*/
export function detectCRT(c:Candle[]):Setup|null{
  if(c.length<20) return null;
  const {highs,lows}=pivots(c);
  const last=c.length-1;
  const oldHighIdx=highs.filter(i=>i<last-2).at(-1);
  const oldLowIdx=lows.filter(i=>i<last-2).at(-1);
  const recent=c.slice(-3);
  const c1=recent[0],c2=recent[1],c3=recent[2];

  if(oldLowIdx!==undefined){
    const level=c[oldLowIdx].low;
    const swept=c2.low<level && c2.close>level;
    const bullish=c3.close>c3.open && c3.close>c2.high;
    if(swept && bullish){
      const entry=c3.close, stop=Math.min(c2.low,c1.low);
      const risk=entry-stop;
      if(risk>0) return {direction:"LONG",status:"ENTRY CONFIRMED",entry,stop,tp1:entry+risk*2,tp2:entry+risk*3,keyLevel:level,keyType:"Old Low",reason:["Old Low swept","C1/C2/C3 structure","Bullish confirmation"]};
    }
  }

  if(oldHighIdx!==undefined){
    const level=c[oldHighIdx].high;
    const swept=c2.high>level && c2.close<level;
    const bearish=c3.close<c3.open && c3.close<c2.low;
    if(swept && bearish){
      const entry=c3.close, stop=Math.max(c2.high,c1.high);
      const risk=stop-entry;
      if(risk>0) return {direction:"SHORT",status:"ENTRY CONFIRMED",entry,stop,tp1:entry-risk*2,tp2:entry-risk*3,keyLevel:level,keyType:"Old High",reason:["Old High swept","C1/C2/C3 structure","Bearish confirmation"]};
    }
  }
  return null;
}
