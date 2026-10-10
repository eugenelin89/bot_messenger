import { ensure } from '../investment/arithmetic.js';
import { date, exact, id, time } from '../investment/identity.js';
import type { Calendar, Session } from '../investment/types.js';
import type { CalendarEvidence } from './types.js';
import { sourceReference } from './validation.js';
const zone=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'});
/** UTC search is independent of the host timezone, including DST boundary sessions. */
function eastern(day:string,hour:number,minute:number):string {
  for(const offset of [4,5]) {
    const at=`${day}T${String(hour+offset).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00.000Z`;
    const p=Object.fromEntries(zone.formatToParts(new Date(at)).map(x=>[x.type,x.value]));
    if(`${p.year}-${p.month}-${p.day}`===day && Number(p.hour)===hour && Number(p.minute)===minute)return at;
  }
  throw new Error('unrepresentable_exchange_time');
}
export function scheduledCalendar2026():CalendarEvidence {
  const holidays=['2026-01-01','2026-01-19','2026-02-16','2026-04-03','2026-05-25','2026-06-19','2026-07-03','2026-09-07','2026-11-26','2026-12-25'];
  const early=['2026-11-27','2026-12-24'],sessions:Session[]=[];
  for(let day=Date.UTC(2026,0,1);day<Date.UTC(2027,0,1);day+=86400000) {
    const d=new Date(day),key=d.toISOString().slice(0,10);
    if(d.getUTCDay()===0 || d.getUTCDay()===6)continue;
    sessions.push({date:key,open:eastern(key,9,30),close:eastern(key,early.includes(key)?13:16,0),status:holidays.includes(key)?'closed':'open',earlyClose:early.includes(key)});
  }
  return {id:'us-equities-2026-reference-v1',calendar:{version:'us-equities-2026-reference-v1',timezone:'America/New_York',sessions,holidays},validFrom:'2026-01-01',validThrough:'2026-12-31',reviewedAt:'2026-10-10T00:00:00Z',sources:['https://www.nyse.com/trade/hours-calendars','https://www.nasdaq.com/market-activity/stock-market-holiday-schedule'],mode:'scheduled_reference',exceptions:[]};
}
export function validateCalendar(c:CalendarEvidence):void {
  exact(c,['id','calendar','validFrom','validThrough','reviewedAt','sources','mode','exceptions']); id(c.id); id(c.calendar.version);
  date(c.validFrom);date(c.validThrough);time(c.reviewedAt);ensure(c.validFrom<=c.validThrough,'invalid_calendar_window');
  ensure(['scheduled_reference','synthetic_fixture'].includes(c.mode),'invalid_calendar_mode');
  ensure(Array.isArray(c.sources)&&c.sources.length>0&&c.sources.length<=10,'missing_calendar_provenance');c.sources.forEach(sourceReference);
  exact(c.calendar,['version','timezone','sessions','holidays']);ensure(c.calendar.timezone==='America/New_York','invalid_calendar_timezone');
  ensure(c.calendar.sessions.length>0&&c.calendar.sessions.length<=5000&&c.calendar.holidays.length<=1000&&c.exceptions.length<=1000,'calendar_size');
  c.calendar.holidays.forEach(date); let previous='';
  for(const s of c.calendar.sessions) {
    exact(s,['date','open','close','status','earlyClose']);date(s.date);ensure(s.date>previous&&s.date>=c.validFrom&&s.date<=c.validThrough,'calendar_order');previous=s.date;
    const day=new Date(`${s.date}T00:00:00Z`).getUTCDay();ensure(day!==0&&day!==6,'weekend_session');
    ensure(['open','closed'].includes(s.status)&&typeof s.earlyClose==='boolean','invalid_session');
    ensure(s.open===eastern(s.date,9,30)&&s.close===eastern(s.date,s.earlyClose?13:16,0),'invalid_session_time');
    ensure(s.status==='closed'||!c.calendar.holidays.includes(s.date),'holiday_session');
  }
  for(const e of c.exceptions){exact(e,['date','reason','source']);date(e.date);sourceReference(e.source);ensure(e.reason.length>0&&e.reason.length<=1000,'invalid_exception');ensure(c.calendar.sessions.some(s=>s.date===e.date&&s.status==='closed'),'exception_not_closed');}
}
export function calendarSession(c:CalendarEvidence,day:string):Session|null {
  validateCalendar(c);date(day);ensure(day>=c.validFrom&&day<=c.validThrough,'calendar_out_of_range');
  return c.calendar.sessions.find(s=>s.date===day)??null;
}
export function adjacentSession(c:CalendarEvidence,day:string,direction:'previous'|'next'):Session|null {
  calendarSession(c,day);const candidates=c.calendar.sessions.filter(s=>s.status==='open'&&(direction==='next'?s.date>day:s.date<day));
  return direction==='next'?candidates[0]??null:candidates.at(-1)??null;
}
export function withClosures(c:CalendarEvidence,newId:string,reviewedAt:string,closures:CalendarEvidence['exceptions']):CalendarEvidence {
  validateCalendar(c);id(newId);ensure(newId!==c.id&&time(reviewedAt)>=time(c.reviewedAt),'calendar_revision');
  const next=structuredClone(c);next.id=newId;next.calendar.version=newId;next.reviewedAt=reviewedAt;
  for(const closure of closures){const s=next.calendar.sessions.find(s=>s.date===closure.date);ensure(s,'unknown_closure_date');s.status='closed';next.exceptions.push(closure);}
  validateCalendar(next);return next;
}
export function simulatorCalendar(c:CalendarEvidence,from:string,through:string):Calendar {
  calendarSession(c,from);calendarSession(c,through);ensure(from<=through,'calendar_window');
  return {version:c.calendar.version,timezone:c.calendar.timezone,sessions:structuredClone(c.calendar.sessions.filter(s=>s.date>=from&&s.date<=through)),holidays:c.calendar.holidays.filter(d=>d>=from&&d<=through)};
}
