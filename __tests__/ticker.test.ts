import {normalizeTicker,yahooSymbol} from '../src/ticker';
test('normalizes common ticker forms',()=>{expect(normalizeTicker(' $aapl ')).toBe('AAPL');expect(normalizeTicker('BRK.B')).toBe('BRK.B');expect(yahooSymbol('BRK.B')).toBe('BRK-B');});
test('rejects unsafe OCR text',()=>{expect(()=>normalizeTicker('APPLE INC')).toThrow();expect(()=>normalizeTicker('AAPL?')).toThrow();});
