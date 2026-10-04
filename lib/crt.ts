import type {Candle,Setup} from "./types";

type Bias="BULLISH"|"BEARISH"|"NEUTRAL";

function pivots(c:Candle[],left=2,right=2){
 const highs:number[]=[],lows:number[]=[];
 for(let i=left;i<c.length-right;i++){
  let hi=true,lo=true;
  for(let j=i-left;j<=i+right;j++){if(j===i)continue;hi&&=c[i].high>=c[j].high;lo&&=c[i].low<=c[j].low}
  if(hi)highs.push(i);if(lo)lows.push(i);
 }
 return{highs,lows};
}
function bias(c:Candle[]):Bias{
 if(c.length<3)return"NEUTRAL";
 const a=c[c.length-3],b=c[c.length-2],d=c[c.length-1];
 if(d.high>b.high&&b.high>=a.high&&d.close>d.open)return"BULLISH";
 if(d.low<b.low&&b.low<=a.low&&d.close<d.open)return"BEARISH";
 return d.close>=b.close?"BULLISH":"BEARISH";
}
function lastOldLevel(c:Candle[],side:"low"|"high"){
 const p=pivots(c),last=c.length-1,arr=side==="low"?p.lows:p.highs;
 const i=arr.filter(x=>x<last-2).at(-1);
 return i===undefined?null:{index:i,price:side==="low"?c[i].low:c[i].high};
}
function fvg(c:Candle[],side:"bull"|"bear"){
 if(c.length<3)return false;
 const a=c[c.length-3],d=c[c.length-1];
 return side==="bull"?d.low>a.high:d.high<a.low;
}
function ob(c:Candle[],side:"bull"|"bear"){
 if(c.length<2)return false;
 const x=c[c.length-2];
 return side==="bull"?x.close<x.open:x.close>x.open;
}

/*
 Conservative source-driven CRT engine.
 Transcript-supported concepts: HTF/ITF/LTF, C1/C2/C3, old highs/lows,
 old-low sweep + C2 closure example, OB/FVG context and lower-timeframe
 confirmation. Ambiguous details are intentionally configurable rather than invented.
*/
export function detectCRT(htf:Candle[],itf:Candle[],ltf:Candle[],rr1=1.8,rr2=3):Setup|null{
 if(htf.length<8||itf.length<8||ltf.length<5)return null;
 const htfBias=bias(htf), last=ltf.length-1;
 const recent=ltf.slice(-3),c1=recent[0],c2=recent[1],c3=recent[2];
 const oldLow=lastOldLevel(itf,"low"),oldHigh=lastOldLevel(itf,"high");
 const bullConfirm=c3.close>c3.open&&c3.close>c2.high;
 const bearConfirm=c3.close<c3.open&&c3.close<c2.low;
 const bullContext=htfBias!=="BEARISH";
 const bearContext=htfBias!=="BULLISH";
 if(oldLow&&bullContext){
  const swept=c2.low<oldLow.price&&c2.close>oldLow.price;
  if(swept&&bullConfirm&&ob(itf,"bull")&&(fvg(ltf,"bull")||c3.close>c1.high)){
   const entry=c3.close,stop=Math.min(c2.low,c1.low),risk=entry-stop;
   if(risk>0)return{direction:"LONG",status:"ENTRY CONFIRMED",entry,stop,tp1:entry+risk*rr1,tp2:entry+risk*rr2,keyLevel:oldLow.price,keyType:"Old Low",htfBias,sweepTime:c2.time,confirmedTime:c3.time,reason:["HTF bullish/neutral context","Old Low swept","C2 closed back above Old Low","C1/C2/C3 structure","Lower-timeframe bullish confirmation","OB/FVG context"]};
  }
 }
 if(oldHigh&&bearContext){
  const swept=c2.high>oldHigh.price&&c2.close<oldHigh.price;
  if(swept&&bearConfirm&&ob(itf,"bear")&&(fvg(ltf,"bear")||c3.close<c1.low)){
   const entry=c3.close,stop=Math.max(c2.high,c1.high),risk=stop-entry;
   if(risk>0)return{direction:"SHORT",status:"ENTRY CONFIRMED",entry,stop,tp1:entry-risk*rr1,tp2:entry-risk*rr2,keyLevel:oldHigh.price,keyType:"Old High",htfBias,sweepTime:c2.time,confirmedTime:c3.time,reason:["HTF bearish/neutral context","Old High swept","C2 closed back below Old High","C1/C2/C3 structure","Lower-timeframe bearish confirmation","OB/FVG context"]};
  }
 }
 return null;
}
