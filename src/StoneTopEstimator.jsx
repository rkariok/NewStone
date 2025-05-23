import React, { useState, useEffect } from 'react';

// Helper function to generate layout for a single slab
const generateSlabLayout = (pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth) => {
  const pieceWidth = pieces[0].width;
  const pieceHeight = pieces[0].depth;
  const kerf = includeKerf ? kerfWidth : 0;

  // Placeholder simple layout; replace with full algorithm as needed
  return pieces.map((piece, index) => ({
    ...piece,
    position: index + 1,
    slabPosition: { x: 0, y: 0 }
  }));
};

// Layout Export Controls Component
const LayoutExportControls = ({ allResults, products, stoneOptions, includeKerf, kerfWidth }) => {
  const [exportFormat, setExportFormat] = useState('image');
  const [includeDetails, setIncludeDetails] = useState(true);

  const exportLayoutAsImage = () => {
    const exportWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!exportWindow) {
      alert('Please allow popups for layout export');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Stone Layout Export - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .slab-container { margin-bottom: 40px; page-break-inside: avoid; }
            .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Stone Layout Plan</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Mode: ${includeKerf ? `Production (${kerfWidth}\" kerf)` : 'Theoretical (no kerf)'} </p>
          </div>
        </body>
      </html>
    `;
    exportWindow.document.write(htmlContent);

    allResults.forEach((product, productIndex) => {
      if (!product.result) return;
      exportWindow.document.body.insertAdjacentHTML('beforeend', `
        <div class="slab-container">
          <h2>Product ${productIndex + 1}: ${product.stone} (${product.width}×${product.depth})</h2>
          <div class="summary">
            <strong>Quantity:</strong> ${product.quantity} pieces |
            <strong>Slabs Needed:</strong> ${product.result.totalSlabsNeeded} |
            <strong>Efficiency:</strong> ${product.result.efficiency.toFixed(1)}%
          </div>
        </div>
      `);
    });

    exportWindow.document.body.insertAdjacentHTML('beforeend', `
      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">Print Layout</button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">Close</button>
      </div>
    `);

    exportWindow.document.close();
  };

  const generateCutList = () => {
    let cutListContent = `STONE CUT LIST - ${new Date().toLocaleDateString()}\n`;
    cutListContent += `Mode: ${includeKerf ? `Production (${kerfWidth}\" kerf)` : 'Theoretical (no kerf)'}\n`;
    cutListContent += '='.repeat(60) + '\n\n';

    allResults.forEach((product, productIndex) => {
      if (!product.result) return;
      cutListContent += `PRODUCT ${productIndex + 1}: ${product.stone}\n`;
      cutListContent += `Size: ${product.width}\" × ${product.depth}\"\n`;
      cutListContent += `Quantity: ${product.quantity} pieces\n`;
      cutListContent += `Slabs Required: ${product.result.totalSlabsNeeded}\n`;
      cutListContent += `Pieces per Slab: ${product.result.topsPerSlab}\n`;
      cutListContent += `Efficiency: ${product.result.efficiency.toFixed(1)}%\n\n`;
      cutListContent += '-'.repeat(40) + '\n\n';
    });

    const blob = new Blob([cutListContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stone_cut_list_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareLayoutURL = () => {
    const layoutData = { products: products.filter(p => p.result), settings: { includeKerf, kerfWidth }, timestamp: new Date().toISOString() };
    const encodedData = btoa(JSON.stringify(layoutData));
    const shareURL = `${window.location.origin}${window.location.pathname}?layout=${encodedData}`;
    navigator.clipboard.writeText(shareURL).then(() => alert('Layout URL copied!')).catch(() => alert('Failed to copy URL'));  
  };

  if (!allResults || allResults.length === 0) return null;

  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
      <h4 className="font-semibold text-blue-800">Export & Share Layout</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={exportLayoutAsImage} className="px-4 py-3 bg-blue-600 text-white rounded">Export Visual Layout</button>
        <button onClick={generateCutList} className="px-4 py-3 bg-green-600 text-white rounded">Download Cut List</button>
        <button onClick={shareLayoutURL} className="px-4 py-3 bg-purple-600 text-white rounded">Share Layout URL</button>
      </div>
    </div>
  );
};

// Slab Visualization
const SlabLayoutVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;
  const kerf = includeKerf ? kerfWidth : 0;
  const layoutPieces = generateSlabLayout(pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth);
  const containerWidth = 400, containerHeight = 250;
  const scale = Math.min(containerWidth / slabWidth, containerHeight / slabHeight) * 0.9;
  return (
    <div>
      <div className="mb-2 text-sm text-gray-600 text-center">Slab: {slabWidth}" × {slabHeight}"</div>
      <div className="relative border-2 border-gray-800 bg-gray-100" style={{ width: slabWidth*scale, height: slabHeight*scale, margin: '0 auto' }}>
        {layoutPieces.map(piece => (
          <div key={piece.id} className={`absolute border-2 flex items-center justify-center text-xs ${piece.orientation==='vertical'?'bg-blue-200':'bg-orange-200'}`} style={{ left: piece.slabPosition.x*scale, top: piece.slabPosition.y*scale, width: piece.width*scale, height: piece.height*scale }}>
            <div>{piece.id}: {piece.width}×{piece.height}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">Showing {layoutPieces.length}/{pieces.length} pieces</div>
    </div>
  );
};

// Multi-slab Plan
const MultiSlabVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;
  const slabs = [], rem=[...pieces]; let num=1;
  while(rem.length){ slabs.push({ number:num++, pieces: rem.splice(0, maxPiecesPerSlab) }); }
  return (
    <div className="space-y-6">
      <h5 className="text-lg font-semibold text-center">Multi-Slab Layout: {pieces.length} pieces, {slabs.length} slab{slabs.length>1?'s': ''}</h5>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slabs.map(s=> (
          <div key={s.number} className="border p-4 rounded bg-white">
            <h6 className="font-semibold mb-2">Slab #{s.number}</h6>
            <SlabLayoutVisualization pieces={s.pieces} slabWidth={slabWidth} slabHeight={slabHeight} maxPiecesPerSlab={maxPiecesPerSlab} includeKerf={includeKerf} kerfWidth={kerfWidth} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
const StoneTopEstimator = () => {
  const [stoneOptions, setStoneOptions] = useState([]);
  const [products, setProducts] = useState([{ id: Date.now(), stone:'', width:'', depth:'', quantity:1, result:null }]);
  const [allResults, setAllResults] = useState([]);
  const [includeKerf, setIncludeKerf] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(0.125);
  const [breakageBuffer, setBreakageBuffer] = useState(10);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const correctPassword = 'stone123';

  useEffect(()=>{
    // fetch stone options
    fetch('https://opensheet.elk.sh/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/Sheet1')
      .then(r=>r.json()).then(data=>{
        setStoneOptions(data);
        setProducts(p=>p.map(item=>({ ...item, stone: data[0]?.['Stone Type']||'' })));
      }).catch(console.error);
  },[]);

  const calculateMaxPiecesPerSlab = (w,h,sw,sh)=>{
    const kerf = includeKerf?kerfWidth:0;
    const opt1 = Math.floor((sw+kerf)/(w+kerf))*Math.floor((sh+kerf)/(h+kerf));
    const opt2 = Math.floor((sw+kerf)/(h+kerf))*Math.floor((sh+kerf)/(w+kerf));
    return Math.max(opt1,opt2);
  };

  const optimizeSlabLayout = (pieces, sw, sh)=>{
    const tops = calculateMaxPiecesPerSlab(pieces[0].width,pieces[0].depth,sw,sh);
    const slabs = [], rem=[...pieces];
    while(rem.length) slabs.push(rem.splice(0,tops));
    const efficiency = ((pieces.length/(slabs.length*tops))*100).toFixed(1);
    return { totalSlabsNeeded:slabs.length, topsPerSlab:tops, efficiency:parseFloat(efficiency) };
  };

  const calculateAll = ()=>{
    const results = products.map(p=>{
      const stone = stoneOptions.find(s=>s['Stone Type']===p.stone)||{};
      const sw=parseFloat(stone['Slab Width']||0), sh=parseFloat(stone['Slab Height']||0);
      const pieces = Array(p.quantity).fill().map((_,i)=>({ id:i+1, width:parseFloat(p.width), depth:parseFloat(p.depth) }));
      const opt = optimizeSlabLayout(pieces, sw, sh);
      const area=(p.width*p.depth/144)*p.quantity;
      const materialCost=(parseFloat(stone['Slab Cost']||0)*opt.totalSlabsNeeded)*(1+breakageBuffer/100);
      const fabricationCost=area*parseFloat(stone['Fab Cost']||0);
      const raw=materialCost+fabricationCost;
      const finalPrice=raw*parseFloat(stone['Mark Up']||1);
      return { ...p, result:{ ...opt, usableAreaSqft:area, materialCost, fabricationCost, rawCost:raw, finalPrice } };
    });
    setProducts(products.map((p,i)=>({ ...p, result:results[i].result })));
    setAllResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Stone Estimator with Slab Optimization</h1>
        </div>
        {!adminMode && (
          <div>
            <input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder="Admin Password" className="border px-4 py-2 rounded" />
            <button onClick={()=>setAdminMode(adminPassword===correctPassword)} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">Enter Admin Mode</button>
          </div>
        )}
        <div className="text-left bg-blue-50 p-4 rounded">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Optimization Settings</h2>
            <button onClick={()=>setShowAdvancedSettings(!showAdvancedSettings)}>
              {showAdvancedSettings?'Hide':'Show'} Advanced
            </button>
          </div>
          <div className="mt-2">
            <label><input type="checkbox" checked={includeKerf} onChange={e=>setIncludeKerf(e.target.checked)} /> Include Kerf ({kerfWidth}\")</label>
          </div>
          {showAdvancedSettings && (
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <label>Kerf Width</label>
                <select value={kerfWidth} onChange={e=>setKerfWidth(parseFloat(e.target.value))}>
                  <option value={0.125}>1/8\"</option>
                  <option value={0.1875}>3/16\"</option>
                  <option value={0.25}>1/4\"</option>
                  <option value={0.09375}>3/32\"</option>
                </select>
              </div>
              <div>
                <label>Breakage Buffer (%)</label>
                <select value={breakageBuffer} onChange={e=>setBreakageBuffer(parseInt(e.target.value))}>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                </select>
              </div>
            </div>
          )}
        </div>
        {products.map((product, idx) => (
          <div key={product.id} className="bg-gray-50 p-4 rounded text-left">
            <div className="flex justify-between items-center">
              <span>Product #{idx+1}</span>
            </div>
            <div className="mt-2 space-y-2">
              <div>
                <label>Stone Type</label>
                <select value={product.stone} onChange={e=>{
                  const updated=[...products]; updated[idx].stone=e.target.value; setProducts(updated);
                }}>
                  <option value="">Select Stone...</option>
                  {stoneOptions.map((s,i)=><option key={i} value={s['Stone Type']}>{s['Stone Type']}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label>Width (in)</label><input type="number" value={product.width} onChange={e=>{ const updated=[...products]; updated[idx].width=e.target.value; setProducts(updated); }} /></div>
                <div><label>Depth (in)</label><input type="number" value={product.depth} onChange={e=>{ const updated=[...products]; updated[idx].depth=e.target.value; setProducts(updated); }} /></div>
                <div><label>Qty</label><input type="number" value={product.quantity} onChange={e=>{ const updated=[...products]; updated[idx].quantity=parseInt(e.target.value); setProducts(updated); }} /></div>
              </div>
            </div>
          </div>
        ))}
        <div className="flex space-x-4 justify-center">
          <button onClick={()=>setProducts([...products, { id:Date.now(), stone:'', width:'', depth:'', quantity:1, result:null }])} className="px-4 py-2 bg-blue-600 text-white rounded">Add Product</button>
          <button onClick={calculateAll} className="px-4 py-2 bg-green-600 text-white rounded">Calculate</button>
        </div>
        {allResults.length>0 && (
          <div className="mt-6 space-y-6">
            <LayoutExportControls allResults={allResults} products={products} stoneOptions={stoneOptions} includeKerf={includeKerf} kerfWidth={kerfWidth} />
            <MultiSlabVisualization pieces={allResults.flatMap(r=>Array(r.quantity).fill().map((_,i)=>({ id:i+1, width: r.width, depth: r.depth })))} slabWidth={parseFloat(stoneOptions.find(s=>s['Stone Type']===products[0].stone)?.['Slab Width']||0)} slabHeight={parseFloat(stoneOptions.find(s=>s['Stone Type']===products[0].stone)?.['Slab Height']||0)} maxPiecesPerSlab={calculateMaxPiecesPerSlab(products[0].width, products[0].depth, parseFloat(stoneOptions.find(s=>s['Stone Type']===products[0].stone)?.['Slab Width']||0), parseFloat(stoneOptions.find(s=>s['Stone Type']===products[0].stone)?.['Slab Height']||0))} includeKerf={includeKerf} kerfWidth={kerfWidth} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoneTopEstimator;
