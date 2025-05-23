import { useState, useEffect } from 'react';

export default function CleanStoneEstimator() {
  // Core state
  const [stoneOptions, setStoneOptions] = useState([]);
  const [products, setProducts] = useState([
    { stone: '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', note: '', result: null, id: Date.now() }
  ]);
  const [allResults, setAllResults] = useState([]);
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });

  // Settings state
  const [includeKerf, setIncludeKerf] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(0.125);
  const [breakageBuffer, setBreakageBuffer] = useState(10);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showLayoutPreviews, setShowLayoutPreviews] = useState(false);

  // Loading states
  const [loadingAI, setLoadingAI] = useState(false);

  // Admin state
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const correctPassword = 'stone123';

  // Load dependencies and data on mount
  useEffect(() => {
    // Load PDF library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);

    // Load stone data from Google Sheets
    loadStoneData();
  }, []);

  // Load stone data from Google Sheets
  const loadStoneData = async () => {
    try {
      const response = await fetch("https://opensheet.elk.sh/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/Sheet1");
      const data = await response.json();
      
      if (data && data.length > 0) {
        setStoneOptions(data);
        // Set first stone as default for new products
        setProducts(prev => prev.map(p => ({ ...p, stone: data[0]?.["Stone Type"] || '' })));
      } else {
        throw new Error('No stone data received');
      }
    } catch (error) {
      console.error("Failed to load stone data:", error);
      alert("Failed to load stone data from Google Sheets. Please check your internet connection and try again.");
      setStoneOptions([]);
    }
  };

  // UNIVERSAL OPTIMIZATION ALGORITHM
  const calculateMaxPiecesPerSlab = (pieceW, pieceH, slabW, slabH) => {
    const kerf = includeKerf ? kerfWidth : 0;
    let maxPieces = 0;

    // Option 1: All pieces vertical (w × h)
    const verticalCols = Math.floor(slabW / (pieceW + kerf));
    const verticalRows = Math.floor(slabH / (pieceH + kerf));
    const allVertical = verticalCols * verticalRows;
    maxPieces = Math.max(maxPieces, allVertical);

    // Option 2: All pieces horizontal (h × w)
    const horizontalCols = Math.floor(slabW / (pieceH + kerf));
    const horizontalRows = Math.floor(slabH / (pieceW + kerf));
    const allHorizontal = horizontalCols * horizontalRows;
    maxPieces = Math.max(maxPieces, allHorizontal);

    // Option 3: Mixed orientations - horizontal rows first, then vertical
    const maxHorizontalRowsPossible = Math.floor(slabH / (pieceW + kerf));
    for (let hRows = 1; hRows <= maxHorizontalRowsPossible; hRows++) {
      const horizontalSectionHeight = hRows * pieceW + (hRows - 1) * kerf;
      if (horizontalSectionHeight > slabH) continue;

      const horizontalPiecesPerRow = Math.floor(slabW / (pieceH + kerf));
      const totalHorizontalPieces = hRows * horizontalPiecesPerRow;

      const remainingHeight = slabH - horizontalSectionHeight;
      let totalVerticalPieces = 0;

      if (remainingHeight >= pieceH + kerf) {
        const verticalSectionHeight = remainingHeight - kerf;
        const verticalRows = Math.floor(verticalSectionHeight / (pieceH + kerf));
        const verticalPiecesPerRow = Math.floor(slabW / (pieceW + kerf));
        totalVerticalPieces = verticalRows * verticalPiecesPerRow;
      }

      const totalMixed = totalHorizontalPieces + totalVerticalPieces;
      maxPieces = Math.max(maxPieces, totalMixed);
    }

    // Option 4: Mixed orientations - vertical rows first, then horizontal
    const maxVerticalRowsPossible = Math.floor(slabH / (pieceH + kerf));
    for (let vRows = 1; vRows <= maxVerticalRowsPossible; vRows++) {
      const verticalSectionHeight = vRows * pieceH + (vRows - 1) * kerf;
      if (verticalSectionHeight > slabH) continue;

      const verticalPiecesPerRow = Math.floor(slabW / (pieceW + kerf));
      const totalVerticalPieces = vRows * verticalPiecesPerRow;

      const remainingHeight = slabH - verticalSectionHeight;
      let totalHorizontalPieces = 0;

      if (remainingHeight >= pieceW + kerf) {
        const horizontalSectionHeight = remainingHeight - kerf;
        const horizontalRows = Math.floor(horizontalSectionHeight / (pieceW + kerf));
        const horizontalPiecesPerRow = Math.floor(slabW / (pieceH + kerf));
        totalHorizontalPieces = horizontalRows * horizontalPiecesPerRow;
      }

      const totalMixed = totalVerticalPieces + totalHorizontalPieces;
      maxPieces = Math.max(maxPieces, totalMixed);
    }

    return maxPieces;
  };

  // Generate optimal layout for visualization
  const generateOptimalLayout = (pieceW, pieceH, slabW, slabH, maxPieces) => {
    const kerf = includeKerf ? kerfWidth : 0;
    const pieces = [];

    // Determine which layout achieves maxPieces
    const verticalCols = Math.floor(slabW / (pieceW + kerf));
    const verticalRows = Math.floor(slabH / (pieceH + kerf));
    const allVertical = verticalCols * verticalRows;

    const horizontalCols = Math.floor(slabW / (pieceH + kerf));
    const horizontalRows = Math.floor(slabH / (pieceW + kerf));
    const allHorizontal = horizontalCols * horizontalRows;

    if (maxPieces === allVertical && allVertical >= allHorizontal) {
      // Generate all vertical layout
      for (let row = 0; row < verticalRows && pieces.length < maxPieces; row++) {
        for (let col = 0; col < verticalCols && pieces.length < maxPieces; col++) {
          pieces.push({
            x: col * (pieceW + kerf),
            y: row * (pieceH + kerf),
            width: pieceW,
            height: pieceH,
            orientation: 'vertical',
            id: pieces.length + 1
          });
        }
      }
    } else if (maxPieces === allHorizontal) {
      // Generate all horizontal layout
      for (let row = 0; row < horizontalRows && pieces.length < maxPieces; row++) {
        for (let col = 0; col < horizontalCols && pieces.length < maxPieces; col++) {
          pieces.push({
            x: col * (pieceH + kerf),
            y: row * (pieceW + kerf),
            width: pieceH,
            height: pieceW,
            orientation: 'horizontal',
            id: pieces.length + 1
          });
        }
      }
    } else {
      // Generate mixed layout by finding the optimal combination
      let bestMixedLayout = null;

      // Try horizontal first, then vertical
      for (let hRows = 1; hRows <= Math.floor(slabH / (pieceW + kerf)); hRows++) {
        const horizontalSectionHeight = hRows * pieceW + (hRows - 1) * kerf;
        if (horizontalSectionHeight > slabH) continue;

        const horizontalPiecesPerRow = Math.floor(slabW / (pieceH + kerf));
        const totalHorizontalPieces = hRows * horizontalPiecesPerRow;

        const remainingHeight = slabH - horizontalSectionHeight;
        let totalVerticalPieces = 0;
        let verticalRows = 0;

        if (remainingHeight >= pieceH + kerf) {
          const verticalSectionHeight = remainingHeight - kerf;
          verticalRows = Math.floor(verticalSectionHeight / (pieceH + kerf));
          const verticalPiecesPerRow = Math.floor(slabW / (pieceW + kerf));
          totalVerticalPieces = verticalRows * verticalPiecesPerRow;
        }

        const totalMixed = totalHorizontalPieces + totalVerticalPieces;
        if (totalMixed === maxPieces) {
          bestMixedLayout = {
            type: 'h_then_v',
            hRows,
            vRows: verticalRows,
            totalHorizontalPieces,
            totalVerticalPieces
          };
          break;
        }
      }

      if (bestMixedLayout) {
        // Place horizontal pieces
        for (let row = 0; row < bestMixedLayout.hRows; row++) {
          const piecesPerRow = Math.floor(slabW / (pieceH + kerf));
          for (let col = 0; col < piecesPerRow && pieces.length < bestMixedLayout.totalHorizontalPieces; col++) {
            pieces.push({
              x: col * (pieceH + kerf),
              y: row * (pieceW + kerf),
              width: pieceH,
              height: pieceW,
              orientation: 'horizontal',
              id: pieces.length + 1
            });
          }
        }

        // Place vertical pieces below
        const startY = bestMixedLayout.hRows * pieceW + bestMixedLayout.hRows * kerf;
        for (let row = 0; row < bestMixedLayout.vRows; row++) {
          const piecesPerRow = Math.floor(slabW / (pieceW + kerf));
          for (let col = 0; col < piecesPerRow && pieces.length < maxPieces; col++) {
            pieces.push({
              x: col * (pieceW + kerf),
              y: startY + row * (pieceH + kerf),
              width: pieceW,
              height: pieceH,
              orientation: 'vertical',
              id: pieces.length + 1
            });
          }
        }
      }
    }

    return pieces;
  };

  // Main optimization function
  const optimizeSlabLayout = (pieces, slabWidth, slabHeight) => {
    if (pieces.length === 0) {
      return { slabs: [], totalSlabsNeeded: 0, efficiency: 0, topsPerSlab: 0 };
    }

    const pieceWidth = pieces[0].width;
    const pieceHeight = pieces[0].depth;
    const maxPiecesPerSlab = calculateMaxPiecesPerSlab(pieceWidth, pieceHeight, slabWidth, slabHeight);

    const slabs = [];
    let remainingPieces = [...pieces];

    while (remainingPieces.length > 0) {
      const piecesForThisSlab = remainingPieces.splice(0, Math.min(maxPiecesPerSlab, remainingPieces.length));
      slabs.push({
        pieces: piecesForThisSlab,
        usedArea: piecesForThisSlab.reduce((sum, p) => sum + p.width * p.depth, 0)
      });
    }

    const totalSlabArea = slabs.length * slabWidth * slabHeight;
    const totalUsedArea = slabs.reduce((sum, slab) => sum + slab.usedArea, 0);
    const efficiency = totalSlabArea > 0 ? (totalUsedArea / totalSlabArea) * 100 : 0;

    return {
      slabs,
      totalSlabsNeeded: slabs.length,
      efficiency,
      topsPerSlab: maxPiecesPerSlab
    };
  };

  // AI drawing upload handler
  const handleDrawingUpload = async (e, index) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setLoadingAI(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("https://gpt4-drawing-backend.vercel.app/api/extract-dimensions", {
        method: "POST",
        headers: { "x-vercel-protection-bypass": "paramusicalkariokparamusicalkari" },
        body: formData
      });
      
      const json = await response.json();
      if (json.success) {
        updateProduct(index, 'width', json.data.width);
        updateProduct(index, 'depth', json.data.depth);
        alert("Dimensions extracted successfully!");
      } else {
        alert("AI Error: " + (json.error || "Unexpected response"));
      }
    } catch (error) {
      console.error("AI extraction error:", error);
      alert("Failed to extract dimensions from drawing.");
    } finally {
      setLoadingAI(false);
    }
  };

  // Product management
  const updateProduct = (index, field, value) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const addProduct = () => {
    setProducts(prev => [
      ...prev,
      { 
        stone: stoneOptions[0]?.["Stone Type"] || '', 
        width: '', 
        depth: '', 
        quantity: 1, 
        edgeDetail: 'Eased', 
        note: '', 
        result: null, 
        id: Date.now() 
      }
    ]);
  };

  const removeProduct = (index) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Main calculation function
  const calculateAll = () => {
    console.log("Starting calculation...");
    
    const results = products.map((product) => {
      const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
      if (!stone) return { ...product, result: null };

      // Parse values
      const slabCost = parseFloat(stone["Slab Cost"]);
      const fabCost = parseFloat(stone["Fab Cost"]);
      const markup = parseFloat(stone["Mark Up"]);
      const slabWidth = parseFloat(stone["Slab Width"]);
      const slabHeight = parseFloat(stone["Slab Height"]);
      const width = parseFloat(product.width);
      const depth = parseFloat(product.depth);
      const quantity = parseInt(product.quantity);

      // Validate inputs
      if (!width || !depth || !slabWidth || !slabHeight || isNaN(slabCost) || isNaN(fabCost) || isNaN(markup)) {
        return { ...product, result: null };
      }

      // Create pieces array
      const pieces = Array(quantity).fill().map((_, i) => ({
        id: i + 1,
        width,
        depth,
        name: `${product.stone} #${i + 1}`
      }));

      // Run optimization
      const optimization = optimizeSlabLayout(pieces, slabWidth, slabHeight);
      
      // Calculate costs
      const area = width * depth;
      const usableAreaSqft = (area / 144) * quantity;
      const materialCost = (slabCost * optimization.totalSlabsNeeded) * (1 + breakageBuffer/100);
      const fabricationCost = usableAreaSqft * fabCost;
      const rawCost = materialCost + fabricationCost;
      const finalPrice = rawCost * markup;

      return {
        ...product,
        result: {
          usableAreaSqft,
          totalSlabsNeeded: optimization.totalSlabsNeeded,
          efficiency: optimization.efficiency,
          materialCost,
          fabricationCost,
          rawCost,
          finalPrice,
          topsPerSlab: optimization.topsPerSlab
        }
      };
    });

    // Update state with results
    setProducts(prev => prev.map((product, index) => ({
      ...product,
      result: results[index]?.result || null
    })));
    setAllResults(results);

    // Save to SheetDB
    saveToSheetDB(results);
  };

  // Save results to SheetDB
  const saveToSheetDB = async (results) => {
    const sheetRows = results
      .filter(p => p.result)
      .map(p => ({
        "Timestamp": new Date().toLocaleString(),
        "Name": userInfo.name || "",
        "Email": userInfo.email || "",
        "Phone": userInfo.phone || "",
        "Stone": p.stone || "",
        "Note": p.note || "",
        "Size": `${p.width}x${p.depth}`,
        "Qty": p.quantity || 0,
        "Edge": p.edgeDetail || "",
        "Area": ((parseFloat(p.width || 0) * parseFloat(p.depth || 0)) / 144 * parseInt(p.quantity || 0)).toFixed(2),
        "Tops/Slab": p.result.topsPerSlab || 0,
        "Slabs Needed": p.result.totalSlabsNeeded || 0,
        "Efficiency": p.result.efficiency ? p.result.efficiency.toFixed(1) + "%" : "N/A",
        "Breakage Buffer": breakageBuffer + "%",
        "Kerf Included": includeKerf ? `Yes (${kerfWidth}")` : "No",
        "Material": p.result.materialCost?.toFixed(2) || "0.00",
        "Fab": p.result.fabricationCost?.toFixed(2) || "0.00",
        "Raw": p.result.rawCost?.toFixed(2) || "0.00",
        "Final": p.result.finalPrice?.toFixed(2) || "0.00"
      }));

    try {
      const response = await fetch("https://sheetdb.io/api/v1/meao888u7pgqn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ data: sheetRows })
      });

      if (response.ok) {
        alert("Quote calculated and saved successfully!");
      } else {
        console.error("SheetDB error:", response.status);
        alert("Quote calculated but failed to save to database.");
      }
    } catch (error) {
      console.error("Failed to save to SheetDB:", error);
      alert("Quote calculated but failed to save to database.");
    }
  };

  // PDF generation
  const generatePDF = () => {
    if (allResults.length === 0) {
      alert("Please calculate estimates first");
      return;
    }

    if (!window.html2pdf) {
      alert("PDF generator is still loading. Please try again in a moment.");
      return;
    }

    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    
    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin-bottom: 10px;">AIC SURFACES - OPTIMIZED STONE QUOTE</h1>
        <p style="color: #666;">Date: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 5px;">Customer Information</h2>
        <p><strong>Name:</strong> ${userInfo.name || 'N/A'}</p>
        <p><strong>Email:</strong> ${userInfo.email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${userInfo.phone || 'N/A'}</p>
      </div>
      
      <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 5px;">Quote Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Stone</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Size</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Qty</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Tops/Slab</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Efficiency</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${allResults.filter(p => p.result).map(p => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">${p.stone}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${p.width}×${p.depth}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${p.quantity}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${p.result.topsPerSlab}</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${p.result.efficiency.toFixed(1)}%</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">$${p.result.finalPrice.toFixed(2)}</td>
            </tr>
            ${p.note ? `<tr><td colspan="6" style="border: 1px solid #ddd; padding: 10px; font-style: italic; background-color: #f9f9f9;">Note: ${p.note}</td></tr>` : ''}
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background-color: #f0f0f0; font-weight: bold;">
            <td colspan="5" style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total:</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">$${allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div style="margin-top: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
        <h3 style="color: #333; margin-bottom: 15px;">Optimization Summary</h3>
        <p><strong>Total Slabs Required:</strong> ${allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0)}</p>
        <p><strong>Average Material Efficiency:</strong> ${(allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1)}%</p>
        <p><strong>Optimization Method:</strong> Universal Mixed-Orientation Algorithm</p>
        <p><strong>Settings:</strong> ${includeKerf ? `Kerf: ${kerfWidth}"` : 'No Kerf'}, Breakage Buffer: ${breakageBuffer}%</p>
      </div>
      
      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        <p>This optimized quote is valid for 30 days. Calculations include advanced slab optimization for maximum material efficiency.</p>
        <p>For questions, please contact AIC Surfaces.</p>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `AIC_Quote_${userInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-white">AIC</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Stone Top Estimator</h1>
          <p className="text-gray-600">Advanced Slab Optimization System</p>
          <p className="text-sm text-gray-500">Developed by Roy Kariok</p>
        </div>

        {/* Admin Access */}
        {!adminMode && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin Password"
                className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setAdminMode(adminPassword === correctPassword)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Enter Admin Mode
              </button>
            </div>
          </div>
        )}

        {/* Optimization Settings */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-800">Optimization Settings</h2>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {showAdvancedSettings ? '▼ Hide Advanced' : '▶ Show Advanced'}
            </button>
          </div>
          
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeKerf"
                checked={includeKerf}
                onChange={(e) => setIncludeKerf(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="includeKerf" className="font-medium text-gray-700">
                Include Kerf (Saw Blade Width)
              </label>
              {includeKerf && (
                <span className="text-sm text-gray-600">({kerfWidth}")</span>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Mode:</strong> {includeKerf ? 'Production (with kerf)' : 'Theoretical (no kerf)'}
            </div>
          </div>

          {/* Advanced Settings */}
          {showAdvancedSettings && (
            <div className="border-t border-blue-200 pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Kerf Width</label>
                  <select
                    value={kerfWidth}
                    onChange={(e) => setKerfWidth(parseFloat(e.target.value))}
                    className="w-full border border-gray-300 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!includeKerf}
                  >
                    <option value={0.125}>1/8" (0.125) - Standard</option>
                    <option value={0.1875}>3/16" (0.1875) - Thick Material</option>
                    <option value={0.25}>1/4" (0.25) - Heavy Duty</option>
                    <option value={0.09375}>3/32" (0.094) - Thin Blade</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Breakage Buffer</label>
                  <select
                    value={breakageBuffer}
                    onChange={(e) => setBreakageBuffer(parseInt(e.target.value))}
                    className="w-full border border-gray-300 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5% - Conservative</option>
                    <option value={10}>10% - Standard</option>
                    <option value={15}>15% - High Risk</option>
                    <option value={20}>20% - Very High Risk</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Quick Presets</label>
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
                    className="w-full border border-gray-300 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Preset...</option>
                    <option value="theoretical">Theoretical Maximum</option>
                    <option value="production">Production Standard</option>
                    <option value="conservative">Conservative Estimate</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showLayoutPreviews}
                      onChange={(e) => setShowLayoutPreviews(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Layout Previews</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Visual piece placement</p>
                </div>
              </div>
              
              <div className="bg-gray-100 p-3 rounded text-sm">
                <strong className="text-gray-800">Settings Help:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                  <li><strong>Kerf:</strong> Accounts for material lost to saw blade width</li>
                  <li><strong>Breakage Buffer:</strong> Extra material for handling/installation damage</li>
                  <li><strong>Production Mode:</strong> Most realistic for actual fabrication</li>
                  <li><strong>Theoretical Mode:</strong> Maximum possible pieces (no cutting waste)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        {products.map((product, index) => (
          <div key={product.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Product {index + 1}</h3>
              {products.length > 1 && (
                <button
                  onClick={() => removeProduct(index)}
                  className="text-red-600 hover:text-red-800 font-bold text-xl transition-colors"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Stone Type</label>
                <select
                  value={product.stone}
                  onChange={(e) => updateProduct(index, 'stone', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Stone Type...</option>
                  {stoneOptions.map((stone, i) => (
                    <option key={i} value={stone["Stone Type"]}>{stone["Stone Type"]}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Width (inches)</label>
                <input
                  type="number"
                  placeholder="Width"
                  value={product.width}
                  onChange={(e) => updateProduct(index, 'width', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Depth (inches)</label>
                <input
                  type="number"
                  placeholder="Depth"
                  value={product.depth}
                  onChange={(e) => updateProduct(index, 'depth', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Quantity</label>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Edge Detail</label>
                <select
                  value={product.edgeDetail}
                  onChange={(e) => updateProduct(index, 'edgeDetail', e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Eased">Eased</option>
                  <option value="1.5 mitered">1.5" mitered</option>
                  <option value="Bullnose">Bullnose</option>
                  <option value="Ogee">Ogee</option>
                  <option value="Beveled">Beveled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">AI Drawing Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleDrawingUpload(e, index)}
                  disabled={loadingAI}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {loadingAI && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <div className="text-blue-600 font-medium">
                  🤖 AI is extracting dimensions from your drawing...
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Notes (optional)</label>
              <textarea
                placeholder="Add any special notes or requirements..."
                value={product.note}
                onChange={(e) => updateProduct(index, 'note', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Visual Layout Preview */}
            {showLayoutPreviews && product.stone && product.width && product.depth && product.result && (
              <div className="mt-4 bg-white border border-gray-300 rounded-lg p-4">
                <h5 className="font-semibold mb-3 text-gray-800">
                  Layout Preview: {product.stone} ({product.width}×{product.depth})
                </h5>
                
                <div className="flex items-start space-x-6">
                  {/* Slab Visual */}
                  <div className="relative">
                    {(() => {
                      try {
                        const slabData = stoneOptions.find(s => s["Stone Type"] === product.stone);
                        const slabWidth = parseFloat(slabData?.["Slab Width"]);
                        const slabHeight = parseFloat(slabData?.["Slab Height"]);
                        
                        if (!slabWidth || !slabHeight) {
                          return <div className="text-red-500 text-sm">Invalid slab dimensions</div>;
                        }
                        
                        const scale = Math.min(400 / slabWidth, 300 / slabHeight);
                        const displayWidth = slabWidth * scale;
                        const displayHeight = slabHeight * scale;
                        
                        const pieceWidth = parseFloat(product.width);
                        const pieceHeight = parseFloat(product.depth);
                        const topsPerSlab = product.result.topsPerSlab;
                        
                        const layoutPieces = generateOptimalLayout(pieceWidth, pieceHeight, slabWidth, slabHeight, topsPerSlab);
                        
                        return (
                          <div 
                            className="relative border-2 border-gray-800 bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400"
                            style={{ width: displayWidth, height: displayHeight }}
                          >
                            {/* Grid lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                              <defs>
                                <pattern id={`grid-${index}`} width={scale * 12} height={scale * 12} patternUnits="userSpaceOnUse">
                                  <path d={`M ${scale * 12} 0 L 0 0 0 ${scale * 12}`} fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
                            </svg>
                            
                            {/* Pieces */}
                            {layoutPieces.slice(0, Math.min(product.quantity, topsPerSlab)).map((piece, pieceIndex) => {
                              const isHorizontal = piece.orientation === 'horizontal';
                              
                              return (
                                <div
                                  key={pieceIndex}
                                  className={`absolute border-2 flex items-center justify-center text-xs font-bold
                                    ${isHorizontal ? 'border-orange-600 bg-orange-200 text-orange-800' : 'border-blue-600 bg-blue-200 text-blue-800'}`}
                                  style={{
                                    left: piece.x * scale,
                                    top: piece.y * scale,
                                    width: piece.width * scale,
                                    height: piece.height * scale,
                                    fontSize: Math.max(8, Math.min(12, scale * 1.2))
                                  }}
                                >
                                  <div className="text-center">
                                    <div>{pieceIndex + 1}</div>
                                    <div className="text-xs opacity-75">
                                      {piece.width}×{piece.height}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Kerf lines */}
                            {includeKerf && layoutPieces.map((piece, pieceIndex) => (
                              <div key={`kerf-${pieceIndex}`}>
                                {/* Right kerf */}
                                {piece.x + piece.width < slabWidth - 0.1 && (
                                  <div
                                    className="absolute bg-red-500 opacity-60"
                                    style={{
                                      left: (piece.x + piece.width) * scale,
                                      top: piece.y * scale,
                                      width: Math.max(1, kerfWidth * scale),
                                      height: piece.height * scale
                                    }}
                                  />
                                )}
                                {/* Bottom kerf */}
                                {piece.y + piece.height < slabHeight - 0.1 && (
                                  <div
                                    className="absolute bg-red-500 opacity-60"
                                    style={{
                                      left: piece.x * scale,
                                      top: (piece.y + piece.height) * scale,
                                      width: piece.width * scale,
                                      height: Math.max(1, kerfWidth * scale)
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                            
                            {/* Dimensions */}
                            <div className="absolute -top-6 left-0 right-0 text-center text-xs text-gray-600">
                              {slabWidth}"
                            </div>
                            <div className="absolute top-0 bottom-0 -left-8 flex items-center">
                              <div className="transform -rotate-90 text-xs text-gray-600">
                                {slabHeight}"
                              </div>
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error('Layout preview error:', error);
                        return <div className="text-red-500 text-sm">Error generating preview</div>;
                      }
                    })()}
                  </div>
                  
                  {/* Stats */}
                  <div className="text-sm space-y-2 min-w-48">
                    <div className="font-semibold text-gray-800 mb-3">Layout Analysis</div>
                    
                    {/* Legend */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-200 border border-blue-600"></div>
                        <span>Vertical: {product.width}×{product.depth}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-200 border border-orange-600"></div>
                        <span>Horizontal: {product.depth}×{product.width}</span>
                      </div>
                      {includeKerf && (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-red-500 opacity-60"></div>
                          <span>Kerf: {kerfWidth}"</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="pt-2 border-t space-y-1 text-gray-700">
                      <div><strong>Max Pieces/Slab:</strong> {product.result.topsPerSlab}</div>
                      <div><strong>Efficiency:</strong> <span className={`font-semibold ${product.result.efficiency > 80 ? 'text-green-600' : product.result.efficiency > 60 ? 'text-yellow-600' : 'text-red-600'}`}>{product.result.efficiency.toFixed(1)}%</span></div>
                      <div><strong>Slabs Needed:</strong> {product.result.totalSlabsNeeded}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={addProduct}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Add Another Product
          </button>
          
          <button
            onClick={calculateAll}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
          >
            Calculate with Optimization
          </button>
          
          {allResults.length > 0 && (
            <button
              onClick={generatePDF}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Generate PDF Quote
            </button>
          )}
        </div>

        {/* Quote Summary */}
        {allResults.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-purple-800">Quote Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Products:</strong> {allResults.length}
              </div>
              <div>
                <strong>Stone Types:</strong> {[...new Set(allResults.map(r => r.stone))].length}
              </div>
              <div>
                <strong>Total Pieces:</strong> {allResults.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)}
              </div>
              <div>
                <strong>Total Quote:</strong> ${allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={userInfo.name}
                onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={userInfo.email}
                onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={userInfo.phone}
                onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        {allResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Optimized Results 
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({includeKerf ? `Production Mode (${kerfWidth}" kerf)` : 'Theoretical Mode (no kerf)'})
              </span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">Stone</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Size</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Edge</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Area (sqft)</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Tops/Slab</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Slabs Needed</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Efficiency</th>
                    <th className="border border-gray-300 px-3 py-2 text-right">Final Price</th>
                  </tr>
                </thead>
                <tbody>
                  {allResults.filter(p => p.result).map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{p.stone}</td>
                      <td className="border border-gray-300 px-3 py-2">{p.width}×{p.depth}</td>
                      <td className="border border-gray-300 px-3 py-2">{p.quantity}</td>
                      <td className="border border-gray-300 px-3 py-2">{p.edgeDetail}</td>
                      <td className="border border-gray-300 px-3 py-2">{p.result.usableAreaSqft.toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 font-semibold text-purple-600">
                        {p.result.topsPerSlab}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-semibold text-blue-600">
                        {p.result.totalSlabsNeeded}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span className={`font-semibold ${p.result.efficiency > 80 ? 'text-green-600' : p.result.efficiency > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {p.result.efficiency.toFixed(1)}%
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-semibold text-green-600">
                        ${p.result.finalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan="8" className="border border-gray-300 px-3 py-2 text-right">Total:</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ${allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-blue-800 mb-2">Total Slabs Needed</h4>
                <p className="text-3xl font-bold text-blue-600">
                  {allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0)}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-green-800 mb-2">Average Efficiency</h4>
                <p className="text-3xl font-bold text-green-600">
                  {allResults.length > 0 ? (allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-purple-800 mb-2">Optimization</h4>
                <p className="text-lg font-bold text-purple-600">Universal Algorithm</p>
                <p className="text-sm text-purple-600">Mixed Orientations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
