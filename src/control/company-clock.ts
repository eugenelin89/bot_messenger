import {requireThat} from '../domain/model.js';
import type {Recurrence} from '../domain/mandates.js';
export interface Clock { now():number }
export const systemClock:Clock = {now:()=>Date.now()};
const formatters=new Map<string,Intl.DateTimeFormat>();
export function timezone(value:unknown):string {
  requireThat(typeof value==='string'&&value.length<100&&(/^[A-Za-z_]+\/[A-Za-z_+\-/]+$/.test(value)||value==='UTC'),'An IANA timezone is required');
  try {new Intl.DateTimeFormat('en-US',{timeZone:value}).format();}catch{requireThat(false,'Unknown IANA timezone');}
  return value;
}
function parts(instant:number,zone:string) {
  let formatter=formatters.get(zone);
  if(!formatter){formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});formatters.set(zone,formatter);}
  const p=Object.fromEntries(formatter.formatToParts(instant).map(x=>[x.type,x.value]));
  return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
}
/** Earliest instant in a repeated minute. Missing minutes move to the first valid
 * local minute on that date after the gap (02:30 -> 03:00 in Vancouver spring).
 * Bounded scan also handles non-hour offset changes; never uses the host timezone. */
export function wallClockInstant(date:string,time:string,zone:string):number {
  timezone(zone);requireThat(/^\d{4}-\d{2}-\d{2}$/.test(date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(time),'Invalid wall-clock date/time');
  const center=Date.parse(`${date}T${time}:00Z`);requireThat(Number.isFinite(center),'Invalid local date');
  let shifted:{local:string;instant:number}|undefined;
  for(let instant=center-15*3600000;instant<=center+15*3600000;instant+=60000){
    const local=parts(instant,zone);if(local.date!==date)continue;
    if(local.time===time)return instant;
    if(local.time>time&&(!shifted||local.time<shifted.local))shifted={local:local.time,instant};
  }
  requireThat(shifted,'This local calendar date does not exist in the selected timezone');return shifted.instant;
}
export function nextReviewInstant(due:number,recurrence:Recurrence,zone:string):number|null {
  if(recurrence.kind==='once')return null;
  if(recurrence.kind==='interval')return due+recurrence.seconds*1000;
  const day=parts(due,zone).date;
  const tomorrow=new Date(Date.parse(`${day}T12:00:00Z`)+86400000).toISOString().slice(0,10);
  return wallClockInstant(tomorrow,recurrence.local_time,zone);
}
export function absoluteTime(value:unknown,label:string):string {
  requireThat(typeof value==='string'&&/T.*(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value)),`${label} requires an absolute timestamp with timezone`);
  return new Date(value).toISOString();
}
