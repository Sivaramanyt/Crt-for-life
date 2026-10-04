export type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
export type SymbolInfo={symbol:string;display:string;name:string};
export type Setup={
 direction:"LONG"|"SHORT"; status:string; entry:number; stop:number; tp1:number; tp2:number;
 keyLevel:number; keyType:"Old Low"|"Old High"; reason:string[];
 htfBias:"BULLISH"|"BEARISH"|"NEUTRAL"; sweepTime:number; confirmedTime:number;
};