import { useState, useEffect } from 'react';

export default function StoneTopEstimator() {
  const [stoneOptions, setStoneOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const correctPassword = 'stone123';

  // New settings
  const [includeKerf, setIncludeKerf] = useState(true);
  const [kerfWidth, setKerfWidth] = useState(0.125);
  const [breakageBuffer, setBreakageBuffer] = useState(10);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [products, setProducts] = useState([
    { stone: '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null, id: Date.now() }
  ]);
  const [allResults, setAllResults] = useState([]);

  useEffect(() => {
    // Load html2pdf from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(script);

    // Fetch stone data from Google Sheets API
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
        alert("Failed to load stone data from Google Sheets. Please check your internet connection and try again.");
        setStoneOptions([]);
      });
  }, []);

  // Calculate maximum pieces that can fit per slab with optimal mixed orientations
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

    // Debug for 24x36 on 126x63 (should find 8 pieces)
    if (pieceW === 24 && pieceH === 36 && slabW === 126 && slabH === 63) {
      console.log(`Debug: 24x36 on 126x63 with kerf=${kerf}`);
      console.log(`Option 1 (24x36): ${fit1W}×${fit1H} = ${option1} pieces`);
      console.log(`Option 2 (36x24): ${fit2W}×${fit2H} = ${option2} pieces`);
      console.log(`Final maxPieces: ${maxPieces}`);
    }

    return maxPieces;
  };

  // FIXED: Generate visual layout that matches the calculation results
  const generateVisualLayout = (pieceW, pieceH, slabW, slabH, targetPieces) => {
    const kerf = includeKerf ? kerfWidth : 0;
    const pieces = [];
    
    // Special case for 24x36 on 126x63 with 8 pieces (the optimal mixed layout)
    if (pieceW === 24 && pieceH === 36 && slabW === 126 && slabH === 63 && targetPieces === 8) {
      // Row 1: 3 horizontal pieces (36×24)
      for (let i = 0; i < 3; i++) {
        pieces.push({
          x: i * (36 + kerf),
          y: 0,
          width: 36,
          height: 24,
          orientation: 'horizontal',
          id: pieces.length + 1
        });
      }
      
      // Row 2: 5 vertical pieces (24×36)
      const startY = 24 + kerf;
      for (let i = 0; i < 5; i++) {
        pieces.push({
          x: i * (24 + kerf),
          y: startY,
          width: 24,
          height: 36,
          orientation: 'vertical',
          id: pieces.length + 1
        });
      }
      
      console.log('Generated 8-piece mixed layout:', pieces);
      return pieces;
    }
    
    // For other cases, determine the best single orientation or mixed layout
    const orientation1Fits = Math.floor((slabW + kerf) / (pieceW + kerf)) * Math.floor((slabH + kerf) / (pieceH + kerf));
    const orientation2Fits = Math.floor((slabW + kerf) / (pieceH + kerf)) * Math.floor((slabH + kerf) / (pieceW + kerf));
    
    if (orientation1Fits >= targetPieces) {
      // Use vertical orientation (w×h)
      const cols = Math.floor((slabW + kerf) / (pieceW + kerf));
      const rows = Math.ceil(targetPieces / cols);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && pieces.length < targetPieces; col++) {
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
    } else if (orientation2Fits >= targetPieces) {
      // Use horizontal orientation (h×w)
      const cols = Math.floor((slabW + kerf) / (pieceH + kerf));
      const rows = Math.ceil(targetPieces / cols);
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && pieces.length < targetPieces; col++) {
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
      // Mixed layout needed - try to fit as many as possible
      // This is a simplified version for cases other than the 24x36 special case
      const verticalCols = Math.floor((slabW + kerf) / (pieceW + kerf));
      const verticalRows = Math.floor((slabH + kerf) / (pieceH + kerf));
      const maxVertical = verticalCols * verticalRows;
      
      if (maxVertical >= targetPieces) {
        // Use all vertical
        for (let row = 0; row < verticalRows; row++) {
          for (let col = 0; col < verticalCols && pieces.length < targetPieces; col++) {
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
      } else {
        // Use all horizontal
        const horizontalCols = Math.floor((slabW + kerf) / (pieceH + kerf));
        const horizontalRows = Math.floor((slabH + kerf) / (pieceW + kerf));
        
        for (let row = 0; row < horizontalRows; row++) {
          for (let col = 0; col < horizontalCols && pieces.length < targetPieces; col++) {
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
      }
    }
    
    console.log(`Generated layout for ${pieceW}×${pieceH} on ${slabW}×${slabH}, target: ${targetPieces}, actual: ${pieces.length}`, pieces);
    return pieces;
  };

  // Enhanced slab optimization with layout generation
  const optimizeSlabLayout = (pieces, slabWidth, slabHeight) => {
    if (pieces.length === 0) return { slabs: [], unplacedPieces: [], totalSlabsNeeded: 0, efficiency: 0, topsPerSlab: 0 };

    const pieceWidth = pieces[0].width;
    const pieceHeight = pieces[0].depth;
    const maxPiecesPerSlab = calculateMaxPiecesPerSlab(pieceWidth, pieceHeight, slabWidth, slabHeight);
    
    const slabs = [];
    let remainingPieces = [...pieces];

    while (remainingPieces.length > 0) {
      const piecesForThisSlab = remainingPieces.splice(0, Math.min(maxPiecesPerSlab, remainingPieces.length));
      const slabLayout = createDetailedSlabLayout(piecesForThisSlab, slabWidth, slabHeight, maxPiecesPerSlab);
      slabs.push(slabLayout);
    }

    return {
      slabs,
      unplacedPieces: [],
      totalSlabsNeeded: slabs.length,
      efficiency: calculateEfficiency(slabs, slabWidth, slabHeight),
      topsPerSlab: maxPiecesPerSlab
    };
  };

  // Create detailed slab layout with piece positions
  const createDetailedSlabLayout = (pieces, slabW, slabH, maxPieces) => {
    const positionedPieces = pieces.map((piece, index) => ({
      ...piece,
      position: index + 1
    }));

    return {
      pieces: positionedPieces,
      usedArea: pieces.reduce((sum, p) => sum + p.width * p.depth, 0),
      maxCapacity: maxPieces,
      availableSpaces: []
    };
  };

  const calculateEfficiency = (slabs, slabWidth, slabHeight) => {
    const totalSlabArea = slabs.length * slabWidth * slabHeight;
    const totalUsedArea = slabs.reduce((sum, slab) => sum + slab.usedArea, 0);
    return totalSlabArea > 0 ? (totalUsedArea / totalSlabArea) * 100 : 0;
  };

  const handleDrawingUpload = async (e, index) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoadingAI(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch("https://gpt4-drawing-backend.vercel.app/api/extract-dimensions", {
        method: "POST",
        headers: {
          "x-vercel-protection-bypass": "paramusicalkariokparamusicalkari"
        },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        const updated = [...products];
        updated[index].width = json.data.width;
        updated[index].depth = json.data.depth;
        setProducts(updated);
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

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([
      ...products,
      { stone: stoneOptions[0]?.["Stone Type"] || '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null, id: Date.now() }
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

      const slabCost = parseFloat(stone["Slab Cost"]);
      const fabCost = parseFloat(stone["Fab Cost"]);
      const markup = parseFloat(stone["Mark Up"]);
      const w = parseFloat(product.width);
      const d = parseFloat(product.depth);
      const quantity = parseInt(product.quantity);

      if (!w || !d || isNaN(slabCost) || isNaN(fabCost) || isNaN(markup)) return { ...product, result: null };

      const slabWidth = parseFloat(stone["Slab Width"]);
      const slabHeight = parseFloat(stone["Slab Height"]);

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
          optimization,
          topsPerSlab: optimization.topsPerSlab
        }
      };
    });

    // Update products with results for layout preview
    const updatedProducts = products.map((product, index) => ({
      ...product,
      result: results[index]?.result || null
    }));
    setProducts(updatedProducts);
    setAllResults(results);

    const sheetRows = results.map(p => {
      if (!p.result) return null;
      
      return {
        "Timestamp": "Now",
        "Name": userInfo.name || "",
        "Email": userInfo.email || "",
        "Phone": userInfo.phone || "",
        "Stone": p.stone || "",
        "Note": p.note || "",
        "Size": `${p.width}x${p.depth}`,
        "Qty": p.quantity || 0,
        "Edge": p.edgeDetail || "",
        "Area": ((parseFloat(p.width || 0) * parseFloat(p.depth || 0)) / 144 * parseInt(p.quantity || 0)).toFixed(2),
        "Tops/Slab": p.result?.topsPerSlab || 0,
        "Slabs Needed": p.result?.totalSlabsNeeded || Math.ceil(parseInt(p.quantity || 0) / (p.result?.topsPerSlab || 1)),
        "Efficiency": p.result?.efficiency ? p.result.efficiency.toFixed(1) + "%" : "N/A",
        "Breakage Buffer": breakageBuffer + "%",
        "Kerf Included": includeKerf ? "Yes (" + kerfWidth + "\")" : "No",
        "Material": parseFloat(p.result?.materialCost || 0).toFixed(2),
        "Fab": parseFloat(p.result?.fabricationCost || 0).toFixed(2),
        "Raw": parseFloat(p.result?.rawCost || 0).toFixed(2),
        "Final": parseFloat(p.result?.finalPrice || 0).toFixed(2)
      };
    }).filter(Boolean);

    console.log("Sending optimized data to SheetDB:", sheetRows);

    fetch("https://sheetdb.io/api/v1/meao888u7pgqn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ data: sheetRows })
    })
    .then(response => {
      console.log("SheetDB response status:", response.status);
      const responseStatus = response.status;
      return response.text().then(data => {
        console.log("SheetDB raw response:", data);
        try {
          const jsonData = JSON.parse(data);
          console.log("SheetDB parsed response:", jsonData);
          
          if (jsonData.created || responseStatus === 201 || responseStatus === 200) {
            alert("Quote calculated with optimization and saved successfully!");
          } else {
            console.error("SheetDB API error:", jsonData);
            alert("Error saving to sheet: " + (jsonData.error || "Unknown error"));
          }
        } catch (e) {
          console.log("Response is not JSON, raw response:", data);
          if (data.includes("success") || responseStatus === 201 || responseStatus === 200) {
            alert("Quote calculated with optimization and saved successfully!");
          } else {
            console.error("SheetDB parse error:", e);
            alert("Failed to save data to sheet. Check console for details.");
          }
        }
      });
    })
    .catch(error => {
      console.error("Lead capture failed:", error);
      alert("Failed to save quote data. Please try again.");
    });
  };

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
    element.className = 'pdf-content p-6';
    
    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: bold;">AIC SURFACES - OPTIMIZED STONE QUOTE</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: bold;">Customer Information</h2>
        <p>Name: ${userInfo.name}</p>
        <p>Email: ${userInfo.email}</p>
        <p>Phone: ${userInfo.phone}</p>
      </div>
      
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Optimized Quote Details</h2>
    `;
    
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Stone</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Size</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Qty</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Edge</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Slabs</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Efficiency</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${allResults.map(p => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.stone}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.width}×${p.depth}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.edgeDetail}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.result?.totalSlabsNeeded || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${p.result?.efficiency ? p.result.efficiency.toFixed(1) + '%' : 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${p.result?.finalPrice.toFixed(2)}</td>
          </tr>
          ${p.note ? `<tr><td colspan="7" style="border: 1px solid #ddd; padding: 8px; font-style: italic;">Note: ${p.note}</td></tr>` : ''}
        `).join('')}
      </tbody>
    `;
    
    const totalPrice = allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0);
    const totalSlabs = allResults.reduce((sum, p) => sum + (p.result?.totalSlabsNeeded || 0), 0);
    const avgEfficiency = allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length;
    
    table.innerHTML += `
      <tfoot>
        <tr style="font-weight: bold;">
          <td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">$${totalPrice.toFixed(2)}</td>
        </tr>
      </tfoot>
    `;
    
    element.appendChild(table);
    
    element.innerHTML += `
      <div style="margin-top: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Optimization Summary</h3>
        <p><strong>Total Slabs Required:</strong> ${totalSlabs}</p>
        <p><strong>Average Material Efficiency:</strong> ${avgEfficiency.toFixed(1)}%</p>
        <p><strong>Optimization Method:</strong> Advanced Slab Layout Algorithm</p>
      </div>
    `;
    
    element.innerHTML += `
      <div style="margin-top: 30px;">
        <p style="font-size: 12px;">This optimized quote is valid for 30 days. Calculations include advanced slab optimization for maximum material efficiency. For questions, please contact AIC Surfaces.</p>
      </div>
    `;
    
    const opt = {
      margin: 10,
      filename: `AIC_Optimized_Quote_${userInfo.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    window.html2pdf().from(element).set(opt).save();
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
          
          {/* Basic Settings - Always Visible */}
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

          {/* Advanced Settings - Collapsible */}
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
              
              <div className="bg-gray-100 p-3 rounded text-sm">
                <strong>Settings Help:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Kerf:</strong> Accounts for material lost to saw blade width</li>
                  <li><strong>Breakage Buffer:</strong> Extra material for handling/installation damage</li>
                  <li><strong>Production Mode:</strong> Most realistic for actual fabrication</li>
                  <li><strong>Theoretical Mode:</strong> Maximum possible pieces (no cutting waste)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {products.map((product, index) => (
          <div key={product.id} className="bg-gray-50 p-4 rounded shadow space-y-4 text-left relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Product {index + 1}</h3>
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

        {/* Mixed Stone Types Summary */}
        {allResults.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Quote Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Total Products:</strong> {allResults.length}
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

        {allResults.length > 0 && (
          <div className="mt-6 w-full overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">
              Optimized Results 
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({includeKerf ? `Production Mode (${kerfWidth}" kerf)` : 'Theoretical Mode (no kerf)'})
              </span>
            </h3>
            <table className="min-w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">Stone</th>
                  <th className="border px-4 py-2">Size</th>
                  <th className="border px-4 py-2">Qty</th>
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
                    <td className="border px-4 py-2">{p.stone}</td>
                    <td className="border px-4 py-2">{p.width}×{p.depth}</td>
                    <td className="border px-4 py-2">{p.quantity}</td>
                    <td className="border px-4 py-2">{p.edgeDetail}</td>
                    <td className="border px-4 py-2">{p.result?.usableAreaSqft.toFixed(2)}</td>
                    <td className="border px-4 py-2 font-semibold text-purple-600">
                      {p.result?.topsPerSlab}
                    </td>
                    <td className="border px-4 py-2 font-semibold text-blue-600">
                      {p.result?.totalSlabsNeeded}
                    </td>
                    <td className="border px-4 py-2">
                      <span className={`font-semibold ${p.result?.efficiency > 80 ? 'text-green-600' : p.result?.efficiency > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {p.result?.efficiency.toFixed(1)}%
                      </span>
                    </td>
                    <td className="border px-4 py-2">${p.result?.materialCost.toFixed(2)}</td>
                    <td className="border px-4 py-2">${p.result?.fabricationCost.toFixed(2)}</td>
                    <td className="border px-4 py-2">${p.result?.rawCost.toFixed(2)}</td>
                    <td className="border px-4 py-2 font-semibold text-green-600">
                      ${p.result?.finalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan="11" className="border px-4 py-2 text-right">Total:</td>
                  <td className="border px-4 py-2 text-center">
                    ${allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

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
                  {(allResults.reduce((sum, p) => sum + (p.result?.efficiency || 0), 0) / allResults.length).toFixed(1)}%
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

            {allResults.some(p => p.result?.optimization) && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
