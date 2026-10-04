"use client";

import {useEffect,useRef,useState} from "react";
import {createChart,ColorType,LineStyle,IChartApi,ISeriesApi,UTCTimestamp} from "lightweight-charts";
import {PAIRS,fetchFuturesKlines,futuresWsUrl} from "../lib/binance";
import {detectCRT} from "../lib/crt";
import type {Candle,Setup} from "../lib/types";

export default function Home(){
  const [selected,setSelected]=useState("BTCUSDT");
  const [interval,setIntervalValue]=useState("5m");
  const [candles,setCandles]=useState<Candle[]>([]);
  const [setup,setSetup]=useState<Setup|null>(null);
  const [connected,setConnected]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const chart=useRef<IChartApi|null>(null);
  const series=useRef<ISeriesApi<"Candlestick">|null>(null);

  useEffect(()=>{
    if(!ref.current) return;
    chart.current=createChart(ref.current,{layout:{background:{type:ColorType.Solid,color:"#0b0e11"},textColor:"#9ba3ad"},grid:{vertLines:{color:"#161a1f"},horzLines:{color:"#161a1f"}},crosshair:{mode:1},rightPriceScale:{borderColor:"#20242a"},timeScale:{borderColor:"#20242a",timeVisible:true,secondsVisible:false}});
    series.current=chart.current.addCandlestickSeries({upColor:"#19c37d",downColor:"#f45b69",borderVisible:false,wickUpColor:"#19c37d",wickDownColor:"#f45b69"});
    const resize=()=>ref.current&&chart.current?.applyOptions({width:ref.current.clientWidth,height:ref.current.clientHeight});
    resize(); window.addEventListener("resize",resize);
    return()=>{window.removeEventListener("resize",resize);chart.current?.remove();chart.current=null};
  },[]);

  useEffect(()=>{
    let cancelled=false; let ws:WebSocket|undefined;
    (async()=>{
      try{
        const data=await fetchFuturesKlines(selected,interval,500);
        if(cancelled)return;
        setCandles(data); setSetup(detectCRT(data));
        series.current?.setData(data.map(x=>({...x,time:x.time as UTCTimestamp})));
        chart.current?.timeScale().fitContent();
        ws=new WebSocket(futuresWsUrl(selected,interval));
        ws.onopen=()=>setConnected(true);
        ws.onclose=()=>setConnected(false);
        ws.onerror=()=>setConnected(false);
        ws.onmessage=(e)=>{
          const k=JSON.parse(e.data).k; if(!k)return;
          const candle={time:Math.floor(k.t/1000),open:+k.o,high:+k.h,low:+k.l,close:+k.c,volume:+k.v};
          series.current?.update({...candle,time:candle.time as UTCTimestamp});
          setCandles(prev=>{const next=[...prev]; const i=next.length-1; if(next[i]?.time===candle.time) next[i]=candle; else next.push(candle); setSetup(detectCRT(next)); return next;});
        };
      }catch(err){console.error(err);setConnected(false)}
    })();
    return()=>{cancelled=true;ws?.close();setConnected(false)};
  },[selected,interval]);

  const s=setup;
  return <div className="app">
    <div className="top"><div className="brand">CRT FUTURES</div><div className="live">{connected?"● LIVE":"○ CONNECTING"}</div></div>
    <div className="body">
      <aside className="watch"><h3>WATCHLIST · BINANCE FUTURES</h3>{PAIRS.map(p=><button key={p.symbol} className={"pair "+(selected===p.symbol?"active":"")} onClick={()=>setSelected(p.symbol)}><strong>{p.display}</strong><span>{p.name}</span></button>)}</aside>
      <main className="main">
        <div className="toolbar"><span className="symbol">{selected}.P</span>{["1m","5m","15m","1h","4h","1d"].map(x=><button key={x} onClick={()=>setIntervalValue(x)}>{x}</button>)}</div>
        <div className="chartWrap"><div ref={ref} className="chart"/>
          {s&&<div className="panel"><h4 className={s.direction==="LONG"?"green":"red"}>{s.direction} · {s.status}</h4><div className="row"><span>Entry</span><b>{s.entry.toPrecision(7)}</b></div><div className="row"><span>SL</span><b>{s.stop.toPrecision(7)}</b></div><div className="row"><span>TP1</span><b>{s.tp1.toPrecision(7)}</b></div><div className="row"><span>TP2</span><b>{s.tp2.toPrecision(7)}</b></div><div className="row"><span>Key</span><b>{s.keyType}</b></div><div className="reason">{s.reason.map((r,i)=><div key={i}>✓ {r}</div>)}</div></div>}
        </div>
      </main>
    </div>
  </div>;
}
