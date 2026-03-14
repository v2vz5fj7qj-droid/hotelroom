import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Plus, Trash2, Monitor, Settings, Save, Building2, MapPin, 
  ShieldCheck, Loader2, ListTree, AlertTriangle, X, Edit3, 
  CheckCircle2, Briefcase, BarChart3, FileText, Download, FileDown 
} from 'lucide-react';

// URL de base de l'API Backend tournant localement sur votre Mac (via Node.js)
// Le port 3001 correspond à celui défini dans votre fichier server.js
const API_URL = "http://127.0.0.1:3001/api";

const App = () => {
  const [view, setView] = useState('display'); 
  const [adminTab, setAdminTab] = useState('events'); 
  const [allEvents, setAllEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [config, setConfig] = useState({ selectedDate: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [newEvent, setNewEvent] = useState({ companyId: '', roomId: '' });
  const [newRoom, setNewRoom] = useState({ name: '', floor: '' });
  const [newCompany, setNewCompany] = useState({ name: '' });
  const [analysisFilter, setAnalysisFilter] = useState({
    companyId: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0]
  });

  // --- CHARGEMENT DES DONNÉES ---
  const loadData = async () => {
    try {
      const [e, r, c] = await Promise.all([
        fetch(`${API_URL}/events`).then(res => res.json()),
        fetch(`${API_URL}/rooms`).then(res => res.json()),
        fetch(`${API_URL}/companies`).then(res => res.json())
      ]);
      setAllEvents(e);
      setRooms(r);
      setCompanies(c);
      setLoading(false);
    } catch (err) {
      setErrorMessage("Connexion au serveur MySQL impossible.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // --- LOGIQUE MÉTIER ---
  const formatBFloor = (f) => (f === "0" || f === 0) ? "RDC" : `Etage : ${f}`;
  
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
        const d = ev.event_date ? ev.event_date.split('T')[0] : ev.eventDate;
        return d === config.selectedDate;
    });
  }, [allEvents, config.selectedDate]);

  const filteredHistory = useMemo(() => {
    if (!analysisFilter.companyId) return [];
    return allEvents.filter(ev => {
      const d = ev.event_date ? ev.event_date.split('T')[0] : ev.eventDate;
      return String(ev.company_id) === String(analysisFilter.companyId) && d >= analysisFilter.startDate && d <= analysisFilter.endDate;
    });
  }, [allEvents, analysisFilter]);

  // --- ACTIONS ---
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.companyId || !newEvent.roomId) return;
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEvent, event_date: config.selectedDate })
    });
    if (res.ok) { setNewEvent({ companyId: '', roomId: '' }); loadData(); }
    else setErrorMessage("Salle déjà occupée ce jour-là.");
  };

  const handleExportPDF = () => {
    if (filteredHistory.length === 0) return;
    setIsExporting(true);
    const element = document.getElementById('report-to-pdf');
    const company = companies.find(c => String(c.id) === String(analysisFilter.companyId))?.name || 'Client';
    const opt = {
      margin: 15, filename: `Bravia_Hotel_${company}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().from(element).set(opt).save().then(() => setIsExporting(false));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#fcfbfb]"><Loader2 className="animate-spin text-[#701c45]" size={48} /></div>;

  return (
    <div className="font-['Raleway'] min-h-screen bg-[#fcfbfb]">
      {/* SECTION PDF CACHÉE */}
      <div id="report-to-pdf" className="p-12 bg-white text-gray-800" style={{ position: 'absolute', top: '-9999px', width: '210mm' }}>
        <h1 className="text-3xl font-black text-[#701c45] uppercase border-b-4 border-[#701c45] pb-4 mb-8">Bravia Hotel - Rapport Historique</h1>
        <p className="text-lg font-bold mb-4">Entreprise : {companies.find(c => String(c.id) === String(analysisFilter.companyId))?.name}</p>
        <table className="w-full text-left border-collapse">
            <thead><tr className="bg-[#701c45] text-white"><th className="p-3 border">Date</th><th className="p-3 border">Salle</th><th className="p-3 border">Étage</th></tr></thead>
            <tbody>{filteredHistory.map((h, i) => (<tr key={i}><td className="p-3 border">{h.event_date.split('T')[0]}</td><td className="p-3 border uppercase">{h.room}</td><td className="p-3 border">{formatBFloor(h.floor)}</td></tr>))}</tbody>
        </table>
      </div>

      {view === 'display' ? (
        /* VUE AFFICHAGE TV */
        <div className="h-screen flex flex-col items-center justify-center p-12 text-[#701c45] text-center">
          <h1 className="text-4xl font-bold uppercase tracking-widest border-b-4 border-[#701c45] pb-2 mb-12">
            {new Date(config.selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </h1>
          <div className="flex-grow flex flex-col justify-center space-y-16 w-full">
            {filteredEvents.length > 0 ? filteredEvents.map(ev => (
              <div key={ev.id} className="animate-in fade-in duration-700">
                <h2 className="text-7xl font-black uppercase tracking-tighter mb-4">{ev.title}</h2>
                <div className="inline-block border-b-4 border-[#701c45] pb-2 px-6">
                  <p className="text-3xl font-bold text-gray-500 uppercase">Salle {ev.room} <span className="mx-2">|</span> {formatBFloor(ev.floor)}</p>
                </div>
              </div>
            )) : <p className="text-3xl italic opacity-30">Aucun événement programmé</p>}
          </div>
          <button onClick={() => setView('admin')} className="absolute bottom-8 right-8 p-4 bg-[#701c45] text-white rounded-full shadow-xl"><Settings/></button>
        </div>
      ) : (
        /* VUE ADMINISTRATION */
        <div className="flex min-h-screen">
          <div className="w-64 bg-[#701c45] p-8 text-white flex flex-col gap-6">
            <h1 className="text-2xl font-black italic">Bravia Manager</h1>
            <nav className="flex flex-col gap-2">
              <button onClick={() => setAdminTab('events')} className={`p-4 rounded-xl font-bold text-left ${adminTab === 'events' ? 'bg-white text-[#701c45]' : 'hover:bg-white/10'}`}>Programmer</button>
              <button onClick={() => setAdminTab('rooms')} className={`p-4 rounded-xl font-bold text-left ${adminTab === 'rooms' ? 'bg-white text-[#701c45]' : 'hover:bg-white/10'}`}>Salles</button>
              <button onClick={() => setAdminTab('companies')} className={`p-4 rounded-xl font-bold text-left ${adminTab === 'companies' ? 'bg-white text-[#701c45]' : 'hover:bg-white/10'}`}>Entreprises</button>
              <button onClick={() => setAdminTab('stats')} className={`p-4 rounded-xl font-bold text-left ${adminTab === 'stats' ? 'bg-white text-[#701c45]' : 'hover:bg-white/10'}`}>Statistiques</button>
            </nav>
            <button onClick={() => setView('display')} className="mt-auto p-4 bg-amber-400 text-[#701c45] rounded-xl font-black flex items-center justify-center gap-2"><Monitor size={20}/> ÉCRAN TV</button>
          </div>
          <div className="flex-grow p-12 bg-slate-50 overflow-y-auto">
            {errorMessage && <div className="mb-6 p-4 bg-red-100 text-red-600 rounded-xl flex items-center gap-2"><AlertTriangle size={18}/> {errorMessage} <button onClick={() => setErrorMessage("")} className="ml-auto"><X size={18}/></button></div>}
            
            {adminTab === 'events' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black text-slate-800 uppercase">Programmation</h2>
                    <input type="date" value={config.selectedDate} onChange={e => setConfig({...config, selectedDate: e.target.value})} className="p-3 rounded-xl border border-slate-200 font-bold"/>
                </div>
                <form onSubmit={handleAddEvent} className="bg-white p-6 rounded-2xl shadow-sm flex gap-4">
                    <select value={newEvent.companyId} onChange={e => setNewEvent({...newEvent, companyId: e.target.value})} className="flex-grow p-4 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100" required>
                        <option value="">Choisir Entreprise...</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={newEvent.roomId} onChange={e => setNewEvent({...newEvent, roomId: e.target.value})} className="flex-grow p-4 bg-slate-50 rounded-xl font-bold outline-none border border-slate-100" required>
                        <option value="">Choisir Salle...</option>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({formatBFloor(r.floor)})</option>)}
                    </select>
                    <button type="submit" className="bg-[#701c45] text-white px-8 rounded-xl font-black hover:scale-105 transition-all"><Plus/></button>
                </form>
                <div className="grid gap-4">
                    {filteredEvents.map(ev => (
                        <div key={ev.id} className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center border border-transparent hover:border-[#701c45] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#701c45]/5 text-[#701c45] rounded-lg"><Briefcase/></div>
                                <div><p className="text-xl font-black uppercase text-slate-800">{ev.title}</p><p className="text-sm font-bold text-slate-400">Salle {ev.room} — {formatBFloor(ev.floor)}</p></div>
                            </div>
                            <button onClick={() => fetch(`${API_URL}/events/${ev.id}`, {method: 'DELETE'}).then(() => loadData())} className="text-slate-300 hover:text-red-500 p-2"><Trash2/></button>
                        </div>
                    ))}
                </div>
              </div>
            )}

            {adminTab === 'rooms' && (
                <div className="space-y-8">
                    <h2 className="text-3xl font-black text-slate-800 uppercase">Gestion des Salles</h2>
                    <form onSubmit={async (e) => { e.preventDefault(); const res = await fetch(`${API_URL}/rooms`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...newRoom, floor: parseInt(newRoom.floor)})}); if(res.ok) { setNewRoom({name:'', floor:''}); loadData(); } }} className="bg-white p-6 rounded-2xl shadow-sm flex gap-4">
                        <input type="text" placeholder="Nom de la salle" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className="flex-grow p-4 bg-slate-50 rounded-xl font-bold" required/>
                        <input type="number" placeholder="Étage (0-15)" min="0" max="15" value={newRoom.floor} onChange={e => setNewRoom({...newRoom, floor: e.target.value})} className="w-48 p-4 bg-slate-50 rounded-xl font-bold text-center" required/>
                        <button type="submit" className="bg-[#701c45] text-white px-8 rounded-xl font-black">CRÉER</button>
                    </form>
                    <div className="grid grid-cols-2 gap-4">
                        {rooms.map(r => (
                            <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center"><div className="flex items-center gap-4"><div className="p-3 bg-slate-100 text-slate-400 rounded-lg"><MapPin/></div><div><p className="font-black uppercase">{r.name}</p><p className="text-xs font-bold text-slate-400">{formatBFloor(r.floor)}</p></div></div></div>
                        ))}
                    </div>
                </div>
            )}
            
            {adminTab === 'companies' && (
                <div className="space-y-8">
                    <h2 className="text-3xl font-black text-slate-800 uppercase">Base Entreprises</h2>
                    <form onSubmit={async (e) => { e.preventDefault(); await fetch(`${API_URL}/companies`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newCompany)}); setNewCompany({name:''}); loadData(); }} className="bg-white p-6 rounded-2xl shadow-sm flex gap-4">
                        <input type="text" placeholder="Nom de l'entreprise" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="flex-grow p-4 bg-slate-50 rounded-xl font-bold" required/>
                        <button type="submit" className="bg-[#701c45] text-white px-8 rounded-xl font-black">ENREGISTRER</button>
                    </form>
                    <div className="grid grid-cols-3 gap-4">
                        {companies.map(c => (<div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-3 font-black uppercase text-slate-700 border border-slate-100"><Briefcase size={16} className="text-slate-300"/> {c.name}</div>))}
                    </div>
                </div>
            )}

            {adminTab === 'stats' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black text-slate-800 uppercase">Analyse Historique</h2>
                        <div className="flex gap-2">
                            <button onClick={handleExportPDF} disabled={filteredHistory.length === 0 || isExporting} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-30">{isExporting ? <Loader2 className="animate-spin"/> : <FileDown/>} PDF</button>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm grid grid-cols-3 gap-6">
                        <div><label className="text-xs font-black uppercase text-slate-400">Entreprise</label><select value={analysisFilter.companyId} onChange={e => setAnalysisFilter({...analysisFilter, companyId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold mt-2">{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label className="text-xs font-black uppercase text-slate-400">Début</label><input type="date" value={analysisFilter.startDate} onChange={e => setAnalysisFilter({...analysisFilter, startDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold mt-2"/></div>
                        <div><label className="text-xs font-black uppercase text-slate-400">Fin</label><input type="date" value={analysisFilter.endDate} onChange={e => setAnalysisFilter({...analysisFilter, endDate: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl font-bold mt-2"/></div>
                    </div>
                    <div className="grid gap-3">
                        {filteredHistory.map((h, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl flex justify-between items-center border-l-8 border-[#701c45]">
                                <div className="flex items-center gap-6"><p className="text-xl font-black text-slate-300">#{i+1}</p><div><p className="font-black text-slate-800 uppercase">{h.room}</p><p className="text-xs font-bold text-slate-400 uppercase">{formatBFloor(h.floor)}</p></div></div>
                                <p className="font-black text-[#701c45] bg-[#701c45]/5 px-4 py-2 rounded-lg">{h.event_date.split('T')[0]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;