(() => {
  const css = `.tvp-rtmp-live{position:relative;z-index:20;margin:18px auto;padding:18px;max-width:1180px;border:1px solid #22c55e66;border-radius:14px;background:linear-gradient(135deg,#071b12,#0b1220);color:#fff;font-family:inherit;box-shadow:0 8px 30px #0004}.tvp-rtmp-live h2{margin:0 0 6px;font-size:20px}.tvp-rtmp-live .meta{color:#9ca3af;font-size:12px;margin-bottom:14px}.tvp-rtmp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.tvp-rtmp-card{padding:12px;border-radius:10px;background:#111827;border:1px solid #22c55e55}.tvp-rtmp-card strong{display:block;margin-bottom:7px}.tvp-rtmp-card code{display:block;color:#86efac;font-size:11px;word-break:break-all}.tvp-rtmp-empty{color:#fbbf24;padding:8px 0}.tvp-rtmp-dot{display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:50%;margin-right:7px;box-shadow:0 0 8px #22c55e}`;
  const style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);
  async function render(){
    let box=document.querySelector('.tvp-rtmp-live'); if(!box){box=document.createElement('section');box.className='tvp-rtmp-live';(document.querySelector('main')||document.body).prepend(box)}
    try{
      const r=await fetch('/rtmp-live.json?'+Date.now(),{cache:'no-store'}); const d=await r.json(); const ch=Array.isArray(d.channels)?d.channels:[];
      box.innerHTML='<h2><span class="tvp-rtmp-dot"></span>RTMP actifs créés avec mon IP</h2><div class="meta">IP source : 191.215.38.95 · Vérifiés le '+new Date(d.updatedAt).toLocaleString()+'</div>'+(ch.length?'<div class="tvp-rtmp-grid">'+ch.map((x,i)=>'<div class="tvp-rtmp-card"><strong>'+((i+1)+'. '+String(x.name||'Chaîne RTMP')).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</strong><code>'+String(x.url).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</code></div>').join('')+'</div>':'<div class="tvp-rtmp-empty">Aucun flux RTMP actif détecté actuellement.</div>');
    }catch(e){box.innerHTML='<h2>RTMP actifs créés avec mon IP</h2><div class="tvp-rtmp-empty">Vérification temporairement indisponible.</div>'}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
  setInterval(render,30000);
})();
