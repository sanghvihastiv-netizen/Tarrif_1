'use client';


import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Anchor, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ChevronRight,
  CircleDot, Clock3, Container, Filter, MapPin, Radio, Search, Ship,
  SlidersHorizontal, Waves,
} from 'lucide-react';
import { Globe3D } from '@/app/components/Globe3D';


type Tab = 'routes' | 'calls' | 'vessels';
type Status = 'On time' | 'Delayed' | 'Arrived' | 'Departed' | 'Expected';


const routes = [
  { id: 'TW-1048', carrier: 'Maersk', service: 'AE10', vessel: 'Madrid Maersk', voyage: '628W', from: 'Shanghai', fromCode: 'CNSHA', etd: '24 Jul · 18:30', to: 'Rotterdam', toCode: 'NLRTM', eta: '26 Aug · 06:00', duration: '32d 11h', stops: 2, status: 'On time' as Status },
  { id: 'TW-2117', carrier: 'CMA CGM', service: 'FAL1', vessel: 'CMA CGM Jacques Saadé', voyage: '0FM8W', from: 'Shanghai', fromCode: 'CNSHA', etd: '25 Jul · 03:00', to: 'Rotterdam', toCode: 'NLRTM', eta: '29 Aug · 14:00', duration: '35d 11h', stops: 4, status: 'Delayed' as Status },
  { id: 'TW-3092', carrier: 'MSC', service: 'SILK', vessel: 'MSC Tessa', voyage: 'FS629W', from: 'Ningbo', fromCode: 'CNNGB', etd: '27 Jul · 22:15', to: 'Rotterdam', toCode: 'NLRTM', eta: '31 Aug · 08:30', duration: '34d 10h', stops: 3, status: 'On time' as Status },
  { id: 'TW-4421', carrier: 'Hapag-Lloyd', service: 'FE4', vessel: 'Berlin Express', voyage: '006W', from: 'Shanghai', fromCode: 'CNSHA', etd: '30 Jul · 12:00', to: 'Hamburg', toCode: 'DEHAM', eta: '02 Sep · 19:00', duration: '34d 7h', stops: 3, status: 'On time' as Status },
];


const portCalls = [
  { time: '05:40', date: '24 Jul', vessel: 'Ever Ace', voyage: '126W', terminal: 'Yangshan T4', port: 'Shanghai', code: 'CNSHA', event: 'Arrived', status: 'Arrived' as Status },
  { time: '09:15', date: '24 Jul', vessel: 'MSC Irina', voyage: 'FS628E', terminal: 'Waigaoqiao T5', port: 'Shanghai', code: 'CNSHA', event: 'Berthing', status: 'Expected' as Status },
  { time: '14:30', date: '24 Jul', vessel: 'OOCL Spain', voyage: '023W', terminal: 'Yangshan T2', port: 'Shanghai', code: 'CNSHA', event: 'Departure', status: 'Delayed' as Status },
  { time: '18:30', date: '24 Jul', vessel: 'Madrid Maersk', voyage: '628W', terminal: 'Yangshan T3', port: 'Shanghai', code: 'CNSHA', event: 'Departure', status: 'Expected' as Status },
  { time: '22:10', date: '24 Jul', vessel: 'ONE Innovation', voyage: '072E', terminal: 'Waigaoqiao T4', port: 'Shanghai', code: 'CNSHA', event: 'Arrival', status: 'Expected' as Status },
];


const vessels = [
  { name: 'Madrid Maersk', imo: '9778791', flag: 'Denmark', service: 'AE10', voyage: '628W', current: 'East China Sea', next: 'Ningbo · 25 Jul', eta: 'On time', progress: 18 },
  { name: 'CMA CGM Jacques Saadé', imo: '9839179', flag: 'France', service: 'FAL1', voyage: '0FM8W', current: 'Shanghai anchorage', next: 'Ningbo · 27 Jul', eta: '+8 hours', progress: 7 },
  { name: 'MSC Tessa', imo: '9930038', flag: 'Liberia', service: 'SILK', voyage: 'FS629W', current: 'Busan', next: 'Ningbo · 27 Jul', eta: 'On time', progress: 12 },
  { name: 'Berlin Express', imo: '9540118', flag: 'Germany', service: 'FE4', voyage: '006W', current: 'Singapore Strait', next: 'Port Klang · 31 Jul', eta: 'On time', progress: 42 },
];


const statusStyle: Record<Status, string> = {
  'On time': 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Delayed: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  Arrived: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
  Departed: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  Expected: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
};


function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle[status]}`}>{status}</span>;
}


export default function SchedulesPage() {
  const [tab, setTab] = useState<Tab>('routes');
  const [origin, setOrigin] = useState('Shanghai, China');
  const [destination, setDestination] = useState('Rotterdam, Netherlands');
  const [date, setDate] = useState('2026-07-24');
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);


  const filteredRoutes = useMemo(() => {
    const term = query.toLowerCase();
    return routes.filter((route) =>
      [route.carrier, route.vessel, route.service, route.from, route.to].some((value) => value.toLowerCase().includes(term)),
    );
  }, [query]);


  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearched(true);
  };


  return (
    <main className="min-h-screen bg-[#05080d] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05080d]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight">Tariff<span className="text-amber-400">Wars</span></Link>
            <span className="hidden h-5 w-px bg-white/10 sm:block" />
            <span className="hidden items-center gap-2 text-sm text-slate-300 sm:flex"><Anchor className="h-4 w-4 text-sky-400" /> Ocean schedules</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-emerald-400" /> Live network</span>
            <span className="hidden rounded-md border border-white/10 px-2.5 py-1.5 md:block">Updated 2 min ago</span>
          </div>
        </div>
      </header>


      <section className="relative h-[370px] overflow-hidden border-b border-white/10 lg:h-[430px]">
        <Globe3D />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#05080d] via-[#05080d]/55 to-transparent" />
        <div className="absolute inset-0 mx-auto flex max-w-[1600px] items-center px-5 lg:px-8">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300"><Waves className="h-4 w-4" /> Global ocean intelligence</div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Plan every port.<br /><span className="text-slate-400">Track every vessel.</span></h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-slate-300">Search sailing options, terminal calls and vessel movements across the world&apos;s main trade lanes.</p>
            <div className="mt-7 flex flex-wrap gap-6 text-sm">
              <div><div className="text-2xl font-semibold">1,247</div><div className="text-xs text-slate-400">Vessels underway</div></div>
              <div><div className="text-2xl font-semibold">382</div><div className="text-xs text-slate-400">Ports connected</div></div>
              <div><div className="text-2xl font-semibold text-emerald-300">91.4%</div><div className="text-xs text-slate-400">On-time arrivals</div></div>
            </div>
          </div>
        </div>
      </section>


      <div className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.035] p-5 xl:sticky xl:top-24">
            <div className="mb-5 flex items-center justify-between">
              <div><p className="text-xs uppercase tracking-wider text-slate-500">Schedule finder</p><h2 className="mt-1 text-lg font-semibold">Search the network</h2></div>
              <SlidersHorizontal className="h-5 w-5 text-slate-500" />
            </div>
            <form onSubmit={handleSearch} className="space-y-4">
              <label className="block text-xs text-slate-400">Origin
                <span className="relative mt-1.5 block"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-sky-400" /><input value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-sky-400/60" /></span>
              </label>
              <label className="block text-xs text-slate-400">Destination
                <span className="relative mt-1.5 block"><MapPin className="absolute left-3 top-3.5 h-4 w-4 text-amber-400" /><input value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-sky-400/60" /></span>
              </label>
              <label className="block text-xs text-slate-400">Departure from
                <span className="relative mt-1.5 block"><CalendarDays className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-10 pr-3 text-sm outline-none [color-scheme:dark] focus:border-sky-400/60" /></span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-slate-400">Equipment<select className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1018] px-3 py-3 text-sm text-white outline-none"><option>40&apos; Dry HC</option><option>20&apos; Dry</option><option>40&apos; Reefer</option></select></label>
                <label className="block text-xs text-slate-400">Window<select className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1018] px-3 py-3 text-sm text-white outline-none"><option>± 7 days</option><option>± 14 days</option><option>± 30 days</option></select></label>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"><Search className="h-4 w-4" /> Find sailings</button>
              {searched && <p className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Showing the latest matching departures.</p>}
            </form>
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="mb-3 text-xs font-medium text-slate-400">Network health</p>
              {[['Asia — Europe', 'Low congestion', 'text-emerald-300'], ['Transpacific', 'Moderate delay', 'text-amber-300'], ['Red Sea', 'Rerouting', 'text-rose-300']].map(([lane, state, color]) => (
                <div key={lane} className="flex items-center justify-between py-2 text-xs"><span className="text-slate-300">{lane}</span><span className={color}>{state}</span></div>
              ))}
            </div>
          </aside>


          <section className="min-w-0">
            <div className="mb-5 flex overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {([
                ['routes', 'Point-to-point', Ship],
                ['calls', 'Port calls', Anchor],
                ['vessels', 'Vessel schedules', Container],
              ] as const).map(([id, label, Icon]) => (
                <button key={id} onClick={() => setTab(id)} className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition ${tab === id ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><Icon className={`h-4 w-4 ${tab === id ? 'text-amber-400' : ''}`} />{label}</button>
              ))}
            </div>


            {tab === 'routes' && (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><h2 className="text-xl font-semibold">Available sailings</h2><p className="mt-1 text-xs text-slate-400">{origin} → {destination} · {filteredRoutes.length} services</p></div>
                  <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter carrier or vessel" className="rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400/50" /></div>
                </div>
                <div className="space-y-3">
                  {filteredRoutes.map((route) => (
                    <article key={route.id} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-sky-400/30 hover:bg-white/[0.045]">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                        <div className="flex w-40 shrink-0 items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><Ship className="h-5 w-5" /></div><div><p className="font-semibold">{route.carrier}</p><p className="text-xs text-slate-500">{route.service} · {route.voyage}</p></div></div>
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="min-w-[105px]"><p className="text-sm font-medium">{route.from}</p><p className="font-mono text-xs text-slate-500">{route.fromCode}</p><p className="mt-2 text-xs text-slate-300">{route.etd}</p></div>
                          <div className="flex flex-1 items-center"><CircleDot className="h-3.5 w-3.5 text-sky-400" /><div className="relative h-px flex-1 bg-gradient-to-r from-sky-400/70 to-amber-400/70"><Ship className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 bg-[#0a0e15] px-0.5 text-slate-300" /></div><CircleDot className="h-3.5 w-3.5 text-amber-400" /></div>
                          <div className="min-w-[110px] text-right"><p className="text-sm font-medium">{route.to}</p><p className="font-mono text-xs text-slate-500">{route.toCode}</p><p className="mt-2 text-xs text-slate-300">{route.eta}</p></div>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4 lg:w-56 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><div><p className="flex items-center gap-1.5 text-sm"><Clock3 className="h-3.5 w-3.5 text-slate-500" />{route.duration}</p><p className="mt-1 text-xs text-slate-500">{route.stops} transshipment stops</p></div><StatusBadge status={route.status} /><ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-white" /></div>
                      </div>
                      <div className="mt-4 border-t border-white/5 pt-3 text-xs text-slate-500">Operated by <span className="text-slate-300">{route.vessel}</span> · Schedule ID {route.id}</div>
                    </article>
                  ))}
                </div>
              </>
            )}


            {tab === 'calls' && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Shanghai port calls</h2><p className="mt-1 text-xs text-slate-400">CNSHA · All terminals · Local time UTC+8</p></div><button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"><Filter className="h-3.5 w-3.5" /> Filter calls</button></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3 font-medium">Time</th><th className="px-5 py-3 font-medium">Vessel / voyage</th><th className="px-5 py-3 font-medium">Terminal</th><th className="px-5 py-3 font-medium">Movement</th><th className="px-5 py-3 font-medium">Status</th></tr></thead>
                    <tbody className="divide-y divide-white/5">{portCalls.map((call) => <tr key={`${call.vessel}-${call.time}`} className="hover:bg-white/[0.03]"><td className="px-5 py-4"><p className="font-medium">{call.time}</p><p className="text-xs text-slate-500">{call.date}</p></td><td className="px-5 py-4"><p className="font-medium">{call.vessel}</p><p className="text-xs text-slate-500">{call.voyage}</p></td><td className="px-5 py-4 text-slate-300">{call.terminal}</td><td className="px-5 py-4"><span className="flex items-center gap-2 text-slate-300">{call.event.includes('Arrival') || call.event === 'Arrived' ? <ArrowRight className="h-4 w-4 text-sky-400" /> : <ArrowLeft className="h-4 w-4 text-amber-400" />}{call.event}</span></td><td className="px-5 py-4"><StatusBadge status={call.status} /></td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}


            {tab === 'vessels' && (
              <div>
                <div className="mb-4"><h2 className="text-xl font-semibold">Vessel schedules</h2><p className="mt-1 text-xs text-slate-400">Active vessels on matching services</p></div>
                <div className="grid gap-4 md:grid-cols-2">
                  {vessels.map((vessel) => (
                    <article key={vessel.imo} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-sky-400/30">
                      <div className="flex items-start justify-between"><div className="flex gap-3"><div className="rounded-xl bg-sky-400/10 p-2.5 text-sky-300"><Ship className="h-5 w-5" /></div><div><h3 className="font-semibold">{vessel.name}</h3><p className="mt-1 text-xs text-slate-500">IMO {vessel.imo} · {vessel.flag}</p></div></div><span className={`text-xs ${vessel.eta === 'On time' ? 'text-emerald-300' : 'text-amber-300'}`}>{vessel.eta}</span></div>
                      <div className="my-5 grid grid-cols-2 gap-4 text-xs"><div><p className="text-slate-500">Service / voyage</p><p className="mt-1 text-sm text-slate-200">{vessel.service} · {vessel.voyage}</p></div><div><p className="text-slate-500">Current position</p><p className="mt-1 text-sm text-slate-200">{vessel.current}</p></div></div>
                      <div className="mb-2 flex justify-between text-xs"><span className="text-slate-500">Next call</span><span>{vessel.next}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400" style={{ width: `${vessel.progress}%` }} /></div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}



