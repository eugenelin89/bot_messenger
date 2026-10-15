import test from 'node:test';
import assert from 'node:assert/strict';
import {time} from '../src/domain/investment/identity.js';

test('timestamp reuse preserves exact UTC spelling, calendar validity and primitive types',()=>{
 for(const value of ['1970-01-01T00:00:00Z','1970-01-01T00:00:00.000Z','2024-02-29T23:59:59.123Z','1969-12-31T23:59:59Z'])for(let n=0;n<3;n++)assert.equal(time(value),Date.parse(value));
 for(const value of ['2026-02-29T00:00:00Z','2026-10-15T24:00:00Z','2026-10-15T00:00:60Z','2026-10-15T00:00:00+00:00','2026-10-15T00:00:00.1Z','2026-10-15','2026-13-01T00:00:00Z',null,0,new String('1970-01-01T00:00:00Z')])for(let n=0;n<2;n++)assert.throws(()=>time(value as string),/invalid_time/);
});

test('timestamp cache eviction changes neither values nor current deadline comparisons',()=>{
 const origin='1970-01-01T00:00:00Z',expected=time(origin);for(let n=0;n<1200;n++){const s=new Date(1700000000000+n*1000).toISOString();assert.equal(time(s),Date.parse(s));}assert.equal(time(origin),expected);
 const deadline='2026-10-15T12:00:00Z';assert.ok(time('2026-10-15T11:59:59Z')<time(deadline));assert.ok(time('2026-10-15T12:00:01Z')>time(deadline));
});
