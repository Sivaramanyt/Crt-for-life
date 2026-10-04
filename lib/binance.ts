import type{Candle}from"./types";
export const PAIRS=[
{symbol:"BTCUSDT",display:"BTCUSDT.P",name:"Bitcoin"},{symbol:"ETHUSDT",display:"ETHUSDT.P",name:"Ethereum"},
{symbol:"SOLUSDT",display:"SOLUSDT.P",name:"Solana"},{symbol:"AVAXUSDT",display:"AVAXUSDT.P",name:"Avalanche"},
{symbol:"SUIUSDT",display:"SUIUSDT.P",name:"Sui"},{symbol:"XRPUSDT",display:"XRPUSDT.P",name:"XRP"},
{symbol:"LINKUSDT",display:"LINKUSDT.P",name:"Chainlink"},{symbol:"ADAUSDT",display:"ADAUSDT.P",name:"Cardano"}];
export async function fetchFuturesKlines(symbol:string,interval:string,limit=500):Promise<Candle[]>{
 const r=await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,{cache:"no-store"});
 if(!r.ok)throw new Error(`Binance Futures HTTP ${r.status}`);
 const rows:any[]=await r.json();return rows.map(x=>({time:Math.floor(x[0]/1000),open:+x[1],high:+x[2],low:+x[3],close:+x[4],volume:+x[5]}));
}
export function futuresWsUrl(symbol:string,interval:string){return`wss://fstream.binance.com/ws/${symbol.toLowerCase()}@kline_${interval}`}
export function futuresMiniTickerUrl(){return`wss://fstream.binance.com/stream?streams=${PAIRS.map(p=>p.symbol.toLowerCase()+"@miniTicker").join("/")}`}
