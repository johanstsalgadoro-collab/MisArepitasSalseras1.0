/* Administrador estático para GitHub Pages: el token JAMÁS se guarda ni se publica. */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const money = (price) => '$' + Number(price || 0).toLocaleString('es-CO');
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, value => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[value]));
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const dataPath = 'data/menu.json';
  const state = {data:null,mode:null,owner:'',repo:'',branch:'main',token:'',sha:'',dirty:false,editing:null,saving:false};
  let toastTimeout;

  function toast(message,isError=false) {
    const el=$('#toast');
    el.textContent=message;el.classList.toggle('error',isError);el.classList.add('is-visible');
    clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('is-visible'),5500);
  }
  function status(text,variant='') {
    $('#connection-status').textContent=text;
    $('#connection-status').className=`status ${variant}`;
  }
  function setDirty() {
    state.dirty=true;
    $('#changes-indicator').textContent='Cambios sin publicar';
    $('#save-hint').textContent=state.mode==='github'?'Guárdalos en GitHub para actualizar la web.':'Descarga el JSON para conservarlos.';
    $('#save-github').disabled=state.mode!=='github' || state.saving;
  }
  function clearDirty() {
    state.dirty=false;
    $('#changes-indicator').textContent='Todos los cambios guardados';
    $('#save-hint').textContent=state.mode==='github'?'La carta está sincronizada con tu repositorio.':'Puedes editar y descargar un nuevo archivo JSON.';
    $('#save-github').disabled=true;
  }
  function validateData(data) {
    if(!data || !Array.isArray(data.categories) || !Array.isArray(data.products))throw new Error('El archivo no tiene el formato de menú esperado.');
    if(data.products.some(p=>!p || typeof p.id!=='string' || !p.id || !Number.isFinite(Number(p.price))))throw new Error('Hay productos con datos inválidos en el archivo.');
    return data;
  }
  function fillSelects() {
    $('#admin-category').innerHTML='<option value="all">Todas las categorías</option>';
    $('#edit-category').innerHTML='';
    for(const item of state.data.categories){
      const option=document.createElement('option');option.value=item.id;option.textContent=item.label;
      $('#admin-category').append(option);
      $('#edit-category').append(option.cloneNode(true));
    }
  }
  function showEditor() {
    $('#editor-section').hidden=false;
    $('#editor-subtitle').textContent=state.mode==='github'?
      `Conectado a ${state.owner}/${state.repo} · ${state.branch}`:'Modo local: descarga tu JSON para aplicar cambios.';
    $('#save-github').textContent=state.mode==='github'?'Publicar cambios en GitHub':'Conecta GitHub para publicar';
    clearDirty();fillSelects();renderTable();
    $('#editor-section').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function getCategories() {return new Map(state.data.categories.map(item=>[item.id,item.label]));}
  function renderTable() {
    if(!state.data)return;
    const query=normalize($('#admin-search').value.trim());
    const category=$('#admin-category').value;
    const filtered=state.data.products.filter(p=>(category==='all'||p.category===category) &&
      (!query||normalize(`${p.name} ${p.description}`).includes(query)));
    const categories=getCategories();
    $('#product-table').innerHTML=filtered.map(p=>`<tr>
      <td><span class="prod-name">${safe(p.name)}</span><span class="prod-desc">${safe(p.description)}</span></td>
      <td>${safe(categories.get(p.category) || 'Sin categoría')}</td>
      <td><span class="prod-price">${money(p.price)}</span></td>
      <td><span class="tag ${p.active===false?'hidden':''}">${p.active===false?'Oculto':'Visible'}</span></td>
      <td><div class="row-actions"><button type="button" class="mini-button" data-edit="${safe(p.id)}">Editar</button><button type="button" class="mini-button" data-toggle="${safe(p.id)}">${p.active===false?'Mostrar':'Ocultar'}</button><button type="button" class="mini-button danger" data-delete="${safe(p.id)}">Eliminar</button></div></td>
    </tr>`).join('') || '<tr><td colspan="5">No hay productos que coincidan con la búsqueda.</td></tr>';
    $('#table-count').textContent=`${filtered.length} de ${state.data.products.length} productos`;
  }
  function showModal(product=null) {
    state.editing=product?.id || null;
    $('#modal-title').textContent=product?'Editar producto':'Nuevo producto';
    $('#edit-form').reset();
    $('#edit-id').value=product?.id||'';
    $('#edit-name').value=product?.name||'';
    $('#edit-category').value=product?.category||state.data.categories[0].id;
    $('#edit-price').value=product?.price ?? '';
    $('#edit-description').value=product?.description||'';
    $('#edit-featured').checked=Boolean(product?.featured);
    $('#edit-active').checked=product?.active!==false;
    $('#edit-modal').showModal();
    $('#edit-name').focus();
  }
  function slug(text) {
    return normalize(text).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75)||'producto';
  }
  function saveProduct(event) {
    event.preventDefault();
    const name=$('#edit-name').value.trim();
    const category=$('#edit-category').value;
    const price=Number($('#edit-price').value);
    if(!name || !state.data.categories.some(item=>item.id===category) || !Number.isInteger(price) || price<0 || price>9999999){toast('Revisa el nombre, la categoría y el precio.',true);return;}
    let id=state.editing;
    if(!id){
      const base=slug(name);id=base;let n=2;
      while(state.data.products.some(p=>p.id===id))id=`${base}-${n++}`;
    }
    const product={id,name,category,price,description:$('#edit-description').value.trim(),featured:$('#edit-featured').checked,active:$('#edit-active').checked};
    if(state.editing){const index=state.data.products.findIndex(p=>p.id===id);if(index<0){toast('No encontramos el producto.',true);return;}state.data.products[index]={...state.data.products[index],...product};}
    else state.data.products.push(product);
    $('#edit-modal').close();setDirty();renderTable();toast(`«${name}» guardado en el editor.`);
  }

  async function api(path,options={}) {
    const url=`https://api.github.com/repos/${encodeURIComponent(state.owner)}/${encodeURIComponent(state.repo)}/contents/${path}${options.ref?`?ref=${encodeURIComponent(state.branch)}`:''}`;
    const response=await fetch(url,{
      method:options.method||'GET',
      headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Authorization':`Bearer ${state.token}`,...(options.method?{'Content-Type':'application/json'}:{})},
      ...(options.body?{body:JSON.stringify(options.body)}:{})
    });
    let body;
    try{body=await response.json();}catch(_){body={};}
    if(!response.ok){
      let message=body?.message||`Error HTTP ${response.status}`;
      if(response.status===401)message='Token inválido o vencido.';
      if(response.status===403)message='Acceso denegado. Revisa el permiso Contents (lectura y escritura), la aprobación del token y la cuenta.';
      if(response.status===404)message=`No se encontró ${path} en este repositorio o la rama indicada, o el token no puede acceder.`;
      if(response.status===409)message='Hubo otro cambio en GitHub. Vuelve a cargar la carta antes de publicar.';
      throw new Error(message);
    }
    return body;
  }
  function decodeBase64(content) {
    const bytes=Uint8Array.from(atob(content.replace(/\s/g,'')),char=>char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }
  function encodeBase64(text) {
    const bytes=new TextEncoder().encode(text);
    let binary='';
    for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(binary);
  }
  async function connect(event) {
    event.preventDefault();
    const owner=$('#repo-owner').value.trim(),repo=$('#repo-name').value.trim(),branch=$('#repo-branch').value.trim(),token=$('#github-token').value.trim();
    if(!/^[a-zA-Z0-9-]+$/.test(owner)||!/^[a-zA-Z0-9._-]+$/.test(repo)||!branch||!token){toast('Revisa los datos de conexión.',true);return;}
    if(state.dirty && !confirm('Hay cambios sin publicar. ¿Deseas descartarlos al volver a cargar?'))return;
    state.owner=owner;state.repo=repo;state.branch=branch;state.token=token;
    $('#github-token').value='';
    const button=$('#connect-button');button.disabled=true;button.textContent='Conectando...';
    try{
      const file=await api(dataPath,{ref:true});
      if(!file.sha || !file.content)throw new Error('GitHub no devolvió el contenido del archivo.');
      state.data=validateData(JSON.parse(decodeBase64(file.content)));
      state.sha=file.sha;state.mode='github';status('Conectado','connected');showEditor();toast('Carta cargada desde GitHub.');
    }catch(error){state.token='';status('Sin conexión');toast(error.message,true);}
    finally{button.disabled=false;button.textContent='Conectar y cargar';}
  }
  async function loadLocal() {
    if(state.dirty && !confirm('Hay cambios sin guardar. ¿Quieres cargar nuevamente el archivo original?'))return;
    try {
      const response=await fetch(dataPath,{cache:'no-store'});
      if(!response.ok)throw new Error('No se pudo abrir el JSON local.');
      state.data=validateData(await response.json());state.mode='local';state.token='';state.sha='';status('Modo local','local');showEditor();toast('Menú local listo para editar.');
    }catch(error){toast(`${error.message} Abre el proyecto usando un servidor local.`,true);}
  }
  async function publish() {
    if(state.mode!=='github'||!state.dirty||state.saving)return;
    state.saving=true;
    const button=$('#save-github');button.disabled=true;button.textContent='Publicando...';
    try {
      state.data.updatedAt=new Date().toISOString().slice(0,10);
      const json=JSON.stringify(state.data,null,2)+'\n';
      const result=await api(dataPath,{method:'PUT',body:{message:`Actualizar precios y productos del menú (${state.data.updatedAt})`,content:encodeBase64(json),sha:state.sha,branch:state.branch}});
      if(!result?.content?.sha)throw new Error('GitHub no confirmó el nuevo archivo.');
      state.sha=result.content.sha;clearDirty();toast('Cambios guardados en GitHub. GitHub Pages puede tardar unos minutos en reflejarlos.');
    }catch(error){toast(`No fue posible publicar: ${error.message}`,true);}
    finally{state.saving=false;button.textContent='Publicar cambios en GitHub';button.disabled=!state.dirty;}
  }
  function downloadJson() {
    state.data.updatedAt=new Date().toISOString().slice(0,10);
    const json=JSON.stringify(state.data,null,2)+'\n';
    const url=URL.createObjectURL(new Blob([json],{type:'application/json;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='menu.json';document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Archivo menu.json descargado. Reemplázalo en data/menu.json.');
  }

  $('#github-form').addEventListener('submit',connect);
  $('#demo-button').addEventListener('click',loadLocal);
  $('#save-github').addEventListener('click',publish);
  $('#download-json').addEventListener('click',downloadJson);
  $('#new-product').addEventListener('click',()=>showModal());
  $('#admin-search').addEventListener('input',renderTable);
  $('#admin-category').addEventListener('change',renderTable);
  $('#edit-form').addEventListener('submit',saveProduct);
  $('#close-modal').addEventListener('click',()=>$('#edit-modal').close());
  $('#cancel-modal').addEventListener('click',()=>$('#edit-modal').close());
  $('#edit-modal').addEventListener('click',event=>{if(event.target===$('#edit-modal'))$('#edit-modal').close();});
  $('#product-table').addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    const id=button.dataset.edit||button.dataset.toggle||button.dataset.delete;
    const product=state.data.products.find(p=>p.id===id);if(!product)return;
    if(button.hasAttribute('data-edit'))showModal(product);
    if(button.hasAttribute('data-toggle')){product.active=product.active===false;setDirty();renderTable();}
    if(button.hasAttribute('data-delete') && confirm(`¿Eliminar «${product.name}» del menú? Este cambio aún se podrá descartar mientras no lo publiques.`)){
      state.data.products=state.data.products.filter(p=>p.id!==id);setDirty();renderTable();toast('Producto eliminado del editor.');
    }
  });
  window.addEventListener('beforeunload',event=>{if(state.dirty){event.preventDefault();event.returnValue='';}});
})();
