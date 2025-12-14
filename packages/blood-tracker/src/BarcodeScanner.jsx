import React, {useEffect, useRef, useState} from "react";

export default function BarcodeScanner({onAddFood, calculateFoodInsulin: calcFnProp}) {
    const defaultCalc = (carbs) => {
        const c = Number(carbs) || 0;
        if (c <= 0) return 0;
        const units = c / 12;
        return Math.round(units * 2) / 2;
    };
    const calculateFoodInsulin = typeof calcFnProp === "function" ? calcFnProp : defaultCalc;

    const [activeTab, setActiveTab] = useState("manual");
    const videoRef = useRef(null);
    const detectorRef = useRef(null);
    const intervalRef = useRef(null);

    const [statusMsg, setStatusMsg] = useState("");
    const [supportedDetector, setSupportedDetector] = useState(false);

    const [barcodeValue, setBarcodeValue] = useState("");
    const [product, setProduct] = useState(null);
    const [imgUploadPreview, setImgUploadPreview] = useState(null);
    const [manualUPC, setManualUPC] = useState("");

    const [servingSize, setServingSize] = useState("");
    const [carbsPerServing, setCarbsPerServing] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [totalCarbs, setTotalCarbs] = useState(0);
    const [insulinUnits, setInsulinUnits] = useState(0);

    useEffect(() => {
        const isSupported = typeof window !== "undefined" && "BarcodeDetector" in window;
        setSupportedDetector(isSupported);
        if (!isSupported) {
            setActiveTab("manual");
            setStatusMsg("Barcode Detector not supported by this browser. Use Manual entry.");
        } else {
            try {
                detectorRef.current = new window.BarcodeDetector({
                    formats: ["ean_13", "ean_8", "upc_a", "upc_e"]
                });
            } catch (e) {
                detectorRef.current = new window.BarcodeDetector();
            }
        }
    }, []);

    useEffect(() => {
        if (activeTab === "scan" && supportedDetector) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => stopCamera();
    }, [activeTab, supportedDetector]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {facingMode: "environment"}
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    startScanning();
                };
            }
        } catch (err) {
            console.error("Camera failed", err);
            setStatusMsg("Could not access camera. Please allow permissions or use Manual.");
        }
    };

    const stopCamera = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startScanning = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(async () => {
            if (videoRef.current && detectorRef.current && !videoRef.current.paused && videoRef.current.readyState === 4) {
                try {
                    const codes = await detectorRef.current.detect(videoRef.current);
                    if (codes && codes.length > 0) {
                        const raw = codes[0].rawValue;
                        handleBarcodeRaw(raw);
                        stopCamera();
                    }
                } catch (err) {
                    console.warn("Detection error:", err);
                }
            }
        }, 200);
    };

    useEffect(() => {
        const carbs = Number(carbsPerServing) || 0;
        const q = Number(quantity) || 0;
        const total = carbs * q;
        setTotalCarbs(Number(total.toFixed(1)));
        setInsulinUnits(Number(calculateFoodInsulin(total)));
    }, [carbsPerServing, quantity, calculateFoodInsulin]);

    const handleBarcodeRaw = async (raw) => {
        const bc = String(raw).trim();
        if (!bc) return;

        setBarcodeValue(bc);

        try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(bc)}.json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            if (json.status === 1 && json.product) {
                const p = json.product;
                const rawN = p.nutriments || {};

                const carbServing = rawN["carbohydrates_serving"];
                const carbPer100 = rawN["carbohydrates_100g"] || rawN["carbohydrates"];
                const servingInfo = p.serving_size || "";

                let carbsServingFinal = 0;

                if (carbServing) {
                    carbsServingFinal = Number(carbServing);
                } else if (carbPer100) {
                    let gramsPerServing = null;
                    if (servingInfo) {
                        const m = servingInfo.match(/([\d.,]+)\s?g/i);
                        if (m && m[1]) {
                            gramsPerServing = parseFloat(m[1].replace(",", "."));
                        } else {
                            const onlyNum = servingInfo.match(/([\d.,]+)/);
                            if (onlyNum && onlyNum[1]) gramsPerServing = parseFloat(onlyNum[1].replace(",", "."));
                        }
                    }
                    if (gramsPerServing) {
                        carbsServingFinal = (Number(carbPer100) * gramsPerServing) / 100;
                    } else {
                        carbsServingFinal = Number(carbPer100);
                    }
                }

                setProduct({
                    code: bc,
                    name: p.product_name || p.generic_name || "Unknown product",
                    brand: (p.brands || "").split(",")[0] || "",
                    imageUrl: (p.image_small_url || p.image_url) || null,
                    serving: servingInfo,
                    nutriments: rawN,
                    rawProduct: p,
                });
                setCarbsPerServing(Number((carbsServingFinal || 0).toFixed(1)));
                setQuantity(1);
                setActiveTab("info")
            } else {
                setProduct(null);
                setCarbsPerServing(0);
                setActiveTab("manual");
                setStatusMsg("Product not found. Please enter details manually.");
            }
        } catch (err) {
            console.error("Lookup failed:", err);
        }
    };

    const handleAdd = () => {
        const name = product ? `${product.name}${product.brand ? ` — ${product.brand}` : ""}` : `Barcode ${barcodeValue || manualUPC}`;
        const carbs = Number(totalCarbs) || 0;
        const insulin = Number(calculateFoodInsulin(carbs)) || 0;

        const payload = {
            name,
            carbs,
            insulin,
            quantity: Number(quantity) || 0,
            servingSize: product ? product.serving : servingSize,
            barcode: barcodeValue || manualUPC,
            rawProduct: product ? product.rawProduct : null,
        };

        if (typeof onAddFood === "function") onAddFood(payload);

        setProduct(null);
        setBarcodeValue("");
        setActiveTab("scan")
        setManualUPC("");
        setCarbsPerServing(0);
        if (activeTab === "scan") startScanning();
    };

    return (
        <div className="barcode-scanner">
            <div className="card-header">
                <h2 className="card-title">
                    <span className="card-title-icon"></span> Add Food
                </h2>
                <div className="scanner-tabs">
                    {supportedDetector && (
                        <button
                            className={`btn scanner-tab-btn ${activeTab === "manual" ? "btn-primary" : "btn-secondary"}`}
                            onClick={() => setActiveTab("manual")}
                        >
                            ✏️ Manual
                        </button>
                    )}
                    <button
                        className={`btn scanner-tab-btn ${activeTab === "scan" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setActiveTab("scan")}
                    >
                        📷 Scan
                    </button>
                </div>
            </div>

            <div className="scanner-groups">
                <div className="barcode-group">
                    {activeTab === "scan" && (
                        <div className="camera-container">
                            <video
                                ref={videoRef}
                                className="scanner-video"
                                muted
                                playsInline
                            />
                            <div className="scanner-guideline"></div>
                        </div>
                    )}

                    {activeTab === "manual" && (
                        <div className="manual-entry">
                            <label className="form-label">Enter UPC manually</label>
                            <div className="manual-input-group">
                                <input
                                    value={manualUPC}
                                    onChange={(e) => setManualUPC(e.target.value)}
                                    placeholder="0123456789012"
                                    className="form-input"
                                />
                                <button
                                    onClick={() => handleBarcodeRaw(manualUPC.trim())}
                                    className="btn btn-secondary"
                                >
                                    Lookup
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "manual" && statusMsg && (
                        <div className="status-message" aria-live="polite">
                            <strong>Status:</strong> <span>{statusMsg}</span>
                        </div>
                    )}

                    {product && activeTab === "info" && (
                        <div className="product-container">
                            <div className="product-details">
                                <div className="product-header">
                                    <div className="product-image">
                                        {product.imageUrl && (
                                            <img src={product.imageUrl} alt={product.name} className="product-img"/>
                                        )}
                                    </div>
                                    <div className="product-title">
                                        <div className="product-name">{product.name}</div>
                                        <div className="product-brand">{product.brand}</div>
                                        <div className="product-info">{product.serving}</div>
                                    </div>
                                </div>

                                <div className="nutrition-inputs">
                                    <div className="input-group">
                                        <label className="form-label">Carbs / serving (g)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={carbsPerServing}
                                            onChange={(e) => setCarbsPerServing(Number(e.target.value))}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.25"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="form-input quantity-input"
                                        />
                                    </div>
                                </div>

                                <div className="nutrition-summary">
                                    <div className="nutrition-item">
                                        <strong>Total carbs:</strong>
                                        <span className="nutrition-value">{totalCarbs} g</span>
                                    </div>
                                    <div className="nutrition-item">
                                        <strong>Estimated insulin:</strong>
                                        <span className="nutrition-value insulin-units">{insulinUnits} units</span>
                                    </div>
                                </div>

                                <div className="add-button-container">
                                    <button
                                        onClick={handleAdd}
                                        className="btn btn-primary add-food-btn"
                                        disabled={totalCarbs <= 0}
                                    >
                                        ➕ Add to Food List
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}