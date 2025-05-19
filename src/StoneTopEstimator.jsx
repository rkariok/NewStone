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
    fetch("https://opensheet.elk.sh/1g8w934dZH-NEuKfK8wg_RZYiXyLSSf87H0Xwec6KAAc/Sheet1")
      .then((res) => res.json())
      .then((data) => {
        setStoneOptions(data);
        setProducts((prev) =>
          prev.map((p) => ({ ...p, stone: data[0]?.["Stone Type"] || '' }))
        );
      });
  }, []);

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
    } catch {
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

      const area = w * d;
      const usableAreaSqft = (area / 144) * quantity;
      const slabWidth = parseFloat(stone["Slab Width"]) || 63;
    const slabHeight = parseFloat(stone["Slab Height"]) || 126;
    const topsPerSlab = Math.floor((slabWidth * slabHeight) / area);
      const materialCost = (slabCost / topsPerSlab) * quantity * 1.10; // 10% buffer for breakage
      const fabricationCost = usableAreaSqft * fabCost;
      const rawCost = materialCost + fabricationCost;
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

    // Prepare lead + quote data for Google Sheets
    const payload = {
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      quoteItems: results.map(p => ({
        stone: p.stone,
        note: p.note,
        size: `${p.width}x${p.depth}`,
        quantity: p.quantity,
        edge: p.edgeDetail,
        area: ((p.width * p.depth) / 144 * p.quantity).toFixed(2),
        topsPerSlab: p.result?.topsPerSlab || 0,
        slabsNeeded: Math.ceil(p.quantity / p.result?.topsPerSlab || 1),
        materialCost: p.result?.materialCost?.toFixed(2) || 0,
        fabCost: p.result?.fabricationCost?.toFixed(2) || 0,
        rawCost: p.result?.rawCost?.toFixed(2) || 0,
        finalPrice: p.result?.finalPrice?.toFixed(2) || 0
      }))
    };

    fetch("https://script.google.com/macros/s/AKfycbwibWI-bxOgeRtIKDE-l-tNhs2Js5gpt93EgOqIjFjRgECls8_8oYkr8DJQ3m6FgkSDLw/exec", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(res => res.text()).then(data => {
      console.log("Lead captured:", data);
    }).catch(err => {
      console.error("Lead capture failed:", err);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl space-y-6 text-center">
        
        


        
<div className="text-center mb-4">
  <img src="/AIC.jpg" alt="Logo" className="mx-auto mb-2" style={{ maxWidth: '140px' }} />
  <h1 className="text-base font-medium text-gray-700">Developed by Roy Kariok</h1>
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
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Enter Admin Mode
            </button>
          </div>
        )}

        {products.map((product, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded shadow space-y-4 text-left">
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
                <option value="1.5” mitered">1.5” mitered</option>
              </select>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleDrawingUpload(e, index)}
                className="border px-4 py-2 rounded"
              />
            </div>

            
            <textarea
              placeholder="Notes (optional)"
              value={product.note || ""}
              onChange={(e) => updateProduct(index, 'note', e.target.value)}
              className="w-full border p-2 rounded mt-2"
              rows={2}
            />

            {products.length > 1 && (
              <button type="button" onClick={() => removeProduct(index)} className="text-red-600 font-bold text-xl absolute top-2 right-2">&times;</button>
            ) && (
              <button
                type="button"
                onClick={() => removeProduct(index)}
                className="text-red-600 text-sm"
              >
                Remove Product
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded"
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


        <button
          onClick={calculateAll}
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Calculate All
        </button>

        {allResults.length > 0 && (
          <div className="mt-6 w-full">
            <table className="min-w-full table-fixed border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-4 py-2">Stone</th>
<th className="border px-4 py-2">Note</th>
                  <th className="border px-4 py-2">Size</th>
                  <th className="border px-4 py-2">Qty</th>
                  <th className="border px-4 py-2">Edge</th>
                  <th className="border px-4 py-2">Area (sqft)</th>
                  <th className="border px-4 py-2">Tops/Slab</th>
<th className="border px-4 py-2">Slabs Needed</th>
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
<td className="border px-4 py-2">{p.note || ""}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
            
      </div>
  );
}