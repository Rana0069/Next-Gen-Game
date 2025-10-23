// Main site logic: loads posts from Firestore and renders homepage
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { firebaseConfig } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collections = [
  {key:'latest_gaming', title:'Latest Gaming'},
  {key:'latest_tech', title:'Latest Tech'},
  {key:'top_10', title:'Top 10'},
  {key:'gta6', title:'GTA 6'}
];

document.getElementById('year').textContent = new Date().getFullYear();

// render categories row
const categoriesRow = document.getElementById('categoriesRow');
collections.forEach(c=>{
  const b = document.createElement('button'); b.className='cat-btn'; b.textContent=c.title;
  b.addEventListener('click', ()=> loadCategory(c.key));
  categoriesRow.appendChild(b);
});

// Search
document.getElementById('searchBtn').addEventListener('click', applySearch);
document.getElementById('searchInput').addEventListener('keypress', (e)=>{ if(e.key==='Enter') applySearch(); });

// initial load
loadHome();
loadLatestList();
loadTrending();

async function loadHome(){
  const view = document.getElementById('view');
  view.innerHTML = '<div class="card"><div class="small">Loading...</div></div>';
  // show featured: first item from gta6 if present, else first available
  let featured = null;
  for(const c of collections){
    const q = query(collection(db,c.key), orderBy('createdAt','desc'), limit(1));
    try{
      const snap = await getDocs(q);
      if(!snap.empty){ featured = {col:c.key, doc: snap.docs[0]}; break; }
    }catch(e){ console.error('loadHome err',e) }
  }
  if(!featured){ view.innerHTML = '<div class="card">No posts yet.</div>'; return; }
  const fd = featured.doc.data();
  let html = `<section class="card" style="margin-bottom:16px;">
                <div style="display:flex;gap:16px;align-items:center">
                  <div style="flex:2">
                    <div style="font-weight:900;font-size:20px">${fd.title}</div>
                    <div style="color:var(--muted);margin-top:6px">${fd.excerpt||''}</div>
                    <div style="margin-top:12px"><a href="index.html#post/${featured.col}/${featured.doc.id}" class="cta">Read more</a></div>
                  </div>
                  <div style="flex:1">
                    <div class="thumb">${fd.title}</div>
                  </div>
                </div>
              </section>`;

  // show grid of recent posts across all collections combined (top 4)
  let cards = [];
  for(const c of collections){
    const q = query(collection(db,c.key), orderBy('createdAt','desc'), limit(4));
    try{
      const snap = await getDocs(q);
      snap.forEach(docSnap=>{
        const d = docSnap.data(); d._id = docSnap.id; d._col = c.key; d._colTitle = c.title;
        cards.push(d);
      });
    }catch(e){console.error('loadHome cards err',e)}
  }
  // sort by createdAt desc (some docs may have null createdAt if manual) - fallback
  cards.sort((a,b)=>{
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  html += '<div class="grid">';
  cards.slice(0,6).forEach(p=>{
    html += `<article class="card">
              <div class="thumb">${p.title}</div>
              <div style="margin-top:10px">
                <div style="font-weight:800">${p.title}</div>
                <div class="meta"><div class="category">${p._colTitle}</div><div class="small">${p._col}</div></div>
                <p style="color:var(--muted);margin-top:8px">${p.excerpt||''}</p>
                <a href="index.html#post/${p._col}/${p._id}" style="font-weight:800;display:inline-block;margin-top:8px">Read</a>
              </div>
            </article>`;
  });
  html += '</div>';
  view.innerHTML = html;
}

// Load latest list for sidebar
async function loadLatestList(){
  const list = document.getElementById('latestList');
  list.innerHTML = '<div class="small">Loading...</div>';
  let items = [];
  for(const c of collections){
    const q = query(collection(db,c.key), orderBy('createdAt','desc'), limit(3));
    try{
      const snap = await getDocs(q);
      snap.forEach(d=>{ const obj = d.data(); obj._id=d.id; obj._col=c.key; obj._colTitle=c.title; items.push(obj); });
    }catch(e){console.error('latestList err',e)}
  }
  items.sort((a,b)=>{
    const ta = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
    const tb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
    return tb - ta;
  });
  list.innerHTML = items.slice(0,6).map(i=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${i.title}</strong><div class="small">${i._colTitle}</div></div>`).join('');
}

async function loadTrending(){
  const t = document.getElementById('trendingList');
  t.innerHTML = '<li>Loading...</li>';
  // simple approach: fetch top item titles from collections
  let trend = [];
  for(const c of collections){
    const q = query(collection(db,c.key), orderBy('createdAt','desc'), limit(1));
    try{
      const snap = await getDocs(q);
      snap.forEach(d=> trend.push(d.data().title));
    }catch(e){}
  }
  t.innerHTML = trend.slice(0,5).map(x=>`<li>${x}</li>`).join('');
}

async function loadCategory(colKey){
  const view = document.getElementById('view');
  view.innerHTML = '<div class="card"><div class="small">Loading...</div></div>';
  const c = collections.find(x=>x.key===colKey);
  if(!c){ view.innerHTML='<div class="card">Unknown category</div>'; return; }
  const q = query(collection(db,c.key), orderBy('createdAt','desc'));
  try{
    const snap = await getDocs(q);
    if(snap.empty){ view.innerHTML = '<div class="card">No posts found.</div>'; return; }
    let html = `<div class="card"><h2>${c.title}</h2></div><div class="grid">`;
    snap.forEach(docSnap=>{
      const d = docSnap.data(); const id=docSnap.id;
      html += `<article class="card">
                <div class="thumb">${d.title}</div>
                <div style="margin-top:10px">
                  <div style="font-weight:800">${d.title}</div>
                  <div class="meta"><div class="category">${c.title}</div></div>
                  <p style="color:var(--muted);margin-top:8px">${d.excerpt||''}</p>
                  <a href="index.html#post/${c.key}/${id}" style="font-weight:800;display:inline-block;margin-top:8px">Read</a>
                </div>
              </article>`;
    });
    html += '</div>';
    view.innerHTML = html;
  }catch(e){view.innerHTML='<div class="card">Error loading.</div>';console.error(e)}
}

async function applySearch(){
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  if(!q){ loadHome(); return; }
  const view = document.getElementById('view');
  view.innerHTML = '<div class="card"><div class="small">Searching...</div></div>';
  let results = [];
  for(const c of collections){
    const snap = await getDocs(query(collection(db,c.key), orderBy('createdAt','desc'), limit(50)));
    snap.forEach(docSnap=>{
      const d = docSnap.data(); d._id = docSnap.id; d._col = c.key; d._colTitle = c.title;
      const hay = (d.title+' '+(d.excerpt||'')+' '+(d.content||'')).toLowerCase();
      if(hay.includes(q)) results.push(d);
    });
  }
  if(results.length===0){ view.innerHTML='<div class="card">No results found.</div>'; return; }
  let html = '<div class="grid">';
  results.slice(0,12).forEach(p=>{
    html += `<article class="card">
              <div class="thumb">${p.title}</div>
              <div style="margin-top:10px">
                <div style="font-weight:800">${p.title}</div>
                <div class="meta"><div class="category">${p._colTitle}</div></div>
                <p style="color:var(--muted);margin-top:8px">${p.excerpt||''}</p>
                <a href="index.html#post/${p._col}/${p._id}" style="font-weight:800;display:inline-block;margin-top:8px">Read</a>
              </div>
            </article>`;
  });
  html += '</div>';
  view.innerHTML = html;
}

// routing to post pages via hash like #post/collection/id
window.addEventListener('hashchange', router);
window.addEventListener('load', ()=>{ if(!location.hash) location.hash='home'; router(); });

function router(){
  const hash = location.hash.replace('#','') || 'home';
  const parts = hash.split('/');
  if(parts[0]==='post' && parts.length===3){
    renderPost(parts[1], parts[2]);
  } else if(parts[0]==='about'){
    renderAbout();
  } else if(parts[0]==='contact'){
    renderContact();
  } else {
    loadHome();
    loadLatestList();
    loadTrending();
  }
}

async function renderPost(col, id){
  const view = document.getElementById('view');
  view.innerHTML = '<div class="card"><div class="small">Loading...</div></div>';
  try{
    const docRef = await (await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js')).doc;
  }catch(e){}
  import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js').then(({getFirestore, doc, getDoc})=>{
    const db = getFirestore(initializeApp(firebaseConfig));
    const dref = doc(db, col, id);
    getDoc(dref).then(snap=>{
      if(!snap.exists()){ view.innerHTML='<div class="card">Post not found.</div>'; return; }
      const p = snap.data();
      let html = `<article class="card"><div style="display:flex;gap:12px;align-items:center;justify-content:space-between">
                  <div><div class="category">${col}</div><h1 class="post-title">${p.title}</h1><div class="post-meta">${p.createdAt ? new Date(p.createdAt.seconds*1000).toLocaleString() : ''} • Next Gen Game</div></div>
                  <div style="min-width:120px" class="thumb">${p.title}</div>
                  </div><div class="post-body" style="margin-top:12px">${p.content||'<p>'+ (p.excerpt||'') +'</p>'}</div></article>`;
      html += `<div style="margin-top:12px"><a href="index.html#home">← Back to home</a></div>`;
      view.innerHTML = html;
    });
  }).catch(e=>console.error(e));
}

function renderAbout(){ document.getElementById('view').innerHTML = `<div class="card"><h2>About Next Gen Game</h2><p class="small">Next Gen Game covers the latest in video games and gaming tech — news, reviews, and hardware guides for players and builders.</p></div>`; }
function renderContact(){ document.getElementById('view').innerHTML = `<div class="card"><h2>Contact</h2><p class="small">Business enquiries: <a href="mailto:biz@nextgengame.com">biz@nextgengame.com</a></p></div>`; }
