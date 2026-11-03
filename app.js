(()=>{
const $=id=>document.getElementById(id), rupiah=n=>'Rp'+Number(n||0).toLocaleString('id-ID'), today=()=>new Date().toISOString().slice(0,10);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem('diho_kupang_'+k))??d}catch{return d}}, save=(k,v)=>localStorage.setItem('diho_kupang_'+k,JSON.stringify(v));
let products=load('products',[]), transactions=load('transactions',[]), cart=[], settings=load('settings',{name:'DIHO KASIR KUPANG',address:''});
const persist=()=>{save('products',products);save('transactions',transactions);save('settings',settings)};
function page(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));if(id==='dashboard')dashboard();if(id==='produk')renderProducts();if(id==='kasir')renderCatalog();if(id==='transaksi')renderTransactions();if(id==='laporan')report()}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));window.page=page;
function productMatch(code){return products.find(p=>[p.upc,p.barcode,p.sku].some(x=>x&&String(x).toLowerCase()===String(code).trim().toLowerCase()))}
function addToCart(p){if(!p)return alert('Produk tidak ditemukan. Periksa UPC/barcode.');let line=cart.find(x=>x.id===p.id);if((line?.qty||0)>=p.stock)return alert('Stok tidak mencukupi.');if(line)line.qty++;else cart.push({id:p.id,name:p.name,price:p.price,cost:p.cost,qty:1});renderCart()}
function scanBeep(){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(1050,ctx.currentTime);gain.gain.setValueAtTime(0.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.18,ctx.currentTime+0.012);gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.16);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.17);osc.onended=()=>ctx.close()}catch(e){}}
function scanAdd(){let v=$('scan').value.trim();if(!v)return;let p=productMatch(v);if(p){scanBeep();addToCart(p)}else addToCart(null);$('scan').value='';$('scan').focus()}
$('addScan').onclick=scanAdd;$('scan').addEventListener('keydown',e=>{if(e.key==='Enter')scanAdd()});
function scanFromField(id){let value=$(id).value.trim();if(!value)return;$('scan').value=value;scanAdd();$(id).value=''}
$('addUPC').onclick=()=>scanFromField('scanUPC');$('addBarcode').onclick=()=>scanFromField('scanBarcode');
$('scanUPC').addEventListener('keydown',e=>{if(e.key==='Enter')scanFromField('scanUPC')});$('scanBarcode').addEventListener('keydown',e=>{if(e.key==='Enter')scanFromField('scanBarcode')});
function renderCatalog(){let q=$('searchProduct').value.toLowerCase();$('productGrid').innerHTML=products.filter(p=>(p.name+' '+p.upc+' '+p.barcode+' '+p.sku).toLowerCase().includes(q)).map(p=>`<button class="product" data-id="${p.id}" ${p.stock<=0?'disabled':''}><b>${esc(p.name)}</b><small>${esc(p.upc||p.barcode||p.sku||'Tanpa kode')}</small><div>${rupiah(p.price)} · Stok ${p.stock}</div></button>`).join('')||'<div class="empty">Produk belum tersedia</div>';document.querySelectorAll('.product[data-id]').forEach(b=>b.onclick=()=>addToCart(products.find(p=>p.id===b.dataset.id)))}
$('searchProduct').oninput=renderCatalog;
function renderCart(){let el=$('cart');if(!cart.length)el.innerHTML='<div class="empty">Belum ada barang</div>';else el.innerHTML=cart.map(x=>`<div class="cartline"><div><b>${esc(x.name)}</b><small>${rupiah(x.price)} × ${x.qty}</small></div><div class="row" style="flex:0 0 auto"><button class="secondary" data-minus="${x.id}">−</button><b>${x.qty}</b><button class="secondary" data-plus="${x.id}">+</button><button class="danger" data-del="${x.id}">×</button></div></div>`).join('');
el.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{let x=cart.find(i=>i.id===b.dataset.minus);x.qty--;if(x.qty<=0)cart=cart.filter(i=>i!==x);renderCart()});el.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{let x=cart.find(i=>i.id===b.dataset.plus),p=products.find(i=>i.id===x.id);if(x.qty<p.stock)x.qty++;else alert('Stok tidak mencukupi');renderCart()});el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{cart=cart.filter(i=>i.id!==b.dataset.del);renderCart()});let sub=cart.reduce((s,x)=>s+x.price*x.qty,0),disc=Math.max(0,Number($('discount').value)||0),total=Math.max(0,sub-disc);$('subtotal').textContent=rupiah(sub);$('grandTotal').textContent=rupiah(total);updateChange()}
function updateChange(){let sub=cart.reduce((s,x)=>s+x.price*x.qty,0),total=Math.max(0,sub-Math.max(0,Number($('discount').value)||0));$('change').textContent=rupiah(Math.max(0,(Number($('paid').value)||0)-total))}
$('discount').oninput=renderCart;$('paid').oninput=updateChange;
$('checkoutBtn').onclick=()=>{if(!cart.length)return alert('Keranjang masih kosong.');let sub=cart.reduce((s,x)=>s+x.price*x.qty,0),disc=Math.max(0,Number($('discount').value)||0);if(disc>sub)return alert('Diskon tidak boleh melebihi subtotal.');let total=sub-disc,method=$('payMethod').value,paid=Number($('paid').value)||0;if(paid<total)return alert('Uang diterima belum mencukupi. Untuk metode non-tunai, masukkan nominal yang sudah terkonfirmasi.');for(let x of cart){let p=products.find(p=>p.id===x.id);if(!p||p.stock<x.qty)return alert('Stok berubah/tidak cukup untuk '+x.name)}cart.forEach(x=>{let p=products.find(p=>p.id===x.id);p.stock-=x.qty});let tx={id:'DHO-'+Date.now(),date:new Date().toISOString(),items:cart.map(x=>({...x})),subtotal:sub,discount:disc,total,paid,change:paid-total,method};transactions.unshift(tx);persist();printReceipt(tx);cart=[];$('discount').value=0;$('paid').value='';renderCart();renderCatalog();dashboard();alert('Transaksi berhasil disimpan.');};
function printReceipt(t){let html=`<div class="receipt"><h2>${esc(settings.name)}</h2><div style="text-align:center">${esc(settings.address||'Terima kasih telah berbelanja')}</div><hr>${t.id}<br>${new Date(t.date).toLocaleString('id-ID')}<hr>${t.items.map(x=>`${esc(x.name)}<br>${x.qty} x ${rupiah(x.price)} <span style="float:right">${rupiah(x.qty*x.price)}</span>`).join('<br>')}<hr>Subtotal: ${rupiah(t.subtotal)}<br>Diskon: ${rupiah(t.discount)}<br><b>TOTAL: ${rupiah(t.total)}</b><br>Bayar: ${rupiah(t.paid)}<br>Kembali: ${rupiah(t.change)}<br>Metode: ${esc(t.method)}<hr><center>Terima kasih</center><p><button onclick="window.print()">Cetak struk</button></p></div>`;$('receiptPrint').innerHTML=html;$('receiptPrint').classList.remove('hidden');setTimeout(()=>$('receiptPrint').classList.add('hidden'),1000)}
function renderProducts(){let q=$('productFilter').value.toLowerCase();$('productRows').innerHTML=products.filter(p=>(p.name+' '+p.upc+' '+p.barcode+' '+p.sku).toLowerCase().includes(q)).map(p=>`<tr><td>${esc(p.name)}<br><small>${esc(p.category||'')}</small></td><td>${esc(p.upc||'-')}</td><td>${esc(p.barcode||'-')}</td><td>${rupiah(p.price)}</td><td>${p.stock}</td><td><button class="secondary" data-edit="${p.id}">Edit</button> <button class="danger" data-remove="${p.id}">Hapus</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Belum ada produk</td></tr>';document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(confirm('Hapus produk ini?')){products=products.filter(p=>p.id!==b.dataset.remove);persist();renderProducts();dashboard()}})}
$('productFilter').oninput=renderProducts;
function resetProduct(){['editId','pName','pUpc','pBarcode','pSku','pCategory','pImage'].forEach(id=>$(id).value='');['pCost','pPrice','pStock'].forEach(id=>$(id).value=0);$('pMin').value=5}
function editProduct(id){let p=products.find(p=>p.id===id);if(!p)return;$('editId').value=p.id;$('pName').value=p.name;$('pUpc').value=p.upc;$('pBarcode').value=p.barcode;$('pSku').value=p.sku;$('pCategory').value=p.category;$('pCost').value=p.cost;$('pPrice').value=p.price;$('pStock').value=p.stock;$('pMin').value=p.min}
$('resetProduct').onclick=resetProduct;
$('saveProduct').onclick=()=>{let name=$('pName').value.trim(),price=Number($('pPrice').value),id=$('editId').value;if(!name||price<0||!Number.isFinite(price))return alert('Nama barang dan harga jual wajib diisi dengan benar.');let codes=[$('pUpc').value.trim(),$('pBarcode').value.trim(),$('pSku').value.trim()].filter(Boolean);if(new Set(codes).size!==codes.length)return alert('UPC, barcode, dan SKU harus berbeda.');let duplicate=products.find(p=>p.id!==id&&codes.some(c=>[p.upc,p.barcode,p.sku].includes(c)));if(duplicate)return alert('Kode UPC/barcode/SKU sudah dipakai produk lain.');let old=products.find(p=>p.id===id),p={id:id||crypto.randomUUID(),name,upc:$('pUpc').value.trim(),barcode:$('pBarcode').value.trim(),sku:$('pSku').value.trim(),category:$('pCategory').value.trim(),cost:Number($('pCost').value)||0,price,stock:Math.max(0,Number($('pStock').value)||0),min:Math.max(0,Number($('pMin').value)||0),image:old?.image||''};let file=$('pImage').files[0];let commit=()=>{if(id)products=products.map(x=>x.id===id?p:x);else products.push(p);persist();resetProduct();renderProducts();renderCatalog();dashboard();alert('Produk tersimpan.')};if(file){let r=new FileReader();r.onload=()=>{p.image=r.result;commit()};r.readAsDataURL(file)}else commit()};
function renderTransactions(){let q=$('txSearch').value.toLowerCase(),d=$('txDate').value;$('txRows').innerHTML=transactions.filter(t=>t.id.toLowerCase().includes(q)&&(!d||t.date.slice(0,10)===d)).map(t=>`<tr><td>${t.id}</td><td>${new Date(t.date).toLocaleString('id-ID')}</td><td>${esc(t.method)}</td><td>${rupiah(t.total)}</td><td><button class="secondary" data-detail="${t.id}">Detail</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Belum ada transaksi</td></tr>';document.querySelectorAll('[data-detail]').forEach(b=>b.onclick=()=>{let t=transactions.find(x=>x.id===b.dataset.detail);alert(t.items.map(x=>`${x.name} × ${x.qty} = ${rupiah(x.price*x.qty)}`).join('\\n')+`\\nTOTAL ${rupiah(t.total)}`)})}
$('txSearch').oninput=renderTransactions;$('txDate').onchange=renderTransactions;
function rangeTx(){let from=$('reportFrom').value||'0000-01-01',to=$('reportTo').value||'9999-12-31';return transactions.filter(t=>t.date.slice(0,10)>=from&&t.date.slice(0,10)<=to)}
function report(){if(!$('reportFrom').value)$('reportFrom').value=today();if(!$('reportTo').value)$('reportTo').value=today();let ts=rangeTx(),sales=ts.reduce((s,t)=>s+t.total,0),profit=ts.reduce((s,t)=>s+t.items.reduce((a,x)=>a+(x.price-x.cost)*x.qty,0)-t.discount,0);$('rSales').textContent=rupiah(sales);$('rProfit').textContent=rupiah(profit);$('rCount').textContent=ts.length;let map={};ts.forEach(t=>t.items.forEach(x=>map[x.name]=(map[x.name]||0)+x.qty));$('topProducts').innerHTML=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([n,q])=>`<div class="cartline"><span>${esc(n)}</span><b>${q} terjual</b></div>`).join('')||'<div class="empty">Belum ada penjualan</div>'}
$('runReport').onclick=report;
$('exportCsv').onclick=()=>{let rows=[['No transaksi','Tanggal','Produk','Qty','Harga','Total transaksi']];rangeTx().forEach(t=>t.items.forEach(x=>rows.push([t.id,t.date,x.name,x.qty,x.price,t.total])));download('laporan-diho.csv',rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\\n'),'text/csv')};
function dashboard(){let ts=transactions.filter(t=>t.date.slice(0,10)===today()),low=products.filter(p=>p.stock<=p.min);$('dSales').textContent=rupiah(ts.reduce((s,t)=>s+t.total,0));$('dCount').textContent=ts.length;$('dProducts').textContent=products.length;$('dLow').textContent=low.length;$('recent').innerHTML=transactions.slice(0,5).map(t=>`<div class="cartline"><span>${t.id}<small>${new Date(t.date).toLocaleString('id-ID')}</small></span><b>${rupiah(t.total)}</b></div>`).join('')||'<div class="empty">Belum ada transaksi</div>';$('lowList').innerHTML=low.slice(0,8).map(p=>`<div class="cartline"><span>${esc(p.name)}</span><b>${p.stock} tersisa</b></div>`).join('')||'<div class="success">Stok aman</div>'}
function download(name,data,type){let a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
$('backupBtn').onclick=()=>download('backup-diho-kupang-'+today()+'.json',JSON.stringify({products,transactions,settings,version:1},null,2),'application/json');
$('restoreBtn').onclick=()=>{let f=$('restoreFile').files[0];if(!f)return alert('Pilih file backup JSON.');let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);if(!Array.isArray(d.products)||!Array.isArray(d.transactions))throw Error();if(!confirm('Data saat ini akan diganti dengan isi backup. Lanjutkan?'))return;products=d.products;transactions=d.transactions;settings=d.settings||settings;persist();dashboard();renderProducts();renderTransactions();alert('Backup berhasil dipulihkan.')}catch{alert('File backup tidak valid.')}};r.readAsText(f)};
$('saveSettings').onclick=()=>{settings.name=$('storeName').value.trim()||'DIHO KASIR KUPANG';settings.address=$('storeAddress').value.trim();persist();alert('Identitas toko disimpan.')};
$('demoBtn').onclick=()=>{let samples=[['Air Mineral 600ml','8990000000011','473',5000,3000,20],['Mi Instan','8990000000012','474',3500,2500,30],['Biskuit Cokelat','8990000000013','475',7000,4500,12]];samples.forEach(s=>{if(!productMatch(s[1])&&!productMatch(s[2]))products.push({id:crypto.randomUUID(),name:s[0],upc:s[1],barcode:s[2],sku:'',category:'Contoh',price:s[3],cost:s[4],stock:s[5],min:5})});persist();renderProducts();renderCatalog();dashboard();alert('Produk contoh ditambahkan.')};
$('clearBtn').onclick=()=>{if(confirm('Hapus seluruh produk dan transaksi dari perangkat ini? Tindakan tidak bisa dibatalkan.')){products=[];transactions=[];cart=[];persist();renderProducts();renderCart();dashboard();renderTransactions()}};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('storeName').value=settings.name;$('storeAddress').value=settings.address;renderCart();dashboard();renderProducts();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
window.addEventListener('online',()=>$('netState').textContent='● Online');window.addEventListener('offline',()=>$('netState').textContent='● Offline');
// Tambahan pemindai barcode melalui kamera Android. Fitur lama tetap dipertahankan.
let barcodeStream=null, barcodeRunning=false, barcodeDetector=null, barcodeFrame=null;
async function stopBarcodeCamera(){
  barcodeRunning=false;
  if(barcodeFrame)cancelAnimationFrame(barcodeFrame);
  barcodeFrame=null;
  if(barcodeStream){barcodeStream.getTracks().forEach(t=>t.stop());barcodeStream=null;}
  const video=$('barcodeVideo'); if(video)video.srcObject=null;
  $('cameraPanel').classList.add('hidden');
}
async function startBarcodeCamera(){
  if(!('BarcodeDetector' in window)){
    alert('Pemindai kamera belum didukung browser ini. Gunakan Chrome Android terbaru atau scanner Bluetooth/USB yang mengetik kode ke kolom barcode.');
    return;
  }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    alert('Kamera memerlukan koneksi HTTPS. Buka DIHO melalui alamat GitHub Pages HTTPS.');
    return;
  }
  try{
    const formats=['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf','codabar'];
    let supported=formats;
    if(BarcodeDetector.getSupportedFormats){
      const available=await BarcodeDetector.getSupportedFormats();
      supported=formats.filter(f=>available.includes(f));
    }
    if(!supported.length){alert('Browser tidak mendukung format barcode yang umum.');return;}
    barcodeDetector=new BarcodeDetector({formats:supported});
    barcodeStream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'}}});
    const video=$('barcodeVideo');video.srcObject=barcodeStream;
    $('cameraPanel').classList.remove('hidden');
    $('cameraStatus').textContent='Arahkan barcode ke dalam kotak kamera.';
    await video.play();barcodeRunning=true;
    const scanFrame=async()=>{
      if(!barcodeRunning)return;
      try{
        if(video.readyState>=2){
          const codes=await barcodeDetector.detect(video);
          if(codes && codes.length && codes[0].rawValue){
            const value=codes[0].rawValue.trim();
            $('scan').value=value;
            await stopBarcodeCamera();
            scanAdd();
            return;
          }
        }
      }catch(err){}
      if(barcodeRunning)barcodeFrame=requestAnimationFrame(scanFrame);
    };
    scanFrame();
  }catch(err){
    await stopBarcodeCamera();
    alert('Tidak bisa membuka kamera. Izinkan akses kamera untuk Chrome dan pastikan kamera tidak sedang digunakan aplikasi lain.');
  }
}
$('cameraScanBtn').addEventListener('click',startBarcodeCamera);
$('stopCameraBtn').addEventListener('click',stopBarcodeCamera);
if($('cameraCloseText'))$('cameraCloseText').addEventListener('click',stopBarcodeCamera);
document.addEventListener('visibilitychange',()=>{if(document.hidden && barcodeRunning)stopBarcodeCamera()});


// DIHO feature-specific animation + synthesized sound effects (no external audio files).
const soundPref = localStorage.getItem('diho_sound_enabled');
let soundEnabled = soundPref !== 'false';
const soundButton = $('soundToggle');
function syncSoundButton(){if(!soundButton)return;soundButton.setAttribute('aria-pressed',String(soundEnabled));soundButton.textContent=soundEnabled?'🔊 Suara':'🔇 Suara mati'}
syncSoundButton();
soundButton?.addEventListener('click',()=>{soundEnabled=!soundEnabled;localStorage.setItem('diho_sound_enabled',String(soundEnabled));syncSoundButton();if(soundEnabled)playTone('toggle')});
function playTone(kind='click'){
 if(!soundEnabled)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const ctx=new AC(), now=ctx.currentTime;
  const notes=kind==='success'?[660,880,1175]:kind==='scan'?[1050,1450]:kind==='error'?[220,165]:kind==='toggle'?[740]:[kind==='add'?520:430];
  notes.forEach((freq,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind==='success'?'sine':'triangle';osc.frequency.setValueAtTime(freq,now+i*.09);gain.gain.setValueAtTime(.0001,now+i*.09);gain.gain.exponentialRampToValueAtTime(kind==='success'?.12:.065,now+i*.09+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.09+.13);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+i*.09);osc.stop(now+i*.09+.14);});
  setTimeout(()=>ctx.close().catch(()=>{}),650);
 }catch(e){}
}
let toastTimer;
function fxToast(message){const t=$('fxToast');if(!t)return;t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
function fxRipple(el){if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=el.getBoundingClientRect(),node=document.createElement('span');node.className='fx-ripple';node.style.left=(r.left+r.width/2-6)+'px';node.style.top=(r.top+r.height/2-6)+'px';document.body.appendChild(node);setTimeout(()=>node.remove(),600)}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.id==='soundToggle')return;
 fxRipple(b);
 if(b.id==='checkoutBtn')return;
 if(b.id==='addUPC'||b.id==='addBarcode'||b.id==='cameraScanBtn')playTone('scan');
 else if(b.id==='saveProduct'||b.id==='backupBtn'||b.id==='restoreBtn'||b.id==='saveSettings')playTone('success');
 else playTone('click');
});
const originalAddToCart=addToCart;
addToCart=function(p){if(p){playTone('add');fxToast('🛍️ '+p.name+' ditambahkan');}return originalAddToCart(p)};
const originalPage=page;
page=function(id){originalPage(id);const labels={dashboard:'Beranda',produk:'Barang & Stok',kasir:'Kasir',transaksi:'Riwayat transaksi',laporan:'Laporan',pengaturan:'Pengaturan'};if(labels[id])fxToast('✨ '+labels[id]);};
window.page=page;
const originalCheckout=$('checkoutBtn').onclick;
$('checkoutBtn').onclick=function(){const before=transactions.length;originalCheckout();if(transactions.length>before){playTone('success');$('kasir').classList.add('fx-success');setTimeout(()=>$('kasir').classList.remove('fx-success'),650);fxToast('🎉 Transaksi berhasil!')}};

})();
