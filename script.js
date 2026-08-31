const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let notesData=store.get('classNotes',[]), currentId=null, toastTimer;
$('#date').value=new Date().toISOString().slice(0,10);
function toast(t){const e=$('#toast');e.textContent='✓ '+t;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2300)}
function go(id){$$('.page').forEach(x=>x.classList.toggle('active',x.id===id));$$('.nav').forEach(x=>x.classList.toggle('active',x.dataset.go===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='ai')buildPrompt();if(id==='archive')renderArchive()}
$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
function draft(){return {subject:$('#subject').value.trim(),title:$('#title').value.trim(),date:$('#date').value,notes:$('#notes').value.trim()}}
function saveDraft(){if($('#autosave').checked)store.set('draft',draft())}
['subject','title','date','notes'].forEach(id=>$('#'+id).addEventListener('input',saveDraft));
function restoreDraft(){let d=store.get('draft',null);if(d)Object.keys(d).forEach(k=>{if($('#'+k))$('#'+k).value=d[k]||''})}
restoreDraft();
$('#saveBtn').onclick=()=>{let d=draft();if(!d.subject&&!d.title&&!d.notes)return toast('اول چند نکته وارد کن');if(currentId){let i=notesData.findIndex(x=>x.id===currentId);notesData[i]={...notesData[i],...d}}else{currentId=Date.now();notesData.unshift({id:currentId,...d})}store.set('classNotes',notesData);store.set('draft',{});$('#saveState').textContent='ذخیره شد';toast('جلسه ذخیره شد');renderRecent()};
$('#clearBtn').onclick=()=>{['subject','title','notes'].forEach(i=>$('#'+i).value='');currentId=null;toast('ویرایشگر پاک شد')};
function card(n){return `<article class="glass note-card"><div class="meta">${esc(n.subject||'بدون درس')} · ${esc(n.date||'')}</div><h3>${esc(n.title||'جلسه بدون عنوان')}</h3><p>${esc((n.notes||'').slice(0,115))}${(n.notes||'').length>115?'…':''}</p><div class="note-actions"><button class="ghost" onclick="openNote(${n.id})">باز کردن</button><button class="ghost" onclick="downloadNote(${n.id})">Markdown</button></div></article>`}
function renderRecent(){let a=$('#recent');a.innerHTML=notesData.slice(0,3).map(card).join('')||'<div class="glass card hint">هنوز جلسه‌ای ذخیره نکرده‌ای. از «شروع جلسه جدید» شروع کن ✦</div>'}
function renderArchive(){let q=($('#searchNotes').value||'').toLowerCase();$('#archiveList').innerHTML=notesData.filter(n=>(n.subject+n.title+n.notes).toLowerCase().includes(q)).map(card).join('')||'<div class="glass card hint">چیزی پیدا نشد.</div>'}
$('#searchNotes').addEventListener('input',renderArchive);
window.openNote=id=>{let n=notesData.find(x=>x.id===id);if(!n)return;currentId=id;Object.keys(draft()).forEach(k=>$('#'+k).value=n[k]||'');go('editor');toast('جلسه باز شد')};
function md(n){return `# ${n.title||'جلسه'}\n\n**درس:** ${n.subject||''}\n\n**تاریخ:** ${n.date||''}\n\n## نکات مهم جلسه\n\n${n.notes||''}\n`}
function dl(name,text){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
window.downloadNote=id=>{let n=notesData.find(x=>x.id===id);if(n){dl((n.title||'class-note')+'.md',md(n));toast('Markdown آماده شد')}};
$('#exportCurrent').onclick=()=>{let d=currentId?notesData.find(x=>x.id===currentId):draft();dl((d.title||'class-note')+'.md',md(d));toast('خروجی آماده شد')};
$('#exportAll').onclick=()=>{dl('class-notes-archive.md',notesData.map(md).join('\n---\n\n'));toast('آرشیو صادر شد')};
function buildPrompt(){let d=draft();let mode=$('#promptMode').value;let tasks={summary:'نکات را خلاصه، دسته‌بندی و مرتب کن.',study:'از نکات یک جزوه آموزشی واضح و ساختارمند بساز.',quiz:'بر اساس نکات، سؤال‌های تمرینی مناسب بساز.',flashcards:'نکات را به فلش‌کارت پرسش و پاسخ تبدیل کن.'};$('#prompt').value=`تو یک دستیار آموزشی دقیق هستی.\n\nدرس: ${d.subject||'مشخص نشده'}\nعنوان جلسه: ${d.title||'مشخص نشده'}\n\nنکات کاربر:\n${d.notes||'(هنوز نکته‌ای وارد نشده)'}\n\nوظیفه: ${tasks[mode]}\nاطلاعات را بدون حذف نکات مهم، به زبان فارسی و با ساختاری خوانا ارائه کن.`}
$('#promptMode').onchange=buildPrompt;
$('#copyPrompt').onclick=async()=>{buildPrompt();try{await navigator.clipboard.writeText($('#prompt').value);toast('پرامپت در کلیپ‌بورد کپی شد')}catch{toast('کپی نشد؛ مرورگر اجازه نداد')}};
$$('.aiopen').forEach(b=>b.onclick=async()=>{buildPrompt();try{await navigator.clipboard.writeText($('#prompt').value);toast('پرامپت کپی شد؛ AI باز می‌شود')}catch{}window.open(b.dataset.url,'_blank')});
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function applyTheme(v){document.body.classList.remove('dark');if(v==='dark'||(v==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.body.classList.add('dark');$('#themeBtn span').textContent=document.body.classList.contains('dark')?'☾':'☀';store.set('theme',v)}
let theme=store.get('theme','system');$('#themeSelect').value=theme;applyTheme(theme);$('#themeSelect').onchange=e=>applyTheme(e.target.value);
$('#themeBtn').onclick=()=>{let n=document.body.classList.contains('dark')?'light':'dark';$('#themeSelect').value=n;applyTheme(n)};
let ac=store.get('accent','green');$('#accent').value=ac;function accent(v){document.body.classList.remove('accent-blue','accent-purple');if(v!=='green')document.body.classList.add('accent-'+v);store.set('accent',v)}accent(ac);$('#accent').onchange=e=>accent(e.target.value);
$('#autosave').checked=store.get('autosave',true);$('#autosave').onchange=e=>store.set('autosave',e.target.checked);
renderRecent();