import React, { useState, useEffect } from 'react';

// Helper function to generate layout for a single slab
const generateSlabLayout = (pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth) => {
  const pieceWidth = pieces[0].width;
  const pieceHeight = pieces[0].depth;
  const kerf = includeKerf ? kerfWidth : 0;

  // Use a simple placeholder layout; can be replaced with full algorithm as needed
  return pieces.map((piece, index) => ({
    ...piece,
    position: index + 1,
    slabPosition: { x: 0, y: 0 }
  }));
};

// Layout Export Component
const LayoutExportControls = ({ allResults, products, stoneOptions, includeKerf, kerfWidth }) => {
  const [exportFormat, setExportFormat] = useState('image');
  const [includeDetails, setIncludeDetails] = useState(true);

  const exportLayoutAsImage = () => {
    const exportWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!exportWindow) {
      alert('Please allow popups for layout export');
      return;
    }

    exportWindow.document.write(\`
      <html>
        <head>
          <title>Stone Layout Export - \${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .slab-container { margin-bottom: 40px; page-break-inside: avoid; }
            .slab-visual { border: 2px solid #333; margin: 20px 0; position: relative; background: #f5f5f5; }
            .piece { position: absolute; border: 2px solid; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
            .piece.vertical { background: #e3f2fd; border-color: #1976d2; color: #1976d2; }
            .piece.horizontal { background: #fff3e0; border-color: #f57c00; color: #f57c00; }
            .summary { background: #f9f9f9; padding: 15px; border-radius: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Stone Layout Plan</h1>
            <p>Generated: \${new Date().toLocaleString()}</p>
            <p>Mode: \${includeKerf ? \`Production (\${kerfWidth}" kerf)\` : 'Theoretical (no kerf)'}></p>
          </div>
        </body>
      </html>
    \`);

    // Append content for each product
    allResults.forEach((product, productIndex) => {
      if (!product.result) return;
      exportWindow.document.body.innerHTML += \`
        <div class="slab-container">
          <h2>Product \${productIndex + 1}: \${product.stone} (\${product.width}×\${product.depth})</h2>
          <div class="summary">
            <strong>Quantity:</strong> \${product.quantity} pieces |
            <strong>Slabs Needed:</strong> \${product.result.totalSlabsNeeded} |
            <strong>Efficiency:</strong> \${product.result.efficiency.toFixed(1)}%
          </div>
        </div>
      \`;
    });

    exportWindow.document.body.innerHTML += \`
      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Layout</button>
        <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
      </div>
    \`;

    exportWindow.document.close();
  };

  const generateCutList = () => {
    let cutListContent = \`STONE CUT LIST - \${new Date().toLocaleDateString()}
\`;
    cutListContent += \`Mode: \${includeKerf ? \`Production (\${kerfWidth}" kerf)\` : 'Theoretical (no kerf)'}
\`;
    cutListContent += '='.repeat(60) + '\n\n';

    allResults.forEach((product, productIndex) => {
      if (!product.result) return;
      cutListContent += \`PRODUCT \${productIndex + 1}: \${product.stone}\n\`;
      cutListContent += \`Size: \${product.width}" × \${product.depth}"\n\`;
      cutListContent += \`Quantity: \${product.quantity} pieces\n\`;
      cutListContent += \`Slabs Required: \${product.result.totalSlabsNeeded}\n\`;
      cutListContent += \`Pieces per Slab: \${product.result.topsPerSlab}\n\`;
      cutListContent += \`Efficiency: \${product.result.efficiency.toFixed(1)}%\n\n\`;
      cutListContent += '-'.repeat(40) + '\n\n';
    });

    const blob = new Blob([cutListContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`stone_cut_list_\${new Date().toISOString().split('T')[0]}.txt\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareLayoutURL = () => {
    const layoutData = {
      products: products.filter(p => p.result),
      settings: { includeKerf, kerfWidth },
      timestamp: new Date().toISOString()
    };
    const encodedData = btoa(JSON.stringify(layoutData));
    const shareURL = \`\${window.location.origin}\${window.location.pathname}?layout=\${encodedData}\`;

    navigator.clipboard.writeText(shareURL).then(() => {
      alert('Layout URL copied to clipboard!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = shareURL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Layout URL copied to clipboard!');
    });
  };

  if (!allResults || allResults.length === 0) return null;

  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
      <h4 className="font-semibold text-blue-800">Export & Share Layout</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={exportLayoutAsImage}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <span>📊</span>
          <span>Export Visual Layout</span>
        </button>
        <button
          onClick={generateCutList}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <span>📋</span>
          <span>Download Cut List</span>
        </button>
        <button
          onClick={shareLayoutURL}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          <span>🔗</span>
          <span>Share Layout URL</span>
        </button>
      </div>
      <div className="text-xs text-gray-600">
        <strong>Export Options:</strong> Visual layouts can be printed or saved as PDF. Cut lists include piece positioning. Share URLs allow fabricators to view your exact layout.
      </div>
    </div>
  );
};

// Slab Layout Visualization Component
const SlabLayoutVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;

  const kerf = includeKerf ? kerfWidth : 0;

  // A simplified layout generation
  const layoutPieces = generateSlabLayout(pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth);

  // Scale visualization
  const containerWidth = 400;
  const containerHeight = 250;
  const scaleX = containerWidth / slabWidth;
  const scaleY = containerHeight / slabHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  return (
    <div>
      <div className="mb-2 text-sm text-gray-600 text-center">
        Slab: {slabWidth}" × {slabHeight}"
      </div>
      <div className="relative border-2 border-gray-800 bg-gray-100" style={{ width: slabWidth * scale, height: slabHeight * scale, margin: '0 auto' }}>
        {layoutPieces.map(piece => (
          <div
            key={piece.id}
            className={`absolute border-2 flex items-center justify-center text-xs font-semibold ${piece.orientation === 'vertical' ? 'bg-blue-200 border-blue-600 text-blue-800' : 'bg-orange-200 border-orange-600 text-orange-800'}`}
            style={{
              left: piece.slabPosition.x * scale,
              top: piece.slabPosition.y * scale,
              width: piece.width * scale,
              height: piece.height * scale,
            }}
          >
            <div className="text-center">
              <div>{piece.id}</div>
              <div className="text-xs">{piece.width}×{piece.height}</div>
            </div>
          </div>
        ))}
      </div>
      {includeKerf && kerf > 0 && layoutPieces.length > 1 && (
        <>
          {Array.from(new Set(layoutPieces.map(p => p.slabPosition.x + p.width))).map((x, i) => (
            <div key={`v-kerf-${i}`} className="absolute bg-red-300 opacity-70" style={{ left: x * scale, top: 0, width: kerf * scale, height: slabHeight * scale }} />
          ))}
          {Array.from(new Set(layoutPieces.map(p => p.slabPosition.y + p.height))).map((y, i) => (
            <div key={`h-kerf-${i}`} className="absolute bg-red-300 opacity-70" style={{ left: 0, top: y * scale, width: slabWidth * scale, height: kerf * scale }} />
          ))}
        </>
      )}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Showing {layoutPieces.length} of {pieces.length} pieces (max {maxPiecesPerSlab}/slab)
      </div>
    </div>
  );
};

// Multi-Slab Layout Visualization Component
const MultiSlabVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;

  const slabs = [];
  let remaining = [...pieces];
  let num = 1;
  while (remaining.length) {
    const slice = remaining.splice(0, maxPiecesPerSlab);
    slabs.push({ number: num++, pieces: slice });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-semibold mb-2">Multi-Slab Layout Plan</h4>
        <p className="text-sm text-gray-600">{pieces.length} pieces across {slabs.length} slab{slabs.length > 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slabs.map(slab => (
          <div key={slab.number} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-semibold text-gray-800">Slab #{slab.number}</h5>                                                  
            </div>
            <SlabLayoutVisualization
              pieces={slab.pieces}
              slabWidth={slabWidth}
              slabHeight={slabHeight}
              maxPiecesPerSlab={maxPiecesPerSlab}
              includeKerf={includeKerf}
              kerfWidth={kerfWidth}
            />
            <div className="mt-3 text-xs">
              <strong>Pieces on this slab:</strong>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {slab.pieces.map((p, i) => (
                  <div key={i} className="text-gray-600">#{p.id}: {p.width}×{p.height}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
const StoneTopEstimator = () => {
  const [stoneOptions, setStoneOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const correctPassword = 'stone123';

  const [includeKerf, setIncludeKerf] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(0.125);
  const [breakageBuffer, setBreakageBuffer] = useState(10);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showAdvancedPieceManagement, setShowAdvancedPieceManagement] = useState(false);

  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '' });
  const [products, setProducts] = useState([{ stone: '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null, id: Date.now() }]);
  const [allResults, setAllResults] = useState([]);

  useEffect(() => {
    // Load HTML to PDF library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);

    // Fetch stone data
    fetch('https://opensheet.elk.sh/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/Sheet1')
      .then(res => res.json())
      .then(data => {
        setStoneOptions(data);
        setProducts(prev => prev.map(p => ({ ...p, stone: data[0]?.['Stone Type'] || '' })));
      })
      .catch(err => {
        console.error('Failed to load stone data:', err);
        alert('Failed to load stone data.');
      });
  }, []);

  const calculateMaxPiecesPerSlab = (pieceW, pieceH, slabW, slabH) => {
    const kerf = includeKerf ? kerfWidth : 0;
    let maxPieces = 0;
    const option1 = Math.floor((slabW + kerf) / (pieceW + kerf)) * Math.floor((slabH + kerf) / (pieceH + kerf));
    const option2 = Math.floor((slabW + kerf) / (pieceH + kerf)) * Math.floor((slabH + kerf) / (pieceW + kerf));
    maxPieces = Math.max(option1, option2);
    return maxPieces;
  };

  const optimizeSlabLayout = (pieces, slabW, slabH) => {
    const maxPieces = calculateMaxPiecesPerSlab(pieces[0].width, pieces[0].depth, slabW, slabH);
    const slabs = []; let rem = [...pieces];
    while (rem.length) {
      const chunk = rem.splice(0, maxPieces);
      slabs.push(chunk);
    }
    const efficiency = ((pieces.length / (slabs.length * maxPieces)) * 100).toFixed(1);
    return { totalSlabsNeeded: slabs.length, efficiency: parseFloat(efficiency), topsPerSlab: maxPieces };
  };

  const handleDrawingUpload = async (e, idx) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setLoadingAI(true);
    const fd = new FormData();
    fd.append('image', selected);
    try {
      const res = await fetch('https://gpt4-drawing-backend.vercel.app/api/extract-dimensions', {
        method: 'POST',
        headers: { 'x-vercel-protection-bypass': 'paramusicalkariokparamusicalkari' },
        body: fd
      });
      const json = await res.json();
      if (json.success) {
        const updated = [...products];
        updated[idx].width = json.data.width;
        updated[idx].depth = json.data.depth;
        setProducts(updated);
      }
    } catch (err) {
      console.error(err);
      alert('Failed extraction.');
    } finally {
      setLoadingAI(false);
    }
  };

  const updateProduct = (i, field, val) => {
    const upd = [...products];
    upd[i][field] = val;
    setProducts(upd);
  };

  const addProduct = () => setProducts([...products, { stone: stoneOptions[0]?.['Stone Type'] || '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null, id: Date.now() }]);
  const removeProduct = i => setProducts(products.filter((_, idx) => idx !== i));

  const calculateAll = () => {
    const results = products.map(p => {
      const stone = stoneOptions.find(s => s['Stone Type'] === p.stone) || {};
      const slabW = parseFloat(stone['Slab Width'] || 0), slabH = parseFloat(stone['Slab Height'] || 0);
      const pieces = Array(p.quantity).fill().map((_,i)=>({ id:i+1, width:parseFloat(p.width), depth:parseFloat(p.depth) }));
      const opt = optimizeSlabLayout(pieces, slabW, slabH);
      const area = (p.width * p.depth /144) * p.quantity;
      const materialCost = (parseFloat(stone['Slab Cost']||0) * opt.totalSlabsNeeded)*(1+breakageBuffer/100);
      const fabricationCost = area * parseFloat(stone['Fab Cost']||0);
      const raw = materialCost + fabricationCost;
      const finalPrice = raw * parseFloat(stone['Mark Up']||1);
      return { ...p, result:{ usableAreaSqft: area, ...opt, materialCost, fabricationCost, rawCost:raw, finalPrice }};
    });
    setProducts(products.map((p,i)=>({...p, result:results[i].result})));
    setAllResults(results);
  };

  const generatePDF = () => {
    if (!window.html2pdf) { alert('Still loading PDF generator.'); return; }
    if (!allResults.length) { alert('Please calculate first'); return; }
    const el = document.createElement('div');
    el.innerHTML = '<h1>Stone Quote</h1>';
    window.html2pdf().from(el).save('stone_quote.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl space-y-6 text-center">
        <div className="text-center mb-4">
          <div className="w-32 h-32 mx-auto mb-2 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-600">AIC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Stone Estimator with Slab Optimization</h1>
          <p className="text-base font-medium text-gray-700">Developed by Roy Kariok</p>
        </div>
        {!adminMode && (
          <div className="mb-4">
            <input
              type="password"
              value={adminPassword}
              onChange={e=>setAdminPassword(e.target.value)}
              placeholder="Admin Password"
              className="border px-4 py-2 rounded"
            />
            <button onClick={()=>setAdminMode(adminPassword===correctPassword)} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Enter Admin Mode
            </button>
          </div>
        )}
        {/* Optimization Settings */}
        <div className="bg-blue-50 p-4 rounded shadow-md space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-800">Optimization Settings</h2>
            <button onClick={()=>setShowAdvancedSettings(!showAdvancedSettings)} className="text-blue-600 hover:text-blue-800 font-medium">
              {showAdvancedSettings?'▼ Hide Advanced':'▶ Show Advanced'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="includeKerf" checked={includeKerf} onChange={e=>setIncludeKerf(e.target.checked)} className="w-4 h-4"/>
              <label htmlFor="includeKerf" className="font-medium">Include Kerf</label>
              {includeKerf && <span className="text-sm text-gray-600">({kerfWidth}")</span>}
            </div>
            <div className="text-sm text-gray-600"><strong>Mode:</strong> {includeKerf?'Production':'Theoretical'}</div>
          </div>
          {showAdvancedSettings && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kerf Width</label>
                  <select value={kerfWidth} onChange={e=>setKerfWidth(parseFloat(e.target.value))} className="border px-3 py-2 rounded w-full text-sm" disabled={!includeKerf}>
                    <option value={0.125}>1/8"</option>
                    <option value={0.1875}>3/16"</option>
                    <option value={0.25}>1/4"</option>
                    <option value={0.09375}>3/32"</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Breakage Buffer (%)</label>
                  <select value={breakageBuffer} onChange={e=>setBreakageBuffer(parseInt(e.target.value))} className="border px-3 py-2 rounded w-full text-sm">
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Presets</label>
                  <select onChange={e=>{
                      if(e.target.value==='production'){setIncludeKerf(true);setKerfWidth(0.125);setBreakageBuffer(10);}
                      if(e.target.value==='theoretical'){setIncludeKerf(false);setBreakageBuffer(5);}
                      if(e.target.value==='conservative'){setIncludeKerf(true);setKerfWidth(0.1875);setBreakageBuffer(15);}
                    }} className="border px-3 py-2 rounded w-full text-sm">
                    <option value="">Select...</option>
                    <option value="theoretical">Max</option>
                    <option value="production">Standard</option>
                    <option value="conservative">Conservative</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Products List */}
        {products.map((product, idx) => (
          <div key={product.id} className="bg-gray-50 p-4 rounded shadow space-y-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">{product.customName||`Product ${idx+1}`}</h3>
              <div>
                <button onClick={()=>setShowAdvancedPieceManagement(!showAdvancedPieceManagement)} title="Advanced Options" className="text-blue-600 hover:text-blue-800">⚙️</button>
                {products.length>1 && <button onClick={()=>removeProduct(idx)} className="text-red-600 font-bold text-xl hover:text-red-800 ml-2">×</button>}
              </div>
            </div>
            {showAdvancedPieceManagement && (
              <div className="bg-blue-50 p-3 rounded border space-y-3">
                <h4 className="font-medium text-blue-800">Advanced Piece Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Name</label>
                    <input type="text" placeholder="e.g., Kitchen Island" value={product.customName||''} onChange={e=>updateProduct(idx,'customName',e.target.value)} className="border px-3 py-2 rounded w-full text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select value={product.priority||'normal'} onChange={e=>updateProduct(idx,'priority',e.target.value)} className="border px-3 py-2 rounded w-full text-sm">
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phase</label>
                    <select value={product.projectPhase||'design'} onChange={e=>updateProduct(idx,'projectPhase',e.target.value)} className="border px-3 py-2 rounded w-full text-sm">
                      <option value="design">Design</option>
                      <option value="approved">Approved</option>
                      <option value="production">Production</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Install Date</label>
                    <input type="date" value={product.installDate||''} onChange={e=>updateProduct(idx,'installDate',e.target.value)} className="border px-3 py-2 rounded w-full text-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Special Req</label>
                    <select value={product.specialReq||'none'} onChange={e=>updateProduct(idx,'specialReq',e.target.value)} className="border px-3 py-2 rounded w-full text-sm">
                      <option value="none">None</option>
                      <option value="book-match">Book Match</option>
                      <option value="quarter-match">Quarter Match</option>
                      <option value="vein-direction">Vein Dir</option>
                      <option value="defect-free">Defect Free</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <div className="grid grid-cols-3 gap-4">
              <select value={product.stone} onChange={e=>updateProduct(idx,'stone',e.target.value)} className="border px-4 py-2 rounded">
                <option value="">Select Stone...</option>
                {stoneOptions.map((s,i)=>(<option key={i} value={s['Stone Type']}>{s['Stone Type']}</option>))}
              </>
            </div>
          </div>
        ))}

        <div className="flex space-x-4 justify-center">
          <button onClick={addProduct} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Another Product</button>
          <button onClick={calculateAll} className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold">Calculate</button>
          {allResults.length>0 && <button onClick={generatePDF} className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">Generate PDF</button>}
        </div>
      </div>
    </div>
  );
};

export default StoneTopEstimator;
