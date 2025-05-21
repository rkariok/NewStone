import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import SlabVisualization from './SlabVisualization';

// Utility function for calculating tops per slab with mixed orientation
function mixedOrientationTopsPerSlab(slabWidth, slabHeight, topWidth, topHeight, kerf = 0.25) {
  let placements = 0;
  const placed = [];

  function tryPlace(w, h) {
    for (let y = 0; y <= slabHeight - h; y += kerf) {
      for (let x = 0; x <= slabWidth - w; x += kerf) {
        let fits = true;
        for (const p of placed) {
          if (
            x < p.x + p.w + kerf &&
            x + w + kerf > p.x &&
            y < p.y + p.h + kerf &&
            y + h + kerf > p.y
          ) {
            fits = false;
            break;
          }
        }
        if (fits) {
          placed.push({ x, y, w, h });
          return true;
        }
      }
    }
    return false;
  }

  while (true) {
    const placedNormal = tryPlace(topWidth, topHeight);
    const placedRotated = !placedNormal && tryPlace(topHeight, topWidth);
    if (placedNormal || placedRotated) {
      placements++;
    } else {
      break;
    }
  }

  return placements;
}

// Component for customer information
function CustomerInfoForm({ userInfo, setUserInfo }) {
  return (
    <div className="bg-gray-50 p-4 rounded shadow-md space-y-4 text-left">
      <h2 className="text-lg font-semibold">Customer Information</h2>
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
  );
}

// Component for each product input
function ProductInput({ product, index, stoneOptions, updateProduct, removeProduct, handleDrawingUpload, loadingAI }) {
  return (
    <div className="bg-gray-50 p-4 rounded shadow space-y-4 text-left relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          placeholder="Quantity"
          value={product.quantity}
          onChange={(e) => updateProduct(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
          className="border px-4 py-2 rounded"
          min="1"
        />
        <select
          value={product.edgeDetail}
          onChange={(e) => updateProduct(index, 'edgeDetail', e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="Eased">Eased</option>
          <option value="1.5 mitered">1.5" Mitered</option>
          <option value="2 mitered">2" Mitered</option>
          <option value="2.5 mitered">2.5" Mitered</option>
          <option value="3 mitered">3" Mitered</option>
          <option value="Ogee">Ogee</option>
          <option value="Bullnose">Bullnose</option>
        </select>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleDrawingUpload(e, index)}
            className="border px-4 py-2 rounded w-full"
            disabled={loadingAI}
          />
          {loadingAI && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      <textarea
        placeholder="Notes (optional)"
        value={product.note || ""}
        onChange={(e) => updateProduct(index, 'note', e.target.value)}
        className="w-full border p-2 rounded mt-2"
        rows={2}
      />

      <button
        type="button"
        onClick={() => removeProduct(index)}
        className="absolute top-2 right-2 text-red-600 hover:text-red-800 transition-colors"
        title="Remove this product"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Results table component
function ResultsTable({ results }) {
  if (!results || results.length === 0) return null;
  
  const totalPrice = results.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0);
  
  return (
    <div className="mt-6 w-full overflow-x-auto">
      <table className="min-w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Stone</th>
            <th className="border px-4 py-2">Size</th>
            <th className="border px-4 py-2">Qty</th>
            <th className="border px-4 py-2">Edge</th>
            <th className="border px-4 py-2">Area (sqft)</th>
            <th className="border px-4 py-2">Tops/Slab</th>
            <th className="border px-4 py-2">Slabs</th>
            <th className="border px-4 py-2">Material $</th>
            <th className="border px-4 py-2">Fab $</th>
            <th className="border px-4 py-2">Raw $</th>
            <th className="border px-4 py-2">Final $</th>
          </tr>
        </thead>
        <tbody>
          {results.map((p, i) => (
            <>
              <tr key={i} className="text-center hover:bg-gray-100">
                <td className="border px-4 py-2">{p.stone}</td>
                <td className="border px-4 py-2">{p.width}x{p.depth}</td>
                <td className="border px-4 py-2">{p.quantity}</td>
                <td className="border px-4 py-2">{p.edgeDetail}</td>
                <td className="border px-4 py-2">{p.result?.usableAreaSqft.toFixed(2)}</td>
                <td className="border px-4 py-2">{p.result?.topsPerSlab}</td>
                <td className="border px-4 py-2">{Math.ceil(p.quantity / p.result?.topsPerSlab)}</td>
                <td className="border px-4 py-2">${p.result?.materialCost.toFixed(2)}</td>
                <td className="border px-4 py-2">${p.result?.fabricationCost.toFixed(2)}</td>
                <td className="border px-4 py-2">${p.result?.rawCost.toFixed(2)}</td>
                <td className="border px-4 py-2 font-semibold">${p.result?.finalPrice.toFixed(2)}</td>
              </tr>
              {p.note && (
                <tr className="text-center bg-gray-50">
                  <td colSpan="11" className="border px-4 py-2 text-left italic">
                    Note: {p.note}
                  </td>
                </tr>
              )}
            </>
          ))}
          <tr className="text-center font-bold bg-gray-200">
            <td colSpan="10" className="border px-4 py-2 text-right">TOTAL:</td>
            <td className="border px-4 py-2">${totalPrice.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Admin login form
function AdminLogin({ adminPassword, setAdminPassword, validatePassword }) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <p className="mb-2 text-blue-800">Enter admin password to access additional features:</p>
      <div className="flex">
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Admin Password"
          className="border px-4 py-2 rounded flex-grow"
        />
        <button
          onClick={validatePassword}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
      </div>
    </div>
  );
}

  // Main component
export default function StoneTopEstimator() {
  // State declarations
  const [stoneOptions, setStoneOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const correctPassword = 'stone123';

  const [userInfo, setUserInfo] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: ""
  });
  
  const [products, setProducts] = useState([
    { stone: '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null }
  ]);
  
  const [allResults, setAllResults] = useState([]);
  const resultsSectionRef = useRef(null);

  // Effects
  useEffect(() => {
    setLoading(true);
    fetch("https://opensheet.elk.sh/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/Sheet1")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch stone options");
        }
        return res.json();
      })
      .then((data) => {
        setStoneOptions(data);
        setProducts((prev) =>
          prev.map((p) => ({ ...p, stone: data[0]?.["Stone Type"] || '' }))
        );
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch stone options:", error);
        setError("Failed to load stone options. Please refresh and try again.");
        setLoading(false);
      });
  }, []);

  // Scroll to results when they're available
  useEffect(() => {
    if (allResults.length > 0 && resultsSectionRef.current) {
      resultsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allResults]);

  // Handlers
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
      } else {
        alert("AI Error: " + (json.error || "Unexpected response"));
      }
    } catch (error) {
      console.error("Drawing upload error:", error);
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
    if (products.length === 1) {
      alert("You must have at least one product.");
      return;
    }
    setProducts(products.filter((_, i) => i !== index));
  };

  const validatePassword = () => {
    if (adminPassword === correctPassword) {
      setAdminMode(true);
      setShowAdvancedOptions(true);
    } else {
      alert("Incorrect password");
    }
  };

  const calculateAll = () => {
    // Validate required fields
    if (!userInfo.name || !userInfo.email || !userInfo.phone) {
      alert("Please fill out all customer information fields.");
      return;
    }

    const invalidProducts = products.filter(product => 
      !product.stone || !product.width || !product.depth || !product.quantity
    );

    if (invalidProducts.length > 0) {
      alert("Please fill out all fields for each product (stone type, width, depth, and quantity).");
      return;
    }

    // Calculate results
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

      // Use the more accurate calculation function
      const area = w * d;
      const usableAreaSqft = (area / 144) * quantity;
      const slabWidth = parseFloat(stone["Slab Width"]) || 63;
      const slabHeight = parseFloat(stone["Slab Height"]) || 126;
      
      // Use the mixedOrientationTopsPerSlab function for better accuracy
      const topsPerSlab = mixedOrientationTopsPerSlab(slabWidth, slabHeight, w, d, 0.25);
      
      const materialCost = (slabCost / topsPerSlab) * quantity * 1.10; // 10% buffer for breakage
      const fabricationCost = usableAreaSqft * fabCost;
      
      // Add edge detail cost calculation
      let edgeCostMultiplier = 1.0;
      if (product.edgeDetail.includes("mitered")) {
        const inchSize = parseFloat(product.edgeDetail);
        edgeCostMultiplier = 1.0 + (inchSize * 0.15); // Increase cost based on miter size
      } else if (product.edgeDetail === "Ogee") {
        edgeCostMultiplier = 1.3; // 30% more for Ogee
      } else if (product.edgeDetail === "Bullnose") {
        edgeCostMultiplier = 1.25; // 25% more for Bullnose
      }
      
      const rawCost = materialCost + (fabricationCost * edgeCostMultiplier);
      const finalPrice = rawCost * markup;

      return {
        ...product,
        result: {
          usableAreaSqft,
          topsPerSlab,
          materialCost,
          fabricationCost,
          rawCost,
          finalPrice
        }
      };
    });

    setAllResults(results);

    // Save to SheetDB
    const sheetRows = results.map(p => {
      if (!p.result) return null;
      
      const currentDate = new Date();
      
      return {
        "Timestamp": "Now", // Use "Now" as shown in your sheet
        "Name": userInfo.name || "",
        "Email": userInfo.email || "",
        "Phone": userInfo.phone || "",
        "Address": userInfo.address || "",
        "City": userInfo.city || "",
        "State": userInfo.state || "",
        "Zip": userInfo.zip || "",
        "Stone": p.stone || "",
        "Note": p.note || "",
        "Size": `${p.width}x${p.depth}`,
        "Qty": p.quantity || 0,
        "Edge": p.edgeDetail || "",
        "Area": ((parseFloat(p.width || 0) * parseFloat(p.depth || 0)) / 144 * parseInt(p.quantity || 0)).toFixed(2),
        "Tops/Slab": p.result?.topsPerSlab || 0,
        "Slabs Needed": Math.ceil(parseInt(p.quantity || 0) / (p.result?.topsPerSlab || 1)),
        "Material": parseFloat(p.result?.materialCost || 0).toFixed(2),
        "Fab": parseFloat(p.result?.fabricationCost || 0).toFixed(2),
        "Raw": parseFloat(p.result?.rawCost || 0).toFixed(2),
        "Final": parseFloat(p.result?.finalPrice || 0).toFixed(2)
      };
    }).filter(Boolean);

    console.log("Sending data to SheetDB:", sheetRows);
    setSaveStatus('saving');

    // Save to SheetDB
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
        try {
          const jsonData = JSON.parse(data);
          console.log("SheetDB parsed response:", jsonData);
          
          if (jsonData.created || responseStatus === 201 || responseStatus === 200) {
            setSaveStatus('success');
          } else {
            console.error("SheetDB API error:", jsonData);
            setSaveStatus('error');
            alert("Error saving to sheet: " + (jsonData.error || "Unknown error"));
          }
        } catch (e) {
          console.log("Response is not JSON, raw response:", data);
          if (data.includes("success") || responseStatus === 201 || responseStatus === 200) {
            setSaveStatus('success');
          } else {
            console.error("SheetDB parse error:", e);
            setSaveStatus('error');
            alert("Failed to save data to sheet. Check console for details.");
          }
        }
      });
    })
    .catch(error => {
      console.error("Lead capture failed:", error);
      setSaveStatus('error');
      alert("Failed to save quote data. Please try again.");
    });
  };

  const generatePDF = () => {
    if (allResults.length === 0) {
      alert("Please calculate estimates first");
      return;
    }

    const element = document.createElement('div');
    element.className = 'pdf-content p-6';
    
    // Add company logo and header
    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; font-weight: bold; color: #2a4365;">AIC SURFACES - STONE QUOTE</h1>
        <p>Quote Date: ${new Date().toLocaleDateString()}</p>
        <p style="font-size: 14px; margin-top: 5px;">Valid for 30 days</p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 20px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px;">Customer Information</h2>
        <div style="display: flex; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px;">
            <p><strong>Name:</strong> ${userInfo.name}</p>
            <p><strong>Email:</strong> ${userInfo.email}</p>
            <p><strong>Phone:</strong> ${userInfo.phone}</p>
          </div>
          <div style="flex: 1; min-width: 250px;">
            ${userInfo.address ? `<p><strong>Address:</strong> ${userInfo.address}</p>` : ''}
            ${userInfo.city || userInfo.state ? `<p><strong>City/State:</strong> ${userInfo.city}${userInfo.city && userInfo.state ? ', ' : ''}${userInfo.state} ${userInfo.zip || ''}</p>` : ''}
          </div>
        </div>
      </div>
      
      <h2 style="font-size: 20px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Quote Details</h2>
    `;
    
    // Create table for products
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Add table header
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Stone</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Size</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Qty</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Edge</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Area (sqft)</th>
          <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${allResults.map(p => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">${p.stone}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${p.width}x${p.depth}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${p.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${p.edgeDetail}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${p.result?.usableAreaSqft.toFixed(2)}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">$${p.result?.finalPrice.toFixed(2)}</td>
          </tr>
          ${p.note ? `<tr><td colspan="6" style="border: 1px solid #ddd; padding: 10px; font-style: italic;">Note: ${p.note}</td></tr>` : ''}
        `).join('')}
      </tbody>
    `;
    
    // Add total
    const totalPrice = allResults.reduce((sum, p) => sum + (p.result?.finalPrice || 0), 0);
    table.innerHTML += `
      <tfoot>
        <tr style="font-weight: bold;">
          <td colspan="5" style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total:</td>
          <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">$${totalPrice.toFixed(2)}</td>
        </tr>
      </tfoot>
    `;
    
    element.appendChild(table);
    
    // Add footer
    element.innerHTML += `
      <div style="margin-top: 50px; font-size: 12px; color: #666;">
        <p><strong>Terms & Conditions:</strong></p>
        <ul style="padding-left: 20px;">
          <li>This quote is valid for 30 days from the date above.</li>
          <li>50% deposit required to begin fabrication.</li>
          <li>Final payment due upon installation.</li>
          <li>Material colors may vary from samples due to natural stone variation.</li>
        </ul>
        <p style="margin-top: 15px;">For questions, please contact AIC Surfaces at (555) 123-4567 or info@aicsurfaces.com</p>
      </div>
    `;
    
    // Generate PDF
    const opt = {
      margin: 15,
      filename: `AIC_Quote_${userInfo.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save();
  };

  const resetForm = () => {
    if (window.confirm("Are you sure you want to clear the form and start a new quote?")) {
      setUserInfo({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "" });
      setProducts([{ stone: stoneOptions[0]?.["Stone Type"] || '', width: '', depth: '', quantity: 1, edgeDetail: 'Eased', result: null }]);
      setAllResults([]);
      setSaveStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/AIC.jpg" alt="AIC Surfaces Logo" className="mx-auto mb-2" style={{ maxWidth: '160px' }} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Stone Top Estimator</h1>
          <p className="text-gray-600">Calculate accurate quotes for stone countertops and surfaces</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading stone options...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded relative text-center my-6">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Admin Login */}
            {!adminMode && (
              <AdminLogin 
                adminPassword={adminPassword} 
                setAdminPassword={setAdminPassword} 
                validatePassword={validatePassword} 
              />
            )}

        {/* Customer Information */}
        <CustomerInfoForm userInfo={userInfo} setUserInfo={setUserInfo} />

        {/* Additional Fields (shown when in admin mode) */}
        {showAdvancedOptions && (
          <div className="bg-gray-50 p-4 rounded shadow-md space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Additional Customer Information</h2>
              <button 
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                {showAdvancedOptions ? "Hide" : "Show"} Additional Fields
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                value={userInfo?.address || ""}
                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                className="border px-4 py-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="City"
                value={userInfo?.city || ""}
                onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                className="border px-4 py-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="State"
                value={userInfo?.state || ""}
                onChange={(e) => setUserInfo({ ...userInfo, state: e.target.value })}
                className="border px-4 py-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={userInfo?.zip || ""}
                onChange={(e) => setUserInfo({ ...userInfo, zip: e.target.value })}
                className="border px-4 py-2 rounded w-full"
              />
            </div>
          </div>
        )}

        {/* Products */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stone Products</h2>
            <button
              onClick={addProduct}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Product
            </button>
          </div>

          {products.map((product, index) => (
            <ProductInput
              key={index}
              product={product}
              index={index}
              stoneOptions={stoneOptions}
              updateProduct={updateProduct}
              removeProduct={removeProduct}
              handleDrawingUpload={handleDrawingUpload}
              loadingAI={loadingAI}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <button
            onClick={calculateAll}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 transition-colors"
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Calculating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                Calculate Quote
              </>
            )}
          </button>
          
          {allResults.length > 0 && (
            <>
              <button
                onClick={generatePDF}
                className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Generate PDF Quote
              </button>
              
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                New Quote
              </button>
            </>
          )}
        </div>

        {/* Save Status Indicator */}
        {saveStatus === 'success' && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline"> Quote calculated and saved successfully.</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> There was a problem saving your quote. Please try again.</span>
          </div>
        )}

        {/* Results Table */}
        <div ref={resultsSectionRef}>
          <ResultsTable results={allResults} />
          
          {/* Visualization of first product's layout */}
          {allResults.length > 0 && allResults[0].result && (
            <div className="mt-8 bg-white p-4 rounded-lg shadow">
              {allResults.map((product, index) => {
                const stone = stoneOptions.find(s => s["Stone Type"] === product.stone);
                if (!stone) return null;
                
                const slabWidth = parseFloat(stone["Slab Width"]) || 63;
                const slabHeight = parseFloat(stone["Slab Height"]) || 126;
                
                return (
                  <div key={index} className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">{product.stone} - {product.width}" × {product.depth}"</h3>
                    <SlabVisualization 
                      width={slabWidth}
                      height={slabHeight}
                      topWidth={parseFloat(product.width)}
                      topHeight={parseFloat(product.depth)}
                      quantity={parseInt(product.quantity)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Tools Section */}
        {adminMode && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium mb-2">Stone Inventory</h3>
                <p className="text-sm text-gray-700 mb-3">View and manage your stone inventory data from Google Sheets.</p>
                
                <a 
                  href="https://docs.google.com/spreadsheets/d/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/edit" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded inline-block hover:bg-blue-700 transition-colors"
                >
                  Open Inventory Sheet
                </a>
              </div>
              
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium mb-2">Quote History</h3>
                <p className="text-sm text-gray-700 mb-3">View all saved quotes and customer information.</p>
                
                <a 
                  href="https://sheetdb.io/api/v1/meao888u7pgqn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded inline-block hover:bg-blue-700 transition-colors"
                >
                  View Quote History
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
          <p>AIC Surfaces Stone Top Estimator &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">Developed by Roy Kariok</p>
        </div>
      </div>
    </div>
  );
}
