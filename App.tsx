import React, {useEffect, useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {setButtonHandler, LASSO_BUTTON} from './src/buttons';
import {normalizeTicker, yahooSymbol} from './src/ticker';
import {fetchQuote, insertionText, moneyText, Quote} from './src/quote';
import {closePanel, insertQuoteText, recognizeCurrentLasso} from './src/supernote';

type Rect = {left:number; top:number; right:number; bottom:number};
type State = {kind:'idle'} | {kind:'loading'} | {kind:'error'; message:string} | {kind:'quote'; quote:Quote; rect:Rect};

export default function App() {
  const [state, setState] = useState<State>({kind:'idle'});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setButtonHandler(id => { if (id === LASSO_BUTTON) void loadQuote(); });
    return () => setButtonHandler(null);
  }, []);

  async function loadQuote() {
    setState({kind:'loading'});
    try {
      const selection = await recognizeCurrentLasso();
      const ticker = normalizeTicker(selection.text);
      const quote = await fetchQuote(yahooSymbol(ticker));
      quote.symbol = ticker;
      setState({kind:'quote', quote, rect: selection.rect});
    } catch (e:any) {
      setState({kind:'error', message:e?.message || 'Quote unavailable.'});
    }
  }

  async function insert(q:Quote, rect:Rect) {
    setBusy(true);
    try {
      await insertQuoteText(insertionText(q), rect);
      closePanel();
    } catch (e:any) {
      setState({kind:'error', message:e?.message || 'Could not insert quote.'});
      setBusy(false);
    }
  }

  return <SafeAreaView style={s.screen}><View style={s.card}>
    <Text style={s.title}>Stock Quote</Text>
    {state.kind === 'idle' && <Text style={s.status}>Lasso a handwritten ticker and choose Stock Quote.</Text>}
    {state.kind === 'loading' && <Text style={s.status}>Reading ticker and retrieving quote…</Text>}
    {state.kind === 'error' && <><Text style={s.error}>{state.message}</Text><Text style={s.hint}>Check the selection and Wi-Fi connection, then dismiss and try again.</Text></>}
    {state.kind === 'quote' && <QuoteView q={state.quote}/>} 
    <View style={s.buttons}>
      {state.kind === 'quote' && <Pressable disabled={busy} onPress={() => insert(state.quote, state.rect)} style={s.primary}><Text style={s.primaryText}>{busy ? 'Inserting…' : 'Insert Quote'}</Text></Pressable>}
      <Pressable onPress={closePanel} style={s.secondary}><Text style={s.secondaryText}>Dismiss</Text></Pressable>
    </View>
  </View></SafeAreaView>;
}

function QuoteView({q}:{q:Quote}) {
  const sign = (q.change ?? 0) >= 0 ? '+' : '';
  const change = q.change === undefined || q.changePercent === undefined ? 'Change unavailable' : `${sign}${q.change.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)`;
  return <View>
    <Text style={s.symbol}>{q.symbol}{q.name ? ` · ${q.name}` : ''}</Text>
    <Text style={s.price}>{moneyText(q.price, q.currency)}</Text>
    <Text style={s.change}>{change}</Text>
    <View style={s.rule}/>
    <Row k="Open" v={moneyText(q.open,q.currency)}/><Row k="High" v={moneyText(q.high,q.currency)}/><Row k="Low" v={moneyText(q.low,q.currency)}/><Row k="Prev. close" v={moneyText(q.previousClose,q.currency)}/>
    <View style={s.rule}/>
    <Text style={s.meta}>{q.marketState}{q.exchange ? ` · ${q.exchange}` : ''}</Text>
    <Text style={s.meta}>Quote time: {q.quoteTime.toLocaleString()}</Text>
    <Text style={s.source}>Source: Yahoo Finance chart data. Quotes may be delayed.</Text>
  </View>;
}
function Row({k,v}:{k:string;v:string}) { return <View style={s.row}><Text style={s.key}>{k}</Text><Text style={s.val}>{v}</Text></View>; }

const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#fff',justifyContent:'center',padding:28}, card:{borderWidth:2,borderColor:'#111',padding:24,borderRadius:12},
  title:{fontSize:20,fontWeight:'700',marginBottom:20}, status:{fontSize:20,lineHeight:28,paddingVertical:28,textAlign:'center'},
  error:{fontSize:20,fontWeight:'700',marginVertical:16}, hint:{fontSize:16,lineHeight:22,marginBottom:20}, symbol:{fontSize:20,fontWeight:'700'},
  price:{fontSize:40,fontWeight:'800',marginTop:10}, change:{fontSize:22,fontWeight:'600',marginTop:4}, rule:{borderTopWidth:1,borderColor:'#444',marginVertical:16},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:5}, key:{fontSize:17}, val:{fontSize:17,fontWeight:'600'}, meta:{fontSize:15,marginTop:5}, source:{fontSize:13,marginTop:12},
  buttons:{flexDirection:'row',gap:14,marginTop:24}, primary:{flex:1,backgroundColor:'#111',paddingVertical:16,borderRadius:8,alignItems:'center'}, primaryText:{color:'#fff',fontSize:18,fontWeight:'700'},
  secondary:{flex:1,borderWidth:2,borderColor:'#111',paddingVertical:16,borderRadius:8,alignItems:'center'}, secondaryText:{fontSize:18,fontWeight:'700'}
});
