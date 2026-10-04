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
 if(d.high>b.high&&d.close>d.open)return"BULLISH";
 if(d.low<b.low&&d.close<d.open)return"BEARISH";
 return d.close>=b.close?"BULLISH":"BEARISH";
}
function oldLevel(c:Candle[],side:"low"|"high"){
 const p=pivots(c),last=c.length-1,arr=side==="low"?p.lows:p.highs;
 const i=arr.filter(x=>x<last-2).at(-1);
 return i===undefined?null:{index:i,price:side==="low"?c[i].low:c[i].high};
}
function hasBullFvg(c:Candle[]){if(c.length<3)return false;const a=c[c.length-3],d=c[c.length-1];return d.low>a.high}
function hasBearFvg(c:Candle[]){if(c.length<3)return false;const a=c[c.length-3],d=c[c.length-1];return d.high<a.low}
function hasBullOB(c:Candle[]){if(c.length<2)return false;const x=c[c.length-2];return x.close<x.open}
function hasBearOB(c:Candle[]){if(c.length<2)return false;const x=c[c.length-2];return x.close>x.open}
function ltfBullConfirm(c:Candle[]){if(c.length<2)return false;const a=c[c.length-2],b=c[c.length-1];return b.close>b.open&&b.close>a.high}
function ltfBearConfirm(c:Candle[]){if(c.length<2)return false;const a=c[c.length-2],b=c[c.length-1];return b.close<b.open&&b.close<a.low}

/*
 Source-driven implementation:
 4H HTF -> 1H ITF C1/C2/C3 -> 5M LTF confirmation.
 The transcript explicitly names 4H/1H/5M, old-high/old-low examples,
 OB inside HTF FVG and LTF FVG inside HTF context, and an old-low sweep
 followed by C2 closure. Ambiguous details are kept conservative.
*/
export function detectCRT(htf:Candle[],itf:Candle[],ltf:Candle[],rr1=1.8,rr2=3):Setup|null{
 if(htf.length<12||itf.length<12||ltf.length<5)return null;
 const htfBias=bias(htf), oldLow=oldLevel(itf,"low"), oldHigh=oldLevel(itf,"high");
 const r=itf.slice(-3),c1=r[0],c2=r[1],c3=r[2];
 const bullC2=c2.close>c2.open&&c2.close>c1.high;
 const bearC2=c2.close<c2.open&&c2.close<c1.low;
 const bullC3=c3.close>c3.open, bearC3=c3.close<c3.open;
 const bullContext=htfBias!=="BEARISH",bearContext=htfBias!=="BULLISH";
 if(oldLow&&bullContext){
  const swept=c2.low<oldLow.price&&c2.close>oldLow.price;
  const ltfOK=ltfBullConfirm(ltf)&&(hasBullFvg(ltf)||hasBullOB(itf));
  if(swept&&bullC2&&bullC3&&ltfOK){
   const entry=ltf[ltf.length-1].close,stop=Math.min(c2.low,c1.low),risk=entry-stop;
   if(risk>0)return{direction:"LONG",status:"ENTRY CONFIRMED",entry,stop,tp1:entry+risk*rr1,tp2:entry+risk*rr2,keyLevel:oldLow.price,keyType:"Old Low",htfBias,sweepTime:c2.time,confirmedTime:ltf[ltf.length-1].time,reason:["HTF bullish/neutral context","Old Low swept","C2 closed back above Old Low","ITF C1/C2/C3 structure","LTF bullish confirmation","OB/FVG context"]};
  }
 }
 if(oldHigh&&bearContext){
  const swept=c2.high>oldHigh.price&&c2.close<oldHigh.price;
  const ltfOK=ltfBearConfirm(ltf)&&(hasBearFvg(ltf)||hasBearOB(itf));
  if(swept&&bearC2&&bearC3&&ltfOK){
   const entry=ltf[ltf.length-1].close,stop=Math.max(c2.high,c1.high),risk=stop-entry;
   if(risk>0)return{direction:"SHORT",status:"ENTRY CONFIRMED",entry,stop,tp1:entry-risk*rr1,tp2:entry-risk*rr2,keyLevel:oldHigh.price,keyType:"Old High",htfBias,sweepTime:c2.time,confirmedTime:ltf[ltf.length-1].time,reason:["HTF bearish/neutral context","Old High swept","C2 closed back below Old High","ITF C1/C2/C3 structure","LTF bearish confirmation","OB/FVG context"]};
  }
 }
 return null;
}