import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Upload, Film, CheckCircle2, AlertCircle, Download, Trash2, ShieldCheck, LoaderCircle, FileVideo2, Settings2, Smartphone } from 'lucide-react';
import './style.css';

const CORE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
const pretty = n => n < 1024*1024 ? `${(n/1024).toFixed(0)} KB` : `${(n/1024/1024).toFixed(1)} MB`;
const safeStem = name => name.replace(/\.[^.]+$/, '') || 'video';
function App(){
 const [items,setItems]=useState([]), [ready,setReady]=useState(false), [busy,setBusy]=useState(false), [loading,setLoading]=useState(false), [overall,setOverall]=useState(0), [message,setMessage]=useState('Choose videos to begin.');
 const ff=useRef(null), input=useRef(null), urls=useRef([]);
 const update=(id,patch)=>setItems(old=>old.map(x=>x.id===id?{...x,...patch}:x));
 const loadEngine=async()=>{
   if(ff.current) return ff.current;
   setLoading(true); setMessage('Loading the video engine… first load is about 30 MB.');
   const engine=new FFmpeg();
   engine.on('progress',({progress})=>setOverall(Math.max(0,Math.min(100,Math.round(progress*100)))));
   engine.on('log',({message})=>{ if(message.includes('Error')) console.warn(message); });
   await engine.load({coreURL:await toBlobURL(`${CORE}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${CORE}/ffmpeg-core.wasm`,'application/wasm')});
   ff.current=engine; setReady(true); setLoading(false); setMessage('Ready. Your videos stay on this device.');
   return engine;
 };
 const addFiles=e=>{
   const selected=Array.from(e.target.files||[]).filter(f=>f.type.startsWith('video/')||/\\.(mp4|mov|m4v|webm|mkv|avi|3gp)$/i.test(f.name));
   const mapped=selected.map((file,i)=>({id:`${Date.now()}-${i}-${Math.random()}`,file,name:file.name,size:file.size,status:'queued',progress:0,result:null,error:null}));
   setItems(old=>[...old,...mapped]); if(mapped.length) setMessage(`${mapped.length} video${mapped.length===1?'':'s'} added.`);
   e.target.value='';
 };
 const outputName=(name,used)=>{
   const stem=safeStem(name); let candidate=`${stem}.mp4`, n=2;
   while(used.has(candidate.toLowerCase())) candidate=`${stem} (${n++}).mp4`;
   used.add(candidate.toLowerCase()); return candidate;
 };
 const convert=async()=>{
   if(!items.some(x=>x.status==='queued')) return;
   setBusy(true); setOverall(0);
   try{
     const engine=await loadEngine(), used=new Set(items.filter(x=>x.result).map(x=>x.result.name.toLowerCase()));
     const queue=items.filter(x=>x.status==='queued');
     for(let index=0;index<queue.length;index++){
       const item=queue[index]; update(item.id,{status:'processing',error:null,progress:0}); setMessage(`Preparing ${item.name} (${index+1} of ${queue.length})…`);
       const inputName=`input_${index}_${Date.now()}.${(item.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').toLowerCase()}`;
       const outName=outputName(item.name,used);
       try{
         await engine.writeFile(inputName,await fetchFile(item.file));
         // H.264 AVC, AAC, 30fps, yuv420p SDR; keep orientation and fit within 1080p without stretching.
         await engine.exec(['-i',inputName,'-map','0:v:0','-map','0:a?','-vf',"scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30,format=yuv420p",' -c:v'.trim(),'libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',outName]);
         const data=await engine.readFile(outName);
         const blob=new Blob([data.buffer],{type:'video/mp4'}), url=URL.createObjectURL(blob); urls.current.push(url);
         update(item.id,{status:'done',result:{name:outName,size:blob.size,url},progress:100});
         await engine.deleteFile(inputName); await engine.deleteFile(outName);
       }catch(err){ update(item.id,{status:'error',error:String(err?.message||err)}); try{await engine.deleteFile(inputName)}catch{} }
       setOverall(Math.round(((index+1)/queue.length)*100));
     }
     setMessage('Preparation finished. Download each MP4 below.');
   }catch(err){setMessage(`Could not start video engine: ${err?.message||err}`);setLoading(false);}
   finally{setBusy(false);setLoading(false);}
 };
 const clear=()=>{urls.current.forEach(URL.revokeObjectURL);urls.current=[];setItems([]);setMessage('Choose videos to begin.');setOverall(0);};
 const downloadAll=()=>items.filter(x=>x.result).forEach((x,i)=>setTimeout(()=>{const a=document.createElement('a');a.href=x.result.url;a.download=x.result.name;a.click();},i*450));
 useEffect(()=>()=>urls.current.forEach(URL.revokeObjectURL),[]);
 const queued=items.filter(x=>x.status==='queued').length, completed=items.filter(x=>x.result).length;
 return <main className="shell">
  <header><div className="brand"><div className="brandmark">R</div><div><div className="eyebrow">RADA TOOLS</div><h1>Video Prep <span>Studio</span></h1></div></div><div className="local"><ShieldCheck size={15}/> ON-DEVICE</div></header>
  <section className="hero"><div className="hero-kicker"><span className="pulse"/> MOBILE VIDEO WORKSPACE</div><h2>Get your clips<br/><em>ready to move.</em></h2><p>Convert videos into a dependable MP4 format for editing and sharing. Simple, private, and built for your phone.</p><div className="specs"><span>MP4</span><span>H.264 / AVC</span><span>AAC audio</span><span>1080p max</span></div></section>
  <section className="privacy"><ShieldCheck size={19}/><div><b>Your files stay on your device</b><small>Processing happens in this browser. Nothing is uploaded to RADA.</small></div></section>
  <section className="workspace">
   <div className="section-head"><div><div className="eyebrow">01 / ADD FOOTAGE</div><h3>Your videos</h3></div><span className="count">{items.length} FILES</span></div>
   <input ref={input} type="file" accept="video/*,.mov,.mkv,.avi,.3gp" multiple hidden onChange={addFiles}/>
   <button className="drop" onClick={()=>input.current?.click()} disabled={busy}><div className="upload-icon"><Upload/></div><b>Tap to add videos</b><small>Choose one or more clips from your phone</small><span className="choose">BROWSE FILES</span></button>
   {items.length>0&&<div className="filelist">{items.map(item=><article className="file" key={item.id}><div className="file-icon"><FileVideo2/></div><div className="file-info"><b>{item.name}</b><small>{pretty(item.size)} · {item.status==='done'?`Ready as ${item.result.name}`:item.status==='processing'?'Converting…':item.status==='error'?'Could not convert':item.status==='queued'?'Waiting to convert':'Ready'}</small>{item.error&&<small className="error">{item.error.slice(0,130)}</small>}</div><div className={`status ${item.status}`}>{item.status==='done'?<CheckCircle2 size={17}/>:item.status==='error'?<AlertCircle size={17}/>:item.status==='processing'?<LoaderCircle className="spin" size={17}/>:<span/>}</div>{item.result&&<a className="download" href={item.result.url} download={item.result.name} aria-label={`Download ${item.result.name}`}><Download size={17}/></a>}</article>)}</div>}
   {items.length>0&&<div className="actions"><button className="primary" onClick={convert} disabled={busy||queued===0}>{busy?<><LoaderCircle className="spin" size={17}/> PREPARING…</>:<><Settings2 size={17}/> PREPARE {queued?`${queued} VIDEO${queued===1?'':'S'}`:'COMPLETE'}</>}</button><button className="clear" onClick={clear} disabled={busy}><Trash2 size={16}/> Clear</button></div>}
   {busy&&<div className="progress-wrap"><div className="progress-label"><span>Batch progress</span><b>{overall}%</b></div><div className="track"><div style={{width:`${overall}%`}}/></div></div>}
   {completed>0&&<button className="download-all" onClick={downloadAll}><Download size={17}/> DOWNLOAD ALL ({completed})</button>}
   <div className="message">{loading&&<LoaderCircle className="spin" size={15}/>} {message}</div>
  </section>
  <section className="settings"><div className="eyebrow">02 / OUTPUT PRESET</div><h3>Clean, compatible MP4</h3><div className="setting-grid"><div><b>Video</b><span>H.264 / AVC</span></div><div><b>Audio</b><span>AAC · 128 kbps</span></div><div><b>Frame rate</b><span>30 fps</span></div><div><b>Resolution</b><span>Up to 1080p</span></div><div><b>Pixel format</b><span>yuv420p · SDR</span></div><div><b>Aspect ratio</b><span>Preserved</span></div></div><p className="note">Original filename is preserved. The output uses the same name with an .mp4 extension; duplicate names get a number so files are not overwritten. Video is never stretched.</p></section>
  <footer><div className="footer-brand">RADA <span>VIDEO PREP STUDIO</span></div><small>Independent utility · Not connected to the RADA app</small></footer>
 </main>
}
createRoot(document.getElementById('root')).render(<App/>);
