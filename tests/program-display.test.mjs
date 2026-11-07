import assert from 'node:assert/strict';
import {test} from 'node:test';
import {upcomingDepartures,travelMode,priceDescription,locationLabel,isActualFlight,loadDisplayFacts} from '../src/features/programs/display.ts';

test('upcoming dates exclude past/cancelled, sort by instant, and never infer remaining seats from capacity',()=>{
 const facts={departures:[{id:'past',startAt:'2020-01-01',capacity:100,seats:100},{id:'later',startAt:'2031-01-01',capacity:100,seats:0},{id:'next',startAt:'2030-01-01',capacity:100,seats:0},{id:'cancelled',startAt:'2030-01-01',status:'cancelled'}]};
 assert.deepEqual(upcomingDepartures(facts,Date.parse('2026-11-08')).map(d=>d.id),['next','later']);
 assert.equal(upcomingDepartures(facts,Date.parse('2026-11-08'))[0].seats,0);
 assert.deepEqual(upcomingDepartures(undefined),[]);
});
test('registered travel mode wins over secondary services; missing price facts remain explicit',()=>{
 assert.equal(travelMode({travelMode:'bus',transports:[],actualFlightCount:1}),'bus');
 assert.equal(travelMode({transports:[],actualFlightCount:0}),'unknown');
 assert.match(priceDescription(undefined,false),/basis unspecified.*Tax status unspecified/);
 assert.equal(priceDescription({priceBasis:'per_room',taxStatus:'excluded'},false),'per room · Tax excluded');
 assert.equal(locationLabel('MAKKAH',false),'Makkah');
 assert.equal(locationLabel('MADINAH',true),'المدينة المنورة');
});
test('a transport word or unordered flight times do not constitute an actual flight',()=>{
 assert.equal(isActualFlight({airlineNameEn:'Bus'}),false);
 const f={departureAirportEn:'RUH',arrivalAirportEn:'JED',departureAt:'2030-01-01T10:00:00Z',arrivalAt:'2030-01-01T12:00:00Z'};
 assert.equal(isActualFlight(f),true);
 assert.equal(isActualFlight({...f,arrivalAt:f.departureAt}),false);
 assert.equal(isActualFlight({...f,arrivalAirportEn:''}),false);
});
test('display facts batch requests and retain failures rather than substitute empty success',async()=>{
 const calls=[];const client={rpc:async(name,args)=>{calls.push({name,args});return {data:args.program_ids.map(id=>({program_id:id,facts:{id}}))};}};
 const ids=Array.from({length:401},(_,i)=>String(i));const values=await loadDisplayFacts(client,ids);
 assert.equal(values.size,401);assert.deepEqual(calls.map(c=>c.args.program_ids.length),[200,200,1]);assert.ok(calls.every(c=>c.args.include_drafts===false));
 await assert.rejects(()=>loadDisplayFacts({rpc:async()=>({error:new Error('unavailable')})},['x']),/unavailable/);
});
