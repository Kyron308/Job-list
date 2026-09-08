const STORAGE_KEY = 'jobTrackerApple.v1';

const sampleData = {
  jobs: [
    {
      id: crypto.randomUUID(),
      title: 'Example Job',
      customer: 'Demo Customer',
      status: 'In Progress',
      startDate: new Date().toISOString().slice(0,10),
      dueDate: '',
      location: 'Adelaide SA',
      notes: 'You can edit or delete this example job.',
      tasks: [
        { id: crypto.randomUUID(), text: 'Confirm site access', done: false },
        { id: crypto.randomUUID(), text: 'Order required parts', done: false }
      ],
      parts: [
        { id: crypto.randomUUID(), name: 'Example fitting', qty: 2, notes: 'Replace with real parts' }
      ],
      tools: [
        { id: crypto.randomUUID(), name: 'Drill', qty: 1, notes: '' }
      ]
    }
  ]
};

let state = loadState();
let currentView = 'jobs';
let calendarDate = new Date();
let editingJobId = null;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(sampleData);
  }catch{
    return structuredClone(sampleData);
  }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}
function fmtDate(d){
  if(!d) return '—';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
}
function esc(s=''){
  return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function statusClass(status){ return 'status-' + status.toLowerCase().replace(/\s+/g,'-'); }

function switchView(view){
  currentView = view;
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#' + view + 'View').classList.add('active');
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const meta = {
    jobs:['Jobs','Track active, upcoming and completed work.'],
    calendar:['Calendar','See jobs by start date and due date.'],
    tasks:['Tasks','Work through tasks across all jobs.'],
    lists:['Parts & Tools','Build and print a pick list for each job.']
  };
  $('#pageTitle').textContent = meta[view][0];
  $('#pageSubtitle').textContent = meta[view][1];
  $('#jobsToolbar').style.display = view==='jobs' ? '' : 'none';
  $('#sidebar').classList.remove('open');
  renderAll();
}

function renderJobs(){
  const q = $('#searchInput').value.toLowerCase().trim();
  const status = $('#statusFilter').value;
  const jobs = state.jobs.filter(j=>{
    const hay = [j.title,j.customer,j.location,j.notes].join(' ').toLowerCase();
    return (!q || hay.includes(q)) && (status==='all' || j.status===status);
  });
  $('#jobCards').innerHTML = jobs.map(j=>`
    <article class="job-card">
      <div class="card-top">
        <div>
          <h3>${esc(j.title)}</h3>
          <div class="customer">${esc(j.customer || 'No customer')}</div>
        </div>
        <div class="badge ${statusClass(j.status)}">${esc(j.status)}</div>
      </div>
      <div class="job-meta">
        <div><span>Location:</span> ${esc(j.location || '—')}</div>
        <div><span>Start:</span> ${fmtDate(j.startDate)}</div>
        <div><span>Due:</span> ${fmtDate(j.dueDate)}</div>
        <div><span>Tasks:</span> ${(j.tasks||[]).filter(t=>t.done).length}/${(j.tasks||[]).length} done</div>
        <div><span>Parts / Tools:</span> ${(j.parts||[]).length} / ${(j.tools||[]).length}</div>
      </div>
      <div class="card-actions">
        <button class="secondary" onclick="openListsForJob('${j.id}')">Parts & Tools</button>
        <button class="primary" onclick="editJob('${j.id}')">Edit</button>
      </div>
    </article>
  `).join('');
  $('#emptyJobs').classList.toggle('hidden',jobs.length>0);
}

function renderTaskFilter(){
  const select = $('#taskJobFilter');
  const current = select.value;
  select.innerHTML = '<option value="all">All jobs</option>' + state.jobs.map(j=>`<option value="${j.id}">${esc(j.title)}</option>`).join('');
  if([...select.options].some(o=>o.value===current)) select.value=current;
}
function renderTasks(){
  renderTaskFilter();
  const filter = $('#taskJobFilter').value;
  const rows = [];
  state.jobs.forEach(j=>{
    if(filter!=='all' && j.id!==filter) return;
    (j.tasks||[]).forEach(t=>rows.push({job:j,task:t}));
  });
  $('#taskList').innerHTML = rows.length ? rows.map(({job,task})=>`
    <label class="task-row ${task.done?'task-done':''}">
      <input type="checkbox" ${task.done?'checked':''} onchange="toggleTask('${job.id}','${task.id}',this.checked)">
      <div>
        <div class="task-text">${esc(task.text)}</div>
        <div class="task-job">${esc(job.title)}</div>
      </div>
      <button type="button" class="remove-btn" onclick="removeTask('${job.id}','${task.id}');event.preventDefault()">×</button>
    </label>
  `).join('') : '<div class="empty"><div class="empty-icon">✓</div><h3>No tasks</h3><p>Add tasks inside a job.</p></div>';
}

function toggleTask(jobId,taskId,done){
  const job=state.jobs.find(j=>j.id===jobId); if(!job)return;
  const task=job.tasks.find(t=>t.id===taskId); if(!task)return;
  task.done=done; saveState();
}
function removeTask(jobId,taskId){
  const job=state.jobs.find(j=>j.id===jobId); if(!job)return;
  job.tasks=job.tasks.filter(t=>t.id!==taskId); saveState();
}

function renderCalendar(){
  const y=calendarDate.getFullYear(), m=calendarDate.getMonth();
  $('#calendarTitle').textContent = calendarDate.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const first = new Date(y,m,1);
  const firstMondayIndex = (first.getDay()+6)%7;
  const start = new Date(y,m,1-firstMondayIndex);
  const today = new Date(); today.setHours(0,0,0,0);
  let html='';
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const iso = [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    const jobs=state.jobs.filter(j=>j.startDate===iso || j.dueDate===iso);
    const outside=d.getMonth()!==m;
    const isToday=d.getTime()===today.getTime();
    html += `<div class="day ${outside?'outside':''} ${isToday?'today':''}">
      <div class="day-number">${d.getDate()}</div>
      ${jobs.map(j=>`<div class="cal-job" onclick="editJob('${j.id}')" title="${esc(j.title)}">${j.dueDate===iso && j.startDate!==iso?'Due: ':''}${esc(j.title)}</div>`).join('')}
    </div>`;
  }
  $('#calendarGrid').innerHTML=html;
}

function renderListJobSelect(){
  const sel=$('#listJobSelect');
  const current=sel.value;
  if(!state.jobs.length){
    sel.innerHTML='<option value="">No jobs</option>'; return;
  }
  sel.innerHTML=state.jobs.map(j=>`<option value="${j.id}">${esc(j.title)}</option>`).join('');
  sel.value = state.jobs.some(j=>j.id===current) ? current : state.jobs[0].id;
}
function renderLists(){
  renderListJobSelect();
  const job=state.jobs.find(j=>j.id===$('#listJobSelect').value);
  const renderItems=(items,type)=>{
    if(!items?.length) return `<div class="empty" style="padding:28px 12px"><p>No ${type} added.</p></div>`;
    return items.map(i=>`
      <div class="list-item">
        <div class="qty">${i.qty || 1}</div>
        <div>
          <div class="item-name">${esc(i.name)}</div>
          <div class="item-notes">${esc(i.notes||'')}</div>
        </div>
        <button class="remove-btn" onclick="removeListItem('${job.id}','${type}','${i.id}')">×</button>
      </div>
    `).join('');
  };
  $('#partsList').innerHTML = job ? renderItems(job.parts,'parts') : '<div class="empty"><p>Add a job first.</p></div>';
  $('#toolsList').innerHTML = job ? renderItems(job.tools,'tools') : '<div class="empty"><p>Add a job first.</p></div>';
  buildPrintArea(job);
}
function buildPrintArea(job){
  $('#printJobMeta').innerHTML = job ? `
    <p><strong>Job:</strong> ${esc(job.title)}</p>
    <p><strong>Customer:</strong> ${esc(job.customer||'—')} &nbsp;&nbsp; <strong>Location:</strong> ${esc(job.location||'—')}</p>
    <p><strong>Start:</strong> ${fmtDate(job.startDate)} &nbsp;&nbsp; <strong>Due:</strong> ${fmtDate(job.dueDate)}</p>
  ` : '<p>No job selected</p>';
  const rows = items => (items||[]).map(i=>`<tr><td>${i.qty||1}</td><td>${esc(i.name)}</td><td>${esc(i.notes||'')}</td></tr>`).join('') || '<tr><td colspan="3">None</td></tr>';
  $('#printParts').innerHTML = rows(job?.parts);
  $('#printTools').innerHTML = rows(job?.tools);
}
function openListsForJob(id){
  switchView('lists');
  $('#listJobSelect').value=id;
  renderLists();
}
function removeListItem(jobId,type,itemId){
  const job=state.jobs.find(j=>j.id===jobId); if(!job)return;
  job[type]=job[type].filter(i=>i.id!==itemId); saveState();
}

function newJob(){
  editingJobId=null;
  $('#jobDialogTitle').textContent='New Job';
  $('#deleteJobBtn').classList.add('hidden');
  $('#jobForm').reset();
  $('#jobId').value='';
  $('#jobStatus').value='Planned';
  $('#startDate').value=new Date().toISOString().slice(0,10);
  $('#jobDialog').showModal();
}
function editJob(id){
  const j=state.jobs.find(x=>x.id===id); if(!j)return;
  editingJobId=id;
  $('#jobDialogTitle').textContent='Edit Job';
  $('#deleteJobBtn').classList.remove('hidden');
  $('#jobId').value=j.id;
  $('#jobTitle').value=j.title||'';
  $('#customer').value=j.customer||'';
  $('#jobStatus').value=j.status||'Planned';
  $('#startDate').value=j.startDate||'';
  $('#dueDate').value=j.dueDate||'';
  $('#location').value=j.location||'';
  $('#notes').value=j.notes||'';
  $('#tasks').value=(j.tasks||[]).map(t=>(t.done?'[x] ':'')+t.text).join('\n');
  $('#jobDialog').showModal();
}
function saveJob(){
  const title=$('#jobTitle').value.trim();
  if(!title){ $('#jobTitle').focus(); return false; }

  const parseTasks = text => text.split('\n').map(x=>x.trim()).filter(Boolean).map(line=>{
    const done=/^\[x\]\s*/i.test(line);
    return {id:crypto.randomUUID(),text:line.replace(/^\[[x ]\]\s*/i,''),done};
  });

  if(editingJobId){
    const j=state.jobs.find(x=>x.id===editingJobId);
    const oldByText=new Map((j.tasks||[]).map(t=>[t.text,t]));
    const parsed=parseTasks($('#tasks').value);
    j.tasks=parsed.map(t=>oldByText.has(t.text)?{...oldByText.get(t.text),done:t.done||oldByText.get(t.text).done}:t);
    Object.assign(j,{
      title,customer:$('#customer').value.trim(),status:$('#jobStatus').value,
      startDate:$('#startDate').value,dueDate:$('#dueDate').value,location:$('#location').value.trim(),
      notes:$('#notes').value.trim()
    });
  }else{
    state.jobs.unshift({
      id:crypto.randomUUID(),title,customer:$('#customer').value.trim(),status:$('#jobStatus').value,
      startDate:$('#startDate').value,dueDate:$('#dueDate').value,location:$('#location').value.trim(),
      notes:$('#notes').value.trim(),tasks:parseTasks($('#tasks').value),parts:[],tools:[]
    });
  }
  saveState(); return true;
}
function deleteJob(){
  if(!editingJobId)return;
  if(confirm('Delete this job and its tasks, parts and tools?')){
    state.jobs=state.jobs.filter(j=>j.id!==editingJobId);
    $('#jobDialog').close();
    saveState();
  }
}

function openItemDialog(type){
  if(!state.jobs.length){ alert('Add a job first.'); return; }
  $('#itemForm').reset();
  $('#itemQty').value=1;
  $('#itemType').value=type;
  $('#itemDialogTitle').textContent=type==='parts'?'Add Part':'Add Tool';
  $('#itemDialog').showModal();
}
function saveItem(){
  const job=state.jobs.find(j=>j.id===$('#listJobSelect').value);
  const type=$('#itemType').value;
  const name=$('#itemName').value.trim();
  if(!job || !name){ $('#itemName').focus(); return false; }
  job[type].push({id:crypto.randomUUID(),name,qty:Number($('#itemQty').value)||1,notes:$('#itemNotes').value.trim()});
  saveState(); return true;
}

function exportBackup(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='job-tracker-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); URL.revokeObjectURL(a.href);
}
function importBackup(file){
  const r=new FileReader();
  r.onload=()=>{
    try{
      const data=JSON.parse(r.result);
      if(!data || !Array.isArray(data.jobs)) throw new Error('Invalid backup');
      state=data; saveState(); alert('Backup imported.');
    }catch(e){ alert('Could not import this file.'); }
  };
  r.readAsText(file);
}

function renderAll(){
  renderJobs();
  renderTasks();
  renderCalendar();
  renderLists();
}

$$('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$('#newJobBtn').addEventListener('click',newJob);
$('#searchInput').addEventListener('input',renderJobs);
$('#statusFilter').addEventListener('change',renderJobs);
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#prevMonth').addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar()});
$('#nextMonth').addEventListener('click',()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar()});
$('#taskJobFilter').addEventListener('change',renderTasks);
$('#listJobSelect').addEventListener('change',renderLists);
$$('[data-add-item]').forEach(b=>b.addEventListener('click',()=>openItemDialog(b.dataset.addItem)));
$('#printListBtn').addEventListener('click',()=>window.print());
$('#exportBtn').addEventListener('click',exportBackup);
$('#importInput').addEventListener('change',e=>e.target.files[0]&&importBackup(e.target.files[0]));
$('#deleteJobBtn').addEventListener('click',deleteJob);

$('#jobForm').addEventListener('submit',e=>{
  const submitter=e.submitter;
  if(submitter?.value==='default'){
    e.preventDefault();
    if(saveJob()) $('#jobDialog').close();
  }
});
$('#itemForm').addEventListener('submit',e=>{
  if(e.submitter?.value==='default'){
    e.preventDefault();
    if(saveItem()) $('#itemDialog').close();
  }
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

renderAll();
