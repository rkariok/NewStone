import { useState, useEffect } from 'react';

// Helper function to generate layout for a single slab
const generateSlabLayout = (pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth) => {
  const pieceWidth = pieces[0]?.width || 0;
  const pieceHeight = pieces[0]?.depth || 0;
  
  return pieces.map((piece, index) => ({
    ...piece,
    position: index + 1,
    slabPosition: { x: 0, y: 0 }
  }));
};

// Layout Export Component
const LayoutExportControls = ({ allResults, products, stoneOptions, includeKerf, kerfWidth }) => {
  const exportLayoutAsImage = () => {
    const exportWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!exportWindow) {
      alert('Please allow popups for layout export');
      return;
    }
    
    exportWindow.document.write(`
      <html>
        <head>
          <title>Stone Layout Export - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Stone Layout Plan</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Mode: ${includeKerf ? `Production (${kerfWidth}" kerf)` : 'Theoretical (no kerf)'}</p>
          </div>
        </body>
      </html>
    `);
    
    exportWindow.document.close();
  };
  
  const generateCutList = () => {
    let cutListContent = `STONE CUT LIST - ${new Date().toLocaleDateString()}\n`;
    cutListContent += `Mode: ${includeKerf ? `Production (${kerfWidth}" kerf)` : 'Theoretical (no kerf)'}\n`;
    cutListContent += '='.repeat(60) + '\n\n';
    
    allResults.forEach((product, productIndex) => {
      if (!product.result) return;
      
      cutListContent += `PRODUCT ${productIndex + 1}: ${product.stone}\n`;
      cutListContent += `Size: ${product.width}" × ${product.depth}"\n`;
      cutListContent += `Quantity: ${product.quantity} pieces\n\n`;
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
    const layoutData = {
      products: products.filter(p => p.result),
      settings: { includeKerf, kerfWidth },
      timestamp: new Date().toISOString()
    };
    
    const encodedData = btoa(JSON.stringify(layoutData));
    const shareURL = `${window.location.origin}${window.location.pathname}?layout=${encodedData}`;
    
    navigator.clipboard.writeText(shareURL).then(() => {
      alert('Layout URL copied to clipboard!');
    }).catch(() => {
      alert('Could not copy to clipboard');
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
    </div>
  );
};

const SlabLayoutVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;

  const pieceWidth = pieces[0]?.width || 0;
  const pieceHeight = pieces[0]?.depth || 0;
  const kerf = includeKerf ? kerfWidth : 0;

  const generateOptimalLayout = () => {
    const layout = [];
    const targetPieces = Math.min(pieces.length, maxPiecesPerSlab);
    
    // If maxPiecesPerSlab was calculated correctly by the mixed orientation algorithm,
    // we need to figure out which combination of orientations achieves that maximum
    
    // First, check if single orientations can achieve the target
    const orientation1Fits = Math.floor((slabWidth + kerf) / (pieceWidth + kerf)) * Math.floor((slabHeight + kerf) / (pieceHeight + kerf));
    const orientation2Fits = Math.floor((slabWidth + kerf) / (pieceHeight + kerf)) * Math.floor((slabHeight + kerf) / (pieceWidth + kerf));
    
    if (orientation1Fits >= targetPieces) {
      // Use vertical orientation (w×h)
      const cols = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
      const rows = Math.ceil(targetPieces / cols);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && layout.length < targetPieces; col++) {
          layout.push({
            x: col * (pieceWidth + kerf),
            y: row * (pieceHeight + kerf),
            width: pieceWidth,
            height: pieceHeight,
            orientation: 'vertical',
            id: layout.length + 1
          });
        }
      }
    } else if (orientation2Fits >= targetPieces) {
      // Use horizontal orientation (h×w)
      const cols = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
      const rows = Math.ceil(targetPieces / cols);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && layout.length < targetPieces; col++) {
          layout.push({
            x: col * (pieceHeight + kerf),
            y: row * (pieceWidth + kerf),
            width: pieceHeight,
            height: pieceWidth,
            orientation: 'horizontal',
            id: layout.length + 1
          });
        }
      }
    } else {
      // Mixed orientation needed - find the optimal combination that gives us targetPieces
      // This should match the calculation logic in calculateMaxPiecesPerSlab
      
      let bestLayout = [];
      let maxFound = 0;
      
      // Try Method A: rows of orientation 1, then rows of orientation 2
      for (let rows1 = 0; rows1 <= Math.floor((slabHeight + kerf) / (pieceHeight + kerf)); rows1++) {
        const usedHeight1 = Math.max(0, rows1 * (pieceHeight + kerf) - kerf);
        const remainingHeight = slabHeight - usedHeight1;
        
        const pieces1 = rows1 * Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
        
        let pieces2 = 0;
        if (remainingHeight >= pieceWidth) {
          const rows2 = Math.floor((remainingHeight + kerf) / (pieceWidth + kerf));
          pieces2 = rows2 * Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
        }
        
        const totalPieces = pieces1 + pieces2;
        
        // Accept any layout that can fit our targetPieces, prioritizing layouts that use exactly targetPieces
        if (totalPieces >= targetPieces && (totalPieces <= maxFound + 1 || bestLayout.length === 0)) {
          // Generate this layout
          const tempLayout = [];
          
          // Add orientation 1 pieces (vertical) - but only up to what we need
          const cols1 = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
          let piecesAdded = 0;
          for (let row = 0; row < rows1 && piecesAdded < targetPieces; row++) {
            for (let col = 0; col < cols1 && piecesAdded < targetPieces; col++) {
              tempLayout.push({
                x: col * (pieceWidth + kerf),
                y: row * (pieceHeight + kerf),
                width: pieceWidth,
                height: pieceHeight,
                orientation: 'vertical',
                id: tempLayout.length + 1
              });
              piecesAdded++;
            }
          }
          
          // Add orientation 2 pieces (horizontal) - only if we still need more pieces
          if (piecesAdded < targetPieces && remainingHeight >= pieceWidth) {
            const rows2 = Math.floor((remainingHeight + kerf) / (pieceWidth + kerf));
            const cols2 = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
            for (let row = 0; row < rows2 && piecesAdded < targetPieces; row++) {
              for (let col = 0; col < cols2 && piecesAdded < targetPieces; col++) {
                tempLayout.push({
                  x: col * (pieceHeight + kerf),
                  y: usedHeight1 + row * (pieceWidth + kerf),
                  width: pieceHeight,
                  height: pieceWidth,
                  orientation: 'horizontal',
                  id: tempLayout.length + 1
                });
                piecesAdded++;
              }
            }
          }
          
          // Use this layout if it fits our pieces better
          if (tempLayout.length >= targetPieces || tempLayout.length > bestLayout.length) {
            bestLayout = tempLayout.slice(0, targetPieces);
            maxFound = tempLayout.length;
          }
        }
      }
      
      // Try Method B: rows of orientation 2, then rows of orientation 1
      for (let rows2 = 0; rows2 <= Math.floor((slabHeight + kerf) / (pieceWidth + kerf)); rows2++) {
        const usedHeight2 = Math.max(0, rows2 * (pieceWidth + kerf) - kerf);
        const remainingHeight = slabHeight - usedHeight2;
        
        const pieces2 = rows2 * Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
        
        let pieces1 = 0;
        if (remainingHeight >= pieceHeight) {
          const rows1 = Math.floor((remainingHeight + kerf) / (pieceHeight + kerf));
          pieces1 = rows1 * Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
        }
        
        const totalPieces = pieces1 + pieces2;
        
        // Accept any layout that can fit our targetPieces
        if (totalPieces >= targetPieces && (totalPieces < maxFound || bestLayout.length < targetPieces)) {
          // Generate this layout
          const tempLayout = [];
          
          // Add orientation 2 pieces (horizontal) - but only up to what we need
          const cols2 = Math.floor((slabWidth + kerf) / (pieceHeight + kerf));
          let piecesAdded = 0;
          for (let row = 0; row < rows2 && piecesAdded < targetPieces; row++) {
            for (let col = 0; col < cols2 && piecesAdded < targetPieces; col++) {
              tempLayout.push({
                x: col * (pieceHeight + kerf),
                y: row * (pieceWidth + kerf),
                width: pieceHeight,
                height: pieceWidth,
                orientation: 'horizontal',
                id: tempLayout.length + 1
              });
              piecesAdded++;
            }
          }
          
          // Add orientation 1 pieces (vertical) - only if we still need more pieces
          if (piecesAdded < targetPieces && remainingHeight >= pieceHeight) {
            const rows1 = Math.floor((remainingHeight + kerf) / (pieceHeight + kerf));
            const cols1 = Math.floor((slabWidth + kerf) / (pieceWidth + kerf));
            for (let row = 0; row < rows1 && piecesAdded < targetPieces; row++) {
              for (let col = 0; col < cols1 && piecesAdded < targetPieces; col++) {
                tempLayout.push({
                  x: col * (pieceWidth + kerf),
                  y: usedHeight2 + row * (pieceHeight + kerf),
                  width: pieceWidth,
                  height: pieceHeight,
                  orientation: 'vertical',
                  id: tempLayout.length + 1
                });
                piecesAdded++;
              }
            }
          }
          
          // Use this layout if it's better (fits more pieces or fits exactly)
          if (tempLayout.length >= targetPieces && (tempLayout.length < maxFound || bestLayout.length < targetPieces)) {
            bestLayout = tempLayout.slice(0, targetPieces);
            maxFound = tempLayout.length;
          }
        }
      }
      
      layout.push(...bestLayout);
    }
    
    console.log(`Generated layout for ${pieceWidth}×${pieceHeight} on ${slabWidth}×${slabHeight}`);
    console.log(`Target pieces: ${targetPieces}, Generated pieces: ${layout.length}`);
    console.log(`Max capacity: ${maxPiecesPerSlab}`);
    console.log('Layout pieces:', layout);
    
    return layout;
  };

  const layoutPieces = generateOptimalLayout();
  
  const containerWidth = 400;
  const containerHeight = 250;
  const scaleX = containerWidth / slabWidth;
  const scaleY = containerHeight / slabHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledSlabWidth = slabWidth * scale;
  const scaledSlabHeight = slabHeight * scale;

  return (
    <div className="relative">
      <div className="mb-2 text-sm text-gray-600 text-center">
        Slab: {slabWidth}" × {slabHeight}"
      </div>
      
      <div 
        className="relative border-2 border-gray-800 bg-gray-100 mx-auto" 
        style={{ 
          width: `${scaledSlabWidth}px`, 
          height: `${scaledSlabHeight}px`
        }}
      >
        {layoutPieces.map((piece) => (
          <div
            key={piece.id}
            className={`absolute border-2 flex items-center justify-center text-xs font-semibold ${
              piece.orientation === 'vertical' 
                ? 'bg-blue-200 border-blue-600 text-blue-800' 
                : 'bg-orange-200 border-orange-600 text-orange-800'
            }`}
            style={{
              left: `${piece.x * scale}px`,
              top: `${piece.y * scale}px`,
              width: `${piece.width * scale}px`,
              height: `${piece.height * scale}px`,
            }}
          >
            <div className="text-center">
              <div>{piece.id}</div>
              <div className="text-xs">{piece.width}×{piece.height}</div>
            </div>
          </div>
        ))}
        
        {/* Show kerf lines if enabled */}
        {includeKerf && kerf > 0 && layoutPieces.length > 1 && (
          <>
            {/* Vertical kerf lines */}
            {Array.from(new Set(layoutPieces.map(p => p.x + p.width))).map((x, i) => (
              <div
                key={`v-kerf-${i}`}
                className="absolute bg-red-300 opacity-70"
                style={{
                  left: `${x * scale}px`,
                  top: '0px',
                  width: `${kerf * scale}px`,
                  height: `${scaledSlabHeight}px`,
                }}
              />
            ))}
            {/* Horizontal kerf lines */}
            {Array.from(new Set(layoutPieces.map(p => p.y + p.height))).map((y, i) => (
              <div
                key={`h-kerf-${i}`}
                className="absolute bg-red-300 opacity-70"
                style={{
                  left: '0px',
                  top: `${y * scale}px`,
                  width: `${scaledSlabWidth}px`,
                  height: `${kerf * scale}px`,
                }}
              />
            ))}
          </>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Showing {layoutPieces.length} of {pieces.length} pieces (max {maxPiecesPerSlab}/slab)
      </div>
    </div>
  );
};

const MultiSlabVisualization = ({ pieces, slabWidth, slabHeight, maxPiecesPerSlab, includeKerf, kerfWidth }) => {
  if (!pieces || pieces.length === 0) return null;

  const slabs = [];
  let remainingPieces = [...pieces];
  let slabNumber = 1;
  
  while (remainingPieces.length > 0) {
    const piecesForThisSlab = remainingPieces.splice(0, Math.min(maxPiecesPerSlab, remainingPieces.length));
    slabs.push({
      number: slabNumber++,
      pieces: piecesForThisSlab,
      utilization: (piecesForThisSlab.length / maxPiecesPerSlab * 100).toFixed(1)
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-semibold mb-2">Multi-Slab Layout Plan</h4>
        <p className="text-sm text-gray-600">
          {pieces.length} pieces across {slabs.length} slab{slabs.length > 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slabs.map((slab) => (
          <div key={slab.number} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-semibold text-gray-800">
                Slab #{slab.number}
              </h5>
              <div className="text-sm space-y-1">
                <div>Pieces: {slab.pieces.length}/{maxPiecesPerSlab}</div>
                <div className="text-xs text-gray-600">
                  Utilization: {slab.utilization}%
                </div>
              </div>
            </div>
            
            <SlabLayoutVisualization 
              pieces={slab.pieces}
              slabWidth={slabWidth}
              slabHeight={slabHeight}
              maxPiecesPerSlab={maxPiecesPerSlab}
              includeKerf={includeKerf}
              kerfWidth={kerfWidth}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const StoneTopEstimator = () => {
  const [stoneOptions, setStoneOptions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const correctPassword = 'stone123';

  const [includeKerf, setIncludeKerf] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(0.125);
  const [breakageBuffer, setBreakageBuffer] = useState(10);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [products, setProducts] = useState([
    { 
      stone: '', 
      width: '', 
      depth: '', 
      quantity: 1, 
      edgeDetail: 'Eased', 
      result: null, 
      id: Date.now(), 
      customName: '', 
      priority: 'normal' 
    }
  ]);
  const [allResults, setAllResults] = useState([]);
  const [showAdvancedPieceManagement, setShowAdvancedPieceManagement] = useState(false);
  const [showVisualLayouts, setShowVisualLayouts] = useState(true);

  useEffect(() => {
    // Fetch stone data
    fetch("https://opensheet.elk.sh/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/Sheet1")
      .then((res) => res.json())
      .then((data) => {
        setStoneOptions(data);
        setProducts((prev) =>
          prev.map((p) => ({ ...p, stone: data[0]?.["Stone Type"] || '' }))
        );
      })
      .catch((error) => {
        console.error("Failed to load stone data:", error);
        setStoneOptions([]);
      });
  }, []);

  const calculateMaxPiecesPerSlab = (pieceW, pieceH, slabW, slabH) => {
    const kerf = includeKerf ? kerfWidth : 0;
    let maxPieces = 0;

    // Option 1: All pieces in orientation 1 (w × h)
    const fit1W = Math.floor((slabW + kerf) / (pieceW + kerf));
    const fit1H = Math.floor((slabH + kerf) / (pieceH + kerf));
    const option1 = fit1W * fit1H;

    // Option 2: All pieces in orientation 2 (h × w)  
    const fit2W = Math.floor((slabW + kerf) / (pieceH + kerf));
    const fit2H = Math.floor((slabH + kerf) / (pieceW + kerf));
    const option2 = fit2W * fit2H;

    maxPieces = Math.max(option1, option2);

    // Option 3: Mixed orientations - CORRECTED ALGORITHM
    // Try all possible row combinations like the CutList Optimizer
    
    // Method A: First row(s) with orientation 1, remaining rows with orientation 2
    for (let rows1 = 0; rows1 <= Math.floor((slabH + kerf) / (pieceH + kerf)); rows1++) {
      const usedHeight1 = Math.max(0, rows1 * (pieceH + kerf) - kerf);
      const remainingHeight = slabH - usedHeight1;
      
      const pieces1 = rows1 * Math.floor((slabW + kerf) / (pieceW + kerf));
      
      if (remainingHeight >= pieceW) {
        const rows2 = Math.floor((remainingHeight + kerf) / (pieceW + kerf));
        const pieces2 = rows2 * Math.floor((slabW + kerf) / (pieceH + kerf));
        maxPieces = Math.max(maxPieces, pieces1 + pieces2);
      } else {
        maxPieces = Math.max(maxPieces, pieces1);
      }
    }

    // Method B: First row(s) with orientation 2, remaining rows with orientation 1
    for (let rows2 = 0; rows2 <= Math.floor((slabH + kerf) / (pieceW + kerf)); rows2++) {
      const usedHeight2 = Math.max(0, rows2 * (pieceW + kerf) - kerf);
      const remainingHeight = slabH - usedHeight2;
      
      const pieces2 = rows2 * Math.floor((slabW + kerf) / (pieceH + kerf));
      
      if (remainingHeight >= pieceH) {
        const rows1 = Math.floor((remainingHeight + kerf) / (pieceH + kerf));
        const pieces1 = rows1 * Math.floor((slabW + kerf) / (pieceW + kerf));
        maxPieces = Math.max(maxPieces, pieces1 + pieces2);
      } else {
        maxPieces = Math.max(maxPieces, pieces2);
      }
    }

    return maxPieces;
  };

  const optimizeSlabLayout = (pieces, slabWidth, slabHeight) => {
    if (pieces.length === 0) return { totalSlabsNeeded: 0, efficiency: 0, topsPerSlab: 0 };

    const pieceWidth = pieces[0].width;
    const pieceHeight = pieces[0].depth;
    const maxPiecesPerSlab = calculateMaxPiecesPerSlab(pieceWidth, pieceHeight, slabWidth, slabHeight);
    
    const totalSlabsNeeded = Math.ceil(pieces.length / maxPiecesPerSlab);
    const totalSlabArea = totalSlabsNeeded * slabWidth * slabHeight;
    const totalUsedArea = pieces.reduce((sum, p) => sum + p.width * p.depth, 0);
    const efficiency = totalSlabArea > 0 ? (totalUsedArea / totalSlabArea) * 100 : 0;

    return {
      totalSlabsNeeded,
      efficiency,
      topsPerSlab: maxPiecesPerSlab
    };
  };

  const handleDrawingUpload = async (e, index) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setLoadingAI(true);
    // Simulate AI processing
    setTimeout(() => {
      setLoadingAI(false);
      alert("AI dimension extraction would happen here");
    }, 2000);
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { 
        stone: stoneOptions[0]?.["Stone Type"] || '', 
        width: '', 
        depth: '', 
        quantity: 1, 
        edgeDetail: 'Eased', 
        result: null, 
        id: Date.now(), 
        customName: '', 
        priority: 'normal' 
      }
    ]);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const calculateAll = () => {
    console.log("Calculate button clicked!");
    
    const results = products.map((product) => {
      const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
      if (!stone) return { ...product, result: null };

      const slabCost = parseFloat(stone["Slab Cost"]) || 1000;
      const fabCost = parseFloat(stone["Fab Cost"]) || 25;
      const markup = parseFloat(stone["Mark Up"]) || 2.5;
      const w = parseFloat(product.width);
      const d = parseFloat(product.depth);
      const quantity = parseInt(product.quantity);

      if (!w || !d) return { ...product, result: null };

      const slabWidth = parseFloat(stone["Slab Width"]) || 126;
      const slabHeight = parseFloat(stone["Slab Height"]) || 63;

      const pieces = Array(quantity).fill().map((_, i) => ({
        id: i + 1,
        width: w,
        depth: d,
        name: `${product.stone} #${i + 1}`
      }));

      const optimization = optimizeSlabLayout(pieces, slabWidth, slabHeight);
      
      const area = w * d;
      const usableAreaSqft = (area / 144) * quantity;
      const totalSlabsNeeded = optimization.totalSlabsNeeded;
      const efficiency = optimization.efficiency;
      
      const materialCost = (slabCost * totalSlabsNeeded) * (1 + breakageBuffer/100);
      const fabricationCost = usableAreaSqft * fabCost;
      const rawCost = materialCost + fabricationCost;
      const finalPrice = rawCost * markup;

      return {
        ...product,
        result: {
          usableAreaSqft,
          totalSlabsNeeded,
          efficiency,
          materialCost,
          fabricationCost,
          rawCost,
          finalPrice,
          topsPerSlab: optimization.topsPerSlab
        }
      };
    });

    const updatedProducts = products.map((product, index) => ({
      ...product,
      result: results[index]?.result || null
    }));
    setProducts(updatedProducts);
    setAllResults(results);
  };

  const generatePDF = () => {
    if (allResults.length === 0) {
      alert("Please calculate estimates first");
      return;
    }
    alert("PDF generation would happen here");
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
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin Password"
              className="border px-4 py-2 rounded"
            />
            <button
              onClick={() => setAdminMode(adminPassword === correctPassword)}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Enter Admin Mode
            </button>
          </div>
        )}

        {/* Advanced Settings Panel */}
        <div className="bg-blue-50 p-4 rounded shadow-md space-y-4 text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-blue-800">Optimization Settings</h2>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAdvancedSettings ? '▼ Hide Advanced' : '▶ Show Advanced'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeKerf"
                checked={includeKerf}
                onChange={(e) => setIncludeKerf(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="includeKerf" className="font-medium">
                Include Kerf (Saw Blade Width)
              </label>
              {includeKerf && (
                <span className="text-sm text-gray-600">({kerfWidth}")</span>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Current Mode:</strong> {includeKerf ? 'Production (with kerf)' : 'Theoretical (no kerf)'}
            </div>
          </div>

          {showAdvancedSettings && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kerf Width (inches)</label>
                  <select
                    value={kerfWidth}
                    onChange={(e) => setKerfWidth(parseFloat(e.target.value))}
                    className="border px-3 py-2 rounded w-full text-sm"
                    disabled={!includeKerf}
                  >
                    <option value={0.125}>1/8" (0.125) - Standard</option>
                    <option value={0.1875}>3/16" (0.1875) - Thick Material</option>
                    <option value={0.25}>1/4" (0.25) - Heavy Duty</option>
                    <option value={0.09375}>3/32" (0.094) - Thin Blade</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Breakage Buffer (%)</label>
                  <select
                    value={breakageBuffer}
                    onChange={(e) => setBreakageBuffer(parseInt(e.target.value))}
                    className="border px-3 py-2 rounded w-full text-sm"
                  >
                    <option value={5}>5% - Conservative</option>
                    <option value={10}>10% - Standard</option>
                    <option value={15}>15% - High Risk</option>
                    <option value={20}>20% - Very High Risk</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Quick Presets</label>
                  <select
                    onChange={(e) => {
                      const preset = e.target.value;
                      if (preset === 'production') {
                        setIncludeKerf(true);
                        setKerfWidth(0.125);
                        setBreakageBuffer(10);
                      } else if (preset === 'theoretical') {
                        setIncludeKerf(false);
                        setBreakageBuffer(5);
                      } else if (preset === 'conservative') {
                        setIncludeKerf(true);
                        setKerfWidth(0.1875);
                        setBreakageBuffer(15);
                      }
                    }}
                    className="border px-3 py-2 rounded w-full text-sm"
                  >
                    <option value="">Select Preset...</option>
                    <option value="theoretical">Theoretical Maximum</option>
                    <option value="production">Production Standard</option>
                    <option value="conservative">Conservative Estimate</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        {products.map((product, index) => (
          <div key={product.id} className="bg-gray-50 p-4 rounded shadow space-y-4 text-left relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="font-semibold text-gray-700">
                  {product.customName || `Product ${index + 1}`}
                </h3>
                {product.priority === 'high' && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">High Priority</span>
                )}
                {product.priority === 'low' && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Low Priority</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAdvancedPieceManagement(!showAdvancedPieceManagement)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  title="Advanced Options"
                >
                  ⚙️
                </button>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-red-600 font-bold text-xl hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {showAdvancedPieceManagement && (
              <div className="bg-blue-50 p-3 rounded border space-y-3">
                <h4 className="font-medium text-blue-800">Advanced Piece Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Kitchen Island, Master Bath"
                      value={product.customName || ""}
                      onChange={(e) => updateProduct(index, 'customName', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={product.priority || 'normal'}
                      onChange={(e) => updateProduct(index, 'priority', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    >
                      <option value="high">High Priority</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Project Phase</label>
                    <select
                      value={product.projectPhase || 'design'}
                      onChange={(e) => updateProduct(index, 'projectPhase', e.target.value)}
                      className="border px-3 py-2 rounded w-full text-sm"
                    >
                      <option value="design">Design Phase</option>
                      <option value="approved">Approved</option>
                      <option value="production">In Production</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              <select
                value={product.stone}
                onChange={(e) => updateProduct(index, 'stone', e.target.value)}
                className="border px-4 py-2 rounded"
              >
                <option value="">Select Stone Type...</option>
                {stoneOptions.map((stone, i) => (
                  <option key={i} value={stone["Stone Type"]}>{stone["Stone Type"]}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Width (in)"
                value={product.width}
                onChange={(e) => updateProduct(index, 'width', e.target.value)}
                className="border px-4 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Depth (in)"
                value={product.depth}
                onChange={(e) => updateProduct(index, 'depth', e.target.value)}
                className="border px-4 py-2 rounded"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Quantity"
                value={product.quantity}
                onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                className="border px-4 py-2 rounded"
              />
              <select
                value={product.edgeDetail}
                onChange={(e) => updateProduct(index, 'edgeDetail', e.target.value)}
                className="border px-4 py-2 rounded"
              >
                <option value="Eased">Eased</option>
                <option value="1.5 mitered">1.5" mitered</option>
                <option value="Bullnose">Bullnose</option>
                <option value="Ogee">Ogee</option>
                <option value="Beveled">Beveled</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleDrawingUpload(e, index)}
                className="border px-4 py-2 rounded"
                disabled={loadingAI}
              />
            </div>

            {loadingAI && (
              <div className="text-blue-600 font-medium">
                🤖 AI is extracting dimensions from your drawing...
              </div>
            )}

            <textarea
              placeholder="Notes (optional)"
              value={product.note || ""}
              onChange={(e) => updateProduct(index, 'note', e.target.value)}
              className="w-full border p-2 rounded mt-2"
              rows={2}
            />
          </div>
        ))}

        <div className="flex space-x-4 justify-center">
          <button
            onClick={addProduct}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Another Product
          </button>
          
          <button
            onClick={() => setShowAdvancedPieceManagement(!showAdvancedPieceManagement)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {showAdvancedPieceManagement ? 'Hide' : 'Show'} Advanced Options
          </button>
          
          <button
            onClick={calculateAll}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
          >
            Calculate with Optimization
          </button>
          
          {allResults.length > 0 && (
            <button
              onClick={generatePDF}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              Generate PDF Quote
            </button>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 p-4 rounded shadow-md space-y-4 text-left">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={userInfo?.name || ""}
              onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
              className="border px-4 py-2 rounded w-full"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={userInfo?.email || ""}
              onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
              className="border px-4 py-2 rounded w-full"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={userInfo?.phone || ""}
              onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
              className="border px-4 py-2 rounded w-full"
              required
            />
          </div>
        </div>

        {/* Results Section */}
        {allResults.length > 0 && (
          <div className="mt-6 w-full overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Optimized Results 
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({includeKerf ? `Production Mode (${kerfWidth}" kerf)` : 'Theoretical Mode (no kerf)'})
                </span>
              </h3>
              
              {/* Visual Layout Toggle */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={showVisualLayouts}
                    onChange={(e) => setShowVisualLayouts(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Show Visual Layouts</span>
                </label>
              </div>
            </div>

            {/* Visual Layouts for All Products */}
            {showVisualLayouts && (
              <div className="mb-6 space-y-6">
                {allResults.map((product, productIndex) => {
                  if (!product.result) return null;
                  
                  const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
                  const slabWidth = parseFloat(stone?.["Slab Width"]) || 126;
                  const slabHeight = parseFloat(stone?.["Slab Height"]) || 63;
                  
                  return (
                    <div key={productIndex} className="bg-white p-4 rounded border">
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Layout Preview: {product.customName || `Product ${productIndex + 1}`} - {product.stone} ({product.width}x{product.depth})
                      </h4>
                      
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Visual Layout */}
                        <div className="flex-1">
                          {product.result.topsPerSlab > 1 ? (
                            <MultiSlabVisualization 
                              pieces={Array(parseInt(product.quantity) || 1).fill().map((_, i) => ({
                                id: i + 1,
                                width: parseFloat(product.width) || 0,
                                depth: parseFloat(product.depth) || 0,
                                name: `${product.stone} #${i + 1}`
                              }))}
                              slabWidth={slabWidth}
                              slabHeight={slabHeight}
                              maxPiecesPerSlab={product.result.topsPerSlab}
                              includeKerf={includeKerf}
                              kerfWidth={kerfWidth}
                            />
                          ) : (
                            <SlabLayoutVisualization 
                              pieces={Array(Math.min(parseInt(product.quantity) || 1, product.result.topsPerSlab)).fill().map((_, i) => ({
                                id: i + 1,
                                width: parseFloat(product.width) || 0,
                                depth: parseFloat(product.depth) || 0,
                                name: `${product.stone} #${i + 1}`
                              }))}
                              slabWidth={slabWidth}
                              slabHeight={slabHeight}
                              maxPiecesPerSlab={product.result.topsPerSlab}
                              includeKerf={includeKerf}
                              kerfWidth={kerfWidth}
                            />
                          )}
                        </div>
                        
                        {/* Layout Analysis */}
                        <div className="w-full lg:w-64 bg-gray-50 p-4 rounded">
                          <h5 className="font-semibold mb-3">Layout Analysis</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-blue-200 border-2 border-blue-600"></div>
                              <span>Vertical: {product.width}x{product.depth}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-orange-200 border-2 border-orange-600"></div>
                              <span>Horizontal: {product.depth}x{product.width}</span>
                            </div>
                            {includeKerf && (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-red-200 border border-red-400"></div>
                                <span>Kerf: {kerfWidth}"</span>
                              </div>
                            )}
                            
                            <div className="pt-2 border-t space-y-1">
                              <div><strong>Max Pieces/Slab:</strong> {product.result.topsPerSlab}</div>
                              <div><strong>Total Quantity:</strong> {product.quantity}</div>
                              <div><strong>Efficiency:</strong> <span className="text-green-600 font-semibold">{product.result.efficiency?.toFixed(1) || '0'}%</span></div>
                              <div><strong>Slabs Needed:</strong> {product.result.totalSlabsNeeded}</div>
                              
                              {product.priority && product.priority !== 'normal' && (
                                <div className="pt-1">
                                  <strong>Priority:</strong> 
                                  <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                    product.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {product.priority === 'high' ? 'High' : 'Low'}
                                  </span>
                                </div>
                              )}
                              
                              {product.specialReq && product.specialReq !== 'none' && (
                                <div className="pt-1">
                                  <strong>Special Req:</strong>
                                  <div className="text-xs text-orange-600 mt-1">
                                    {product.specialReq.replace('-', ' ')}
                                  </div>
                                </div>
                              )}
                              
                              {product.installDate && (
                                <div className="pt-1">
                                  <strong>Install Date:</strong>
                                  <div className="text-xs text-blue-600 mt-1">
                                    {new Date(product.installDate).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Product Notes */}
                      {product.note && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <strong className="text-yellow-800">Notes:</strong>
                          <p className="text-sm text-yellow-700 mt-1">{product.note}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Export Controls */}
            <LayoutExportControls 
              allResults={allResults}
              products={products}
              stoneOptions={stoneOptions}
              includeKerf={includeKerf}
              kerfWidth={kerfWidth}
            />

            {/* Results Table */}
            <table className="min-w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">Product Name</th>
                  <th className="border px-4 py-2">Stone</th>
                  <th className="border px-4 py-2">Size</th>
                  <th className="border px-4 py-2">Qty</th>
                  <th className="border px-4 py-2">Priority</th>
                  <th className="border px-4 py-2">Edge</th>
                  <th className="border px-4 py-2">Area (sqft)</th>
                  <th className="border px-4 py-2">Tops/Slab</th>
                  <th className="border px-4 py-2">Slabs Needed</th>
                  <th className="border px-4 py-2">Efficiency</th>
                  <th className="border px-4 py-2">Material $</th>
                  <th className="border px-4 py-2">Fab $</th>
                  <th className="border px-4 py-2">Raw $</th>
                  <th className="border px-4 py-2">Final $</th>
                </tr>
              </thead>
              <tbody>
                {allResults.map((p, i) => (
                  <tr key={i} className="text-center">
                    <td className="border px-4 py-2 text-left">
                      <div className="font-medium">
                        {p.customName || `Product ${i + 1}`}
                      </div>
                      {p.specialReq && p.specialReq !== 'none' && (
                        <div className="text-xs text-orange-600">
                          {p.specialReq.replace('-', ' ')}
                        </div>
                      )}
                      {p.installDate && (
                        <div className="text-xs text-blue-600">
                          Install: {new Date(p.installDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="border px-4 py-2">{p.stone}</td>
                    <td className="border px-4 py-2">{p.width}×{p.depth}</td>
                    <td className="border px-4 py-2">{p.quantity}</td>
                    <td className="border px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.priority === 'high' ? 'bg-red-100 text-red-800' :
                        p.priority === 'low' ? 'bg-gray-100 text-gray-600' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {p.priority === 'high' ? 'High' : p.priority === 'low' ? 'Low' : 'Normal'}
                      </span>
                    </td>
                    <td className="border px-4 py-2">{p.edgeDetail}</td>
                    <td className="border px-4 py-2">{p.result?.usableAreaSqft?.toFixed(2) || 'N/A'}</td>
                    <td className="border px-4 py-2 font-semibold text-purple-600">
                      {p.result?.topsPerSlab || 'N/A'}
                    </td>
                    <td className="border px-4 py-2 font-semibold text-blue-600">
                      {p.result?.totalSlabsNeeded || 'N/A'}
                    </td>
                    <td className="border px-4 py-2">
                      <span className={`font-semibold ${
                        (p.result?.efficiency || 0) > 80 ? 'text-green-600' : 
                        (p.result?.efficiency || 0) > 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {p.result?.efficiency?.toFixed(1) || '0'}%
                      </span>
                    </td>
                    <td className="border px-4 py-2 font-semibold text-blue-700">
                      ${p.result?.materialCost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-4 py-2 font-semibold text-orange-600">
                      ${p.result?.fabricationCost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-4 py-2 font-semibold text-gray-700">
                      ${p.result?.rawCost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border px-4 py-2 font-semibold text-green-600">
                      ${p.result?.finalPrice?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={10} className="border px-4 py-2 text-right">Totals:</td>
                  <td className="border px-4 py-2 text-center text-blue-700">
                    ${allResults.reduce((sum, p) => sum + (p.result?.materialCost || 0), 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 text-center text-orange-600">
                    ${allResults.reduce((sum, p) => sum + (p.result?.fabricationCost || 0), 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 text-center text-gray-700">
                    ${allResults.reduce((sum, p) => sum + (p.result?.rawCost || 0), 0).toFixed(2)}
                  </td>
                  <td className="border px-4 py-2 text-center text-green-600">
                    ${allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h4 className="font-semibold text-blue-800">Total Slabs Needed</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <h4 className="font-semibold text-green-800">Average Efficiency</h4>
                <p className="text-2xl font-bold text-green-600">
                  {allResults.length > 0 ? 
                    (allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1) : 
                    '0'
                  }%
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <h4 className="font-semibold text-purple-800">Material Savings</h4>
                <p className="text-sm text-purple-600">vs. Standard Calculation</p>
                <p className="text-xl font-bold text-purple-600">Optimized!</p>
              </div>
            </div>

            {/* Stone Type Breakdown */}
            {[...new Set(allResults.map(r => r.stone))].length > 1 && (
              <div className="mt-6 bg-yellow-50 p-4 rounded">
                <h4 className="font-semibold text-yellow-800 mb-3">Multi-Stone Type Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...new Set(allResults.map(r => r.stone))].map(stoneType => {
                    const stoneProducts = allResults.filter(r => r.stone === stoneType);
                    const stoneTotal = stoneProducts.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0);
                    const stoneSlabs = stoneProducts.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
                    
                    return (
                      <div key={stoneType} className="bg-white p-3 rounded border">
                        <h5 className="font-semibold text-gray-800">{stoneType}</h5>
                        <div className="text-sm space-y-1">
                          <div>Products: {stoneProducts.length}</div>
                          <div>Slabs Needed: {stoneSlabs}</div>
                          <div>Subtotal: ${stoneTotal.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optimization Summary */}
            <div className="mt-6 bg-gray-50 p-4 rounded">
              <h4 className="font-semibold text-gray-800 mb-2">Optimization Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Mode:</strong> {includeKerf ? 'Production (with kerf)' : 'Theoretical (no kerf)'}</p>
                  <p><strong>Kerf Width:</strong> {includeKerf ? `${kerfWidth}"` : 'N/A'}</p>
                  <p><strong>Breakage Buffer:</strong> {breakageBuffer}%</p>
                </div>
                <div>
                  <p><strong>Algorithm:</strong> Mixed orientation optimization</p>
                  <p><strong>Efficiency Method:</strong> Maximum pieces per slab</p>
                  <p><strong>Waste Minimization:</strong> Advanced layout planning</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoneTopEstimator;
