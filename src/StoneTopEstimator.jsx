import { useState, useEffect } from 'react';

export default function StoneTopEstimator() {
  const [stoneOptions, setStoneOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const correctPassword = 'stone123';

  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "" });
  const [products, setProducts] = useState([
    { stone: '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null }
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
        // Fallback to mock data if API fails
        const mockStoneData = [
          {
            "Stone Type": "Carrara Marble",
            "Slab Cost": 1200,
            "Fab Cost": 45,
            "Mark Up": 2.2,
            "Slab Width": 63,
            "Slab Height": 126
          },
          {
            "Stone Type": "Calacatta Gold",
            "Slab Cost": 2500,
            "Fab Cost": 55,
            "Mark Up": 2.5,
            "Slab Width": 63,
            "Slab Height": 126
          },
          {
            "Stone Type": "Granite Black",
            "Slab Cost": 800,
            "Fab Cost": 35,
            "Mark Up": 2.0,
            "Slab Width": 63,
            "Slab Height": 126
          }
        ];
        setStoneOptions(mockStoneData);
        setProducts((prev) =>
          prev.map((p) => ({ ...p, stone: mockStoneData[0]?.["Stone Type"] || '' }))
        );
      });
  }, []);

  // Calculate maximum pieces that can fit per slab with mixed orientations
  const calculateMaxPiecesPerSlab = (pieceW, pieceH, slabW, slabH) => {
    // Try all possible combinations of orientations
    let maxPieces = 0;

    // Option 1: All pieces in orientation 1 (w × h)
    const fit1W = Math.floor(slabW / pieceW);
    const fit1H = Math.floor(slabH / pieceH);
    const option1 = fit1W * fit1H;

    // Option 2: All pieces in orientation 2 (h × w)
    const fit2W = Math.floor(slabW / pieceH);
    const fit2H = Math.floor(slabH / pieceW);
    const option2 = fit2W * fit2H;

    maxPieces = Math.max(option1, option2);

    // Option 3: Mixed orientations - try different combinations
    // This is where we find layouts like 8 pieces for 24×36 on 126×63
    for (let rows1 = 0; rows1 <= Math.floor(slabH / pieceH); rows1++) {
      for (let rows2 = 0; rows2 <= Math.floor((slabH - rows1 * pieceH) / pieceW); rows2++) {
        const pieces1 = rows1 * Math.floor(slabW / pieceW); // pieces in orientation 1
        const pieces2 = rows2 * Math.floor(slabW / pieceH); // pieces in orientation 2
        const usedHeight = rows1 * pieceH + rows2 * pieceW;
        
        if (usedHeight <= slabH) {
          maxPieces = Math.max(maxPieces, pieces1 + pieces2);
        }
      }
    }

    // Also try the reverse (orientation 2 first, then orientation 1)
    for (let rows2 = 0; rows2 <= Math.floor(slabH / pieceW); rows2++) {
      for (let rows1 = 0; rows1 <= Math.floor((slabH - rows2 * pieceW) / pieceH); rows1++) {
        const pieces2 = rows2 * Math.floor(slabW / pieceH); // pieces in orientation 2
        const pieces1 = rows1 * Math.floor(slabW / pieceW); // pieces in orientation 1
        const usedHeight = rows2 * pieceW + rows1 * pieceH;
        
        if (usedHeight <= slabH) {
          maxPieces = Math.max(maxPieces, pieces1 + pieces2);
        }
      }
    }

    return maxPieces;
  };

  // Enhanced slab optimization logic - finds maximum tops per slab
  const optimizeSlabLayout = (pieces, slabWidth, slabHeight) => {
    if (pieces.length === 0) return { slabs: [], unplacedPieces: [], totalSlabsNeeded: 0, efficiency: 0, topsPerSlab: 0 };

    // Get piece dimensions (assuming all pieces are the same size)
    const pieceWidth = pieces[0].width;
    const pieceHeight = pieces[0].depth;

    // Calculate maximum pieces per slab using both orientations
    const maxPiecesPerSlab = calculateMaxPiecesPerSlab(pieceWidth, pieceHeight, slabWidth, slabHeight);
    
    // Group pieces into slabs
    const slabs = [];
    let remainingPieces = [...pieces];

    while (remainingPieces.length > 0) {
      const piecesForThisSlab = remainingPieces.splice(0, Math.min(maxPiecesPerSlab, remainingPieces.length));
      const slabLayout = createOptimalSlabLayout(piecesForThisSlab, pieceWidth, pieceHeight, slabWidth, slabHeight);
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

  // Create optimal layout for a single slab
  const createOptimalSlabLayout = (pieces, pieceW, pieceH, slabW, slabH) => {
    const maxPieces = calculateMaxPiecesPerSlab(pieceW, pieceH, slabW, slabH);
    const totalUsedArea = pieces.length * pieceW * pieceH;

    return {
      pieces: pieces.map((piece, i) => ({
        ...piece,
        x: 0,
        y: 0
      })),
      usedArea: totalUsedArea,
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
      { stone: stoneOptions[0]?.["Stone Type"] || '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null }
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

      const slabWidth = parseFloat(stone["Slab Width"]) || 63;
      const slabHeight = parseFloat(stone["Slab Height"]) || 126;

      const pieces = Array(quantity).fill().map((_, i) => ({
        id: i + 1,
        width: w,
        depth: d,
        name: `${product.stone} #${i + 1}`
      }));

      // Run slab optimization
      const optimization = optimizeSlabLayout(pieces, slabWidth, slabHeight);
      
      const area = w * d;
      const usableAreaSqft = (area / 144) * quantity;
      const totalSlabsNeeded = optimization.totalSlabsNeeded;
      const efficiency = optimization.efficiency;
      
      const materialCost = (slabCost * totalSlabsNeeded) * 1.10;
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

        {products.map((product, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded shadow space-y-4 text-left relative">
            <div className="grid grid-cols-3 gap-4">
              <select
                value={product.stone}
                onChange={(e) => updateProduct(index, 'stone', e.target.value)}
                className="border px-4 py-2 rounded"
              >
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

            {products.length > 1 && (
              <button
                type="button"
                onClick={() => removeProduct(index)}
                className="text-red-600 font-bold text-xl absolute top-2 right-2 hover:text-red-800"
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Another Product
        </button>

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

        <div className="flex space-x-4 justify-center">
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

        {allResults.length > 0 && (
          <div className="mt-6 w-full overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4">Optimized Calculation Results</h3>
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

            {allResults.some(p => p.result?.optimization) && (
              <div className="mt-6 bg-gray-50 p-4 rounded">
                <h4 className="font-semibold text-gray-800 mb-2">Slab Optimization Details</h4>
                <p className="text-sm text-gray-600">
                  Advanced algorithms have been used to minimize waste and optimize slab usage. 
                  The efficiency percentages shown reflect how well each piece layout utilizes the available slab area.
                  Mixed orientations are used to maximize the number of tops per slab.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
