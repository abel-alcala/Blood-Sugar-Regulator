import React, {useEffect, useRef, useState} from "react";

export default function BarcodeScanner({onAddFood, calculateFoodInsulin: calcFnProp}) {
    const defaultCalc = (carbs) => {
        const c = Number(carbs) || 0;
        if (c <= 0) return 0;
        const units = c / 12;
        return Math.round(units * 2) / 2;
    };
    const calculateFoodInsulin = typeof calcFnProp === "function" ? calcFnProp : defaultCalc;
    const [activeTab, setActiveTab] = useState("");
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const scanningRef = useRef(false);
    const rafRef = useRef(null);
    const detectorRef = useRef(null);
    const canvasRef = useRef(null);

    const [scanning, setScanning] = useState(false);
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
        setSupportedDetector(typeof window !== "undefined" && !!window.BarcodeDetector);
    }, []);

    useEffect(() => {
        const carbs = Number(carbsPerServing) || 0;
        const q = Number(quantity) || 0;
        const total = carbs * q;
        setTotalCarbs(Number(total.toFixed(1)));
        setInsulinUnits(Number(calculateFoodInsulin(total)));
    }, [carbsPerServing, quantity, calculateFoodInsulin]);

    useEffect(() => () => stopCamera(), []);

    async function startCamera() {
        try {
            setStatusMsg("Requesting camera permission...");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {facingMode: "environment", width: {ideal: 1280}, height: {ideal: 720}}, audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.muted = true;
                videoRef.current.playsInline = true;
                await waitForVideoToHaveData(videoRef.current);
                try {
                    await videoRef.current.play();
                } catch (err) {
                    console.warn("video.play() failed:", err);
                }
            }
            setScanning(true);
            setStatusMsg("Camera active. Initializing scanner...");
            if ("BarcodeDetector" in window) {
                try {
                    const formats = ["ean_13", "ean_8", "upc_e", "upc_a", "code_128"];
                    detectorRef.current = new window.BarcodeDetector({formats});
                } catch (err) {
                    console.warn("BarcodeDetector init failed:", err);
                    detectorRef.current = null;
                    setStatusMsg("BarcodeDetector exists but failed to initialize. Use upload/manual fallback.");
                }
                if (detectorRef.current) {
                    startScanLoop();
                } else {
                    setStatusMsg("Unavailable: use manual or image upload.");
                }
            } else {
                setStatusMsg("API not supported in this browser. Use manual or image upload");
            }
        } catch (err) {
            console.error("startCamera error:", err);
            setStatusMsg("Unable to access camera. Check permissions and secure context (https).");
            stopCamera();
        }
    }

    function stopCamera() {
        setScanning(false);
        scanningRef.current = false;
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            try {
                videoRef.current.pause();
            } catch {
            }
            videoRef.current.srcObject = null;
        }
        setStatusMsg("");
    }

    function waitForVideoToHaveData(videoEl, timeout = 3000) {
        return new Promise((resolve, reject) => {
            if (!videoEl) return reject(new Error("No video element"));
            if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) return resolve();
            let settled = false;
            const onLoaded = () => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve();
            };
            const onError = (ev) => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(new Error("Video failed to load metadata"));
            };
            const cleanup = () => {
                videoEl.removeEventListener("loadedmetadata", onLoaded);
                videoEl.removeEventListener("loadeddata", onLoaded);
                videoEl.removeEventListener("error", onError);
            };
            videoEl.addEventListener("loadedmetadata", onLoaded);
            videoEl.addEventListener("loadeddata", onLoaded);
            videoEl.addEventListener("error", onError);
            setTimeout(() => {
                if (settled) return;
                settled = true;
                cleanup();
                if (videoEl.videoWidth > 0) resolve(); else reject(new Error("Timed out waiting for video metadata"));
            }, timeout);
        });
    }

    function startScanLoop() {
        if (!videoRef.current || !detectorRef.current) {
            setStatusMsg("Scanner initialization failed.");
            return;
        }

        const v = videoRef.current;
        const w = v.videoWidth || 640;
        const h = v.videoHeight || 480;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvasRef.current = canvas;
        const ctx = canvas.getContext("2d");

        scanningRef.current = true;
        setStatusMsg("Scanning for barcode...");

        const loop = async () => {
            if (!scanningRef.current) return;
            if (!videoRef.current || videoRef.current.readyState < 2) {
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            try {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                let bitmap;
                try {
                    bitmap = await createImageBitmap(canvas);
                } catch (eBitmap) {
                    bitmap = canvas;
                }
                const results = await detectorRef.current.detect(bitmap);
                if (results && results.length > 0) {
                    const raw = results[0].rawValue || results[0].rawText || "";
                    console.debug("Barcode detected:", raw, results);
                    setBarcodeValue(raw);
                    setStatusMsg(`Scanned barcode: ${raw}`);
                    scanningRef.current = false;
                    stopCamera();
                    await handleBarcodeRaw(raw);
                    return;
                }
            } catch (err) {
                console.debug("Barcode detect error (ignored):", err);
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
    }

    async function handleImageUpload(file) {
        if (!file) return;
        setImgUploadPreview(URL.createObjectURL(file));
        setStatusMsg("Processing image...");
        if ("BarcodeDetector" in window) {
            try {
                const imageBitmap = await createImageBitmap(file);
                const detector = detectorRef.current || new window.BarcodeDetector();
                const results = await detector.detect(imageBitmap);
                if (results && results.length > 0) {
                    const raw = results[0].rawValue || results[0].rawText || "";
                    setBarcodeValue(raw);
                    setStatusMsg(`Detected barcode: ${raw}`);
                    await handleBarcodeRaw(raw);
                    return;
                } else {
                    setStatusMsg("No barcode detected in image. You can enter UPC manually.");
                }
            } catch (err) {
                console.warn("Image detect failed:", err);
                setStatusMsg("Barcode detection on image failed. Use manual UPC.");
            }
        } else {
            setStatusMsg("BarcodeDetector not supported. Use manual UPC entry.");
        }
    }

    const handleBarcodeRaw = async (raw) => {
        const bc = String(raw).trim();
        if (!bc) {
            setStatusMsg("Empty barcode.");
            return;
        }
        setStatusMsg("Looking up product...");
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
                if (carbServing) carbsServingFinal = Number(carbServing); else if (carbPer100) {
                    let gramsPerServing = null;
                    if (servingInfo) {
                        const m = servingInfo.match(/([\d.,]+)\s?g/i);
                        if (m && m[1]) gramsPerServing = parseFloat(m[1].replace(",", ".")); else {
                            const onlyNum = servingInfo.match(/([\d.,]+)/);
                            if (onlyNum && onlyNum[1]) gramsPerServing = parseFloat(onlyNum[1].replace(",", "."));
                        }
                    }
                    if (gramsPerServing) carbsServingFinal = (Number(carbPer100) * gramsPerServing) / 100; else carbsServingFinal = Number(carbPer100);
                } else carbsServingFinal = 0;

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
                setStatusMsg("Product loaded. Adjust serving/quantity if needed.");
            } else {
                setProduct(null);
                setCarbsPerServing(0);
                setStatusMsg("Product not found. Enter carbs manually.");
            }
        } catch (err) {
            console.error("Lookup failed:", err);
            setStatusMsg("Product lookup failed. Try again or enter carbs manually.");
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
        setStatusMsg("Added item.");
    };

    const handleManualLookupClick = async () => {
        if (!manualUPC) {
            setStatusMsg("Please enter a UPC code.");
            return;
        }
        setBarcodeValue(manualUPC.trim());
        await handleBarcodeRaw(manualUPC.trim());
    };

    return (<div className="barcode-scanner">
        <div className="card-header">
            <h2 className="card-title">
                <span className="card-title-icon"></span>🖼️ Barcode Scanner
            </h2>
            <div className="scanner-tabs">
                {/*<button
                    className={`btn ${activeTab === "camera" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("camera")}
                >
                    Camera
                </button>*/}
                <button
                    className={`btn ${activeTab === "upload" ? "btn-primary" : "btn-secondary"}`}
                    style={{position: 'relative', overflow: 'hidden', padding: '10px'}}
                >
                    🖼️ Image
                    <input
                        type="file"
                        accept="image/*"
                        className="upload-button"
                        onChange={e => {
                            handleImageUpload(e.target.files && e.target.files[0]);
                        }}
                    />
                </button>
                <button
                    className={`btn ${activeTab === "manual" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActiveTab("manual")}
                    style={{padding:'10px'}}
                >
                    ✏️ Barcode
                </button>
            </div>
        </div>

        <div className="scanner-groups">
            <div className="product-container">
                <div className="product-details">
                    <div className="product-header">
                        <div className="product-image">
                            {product && product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="product-img"/>) : ""}
                        </div>
                        <div className="product-title">
                            <div className="product-name">
                                {product ? product.name : ""}
                            </div>
                            <div className="product-brand">
                                {product ? (product.brand || "") : ""}
                            </div>
                        </div>
                    </div>


                    <div className="nutrition-inputs">
                        <div className="input-group">
                            <label className="form-label">Carbs per serving (g)</label>
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
                            <strong>Total carbs:</strong> <span className="nutrition-value">{totalCarbs} g</span>
                        </div>
                        <div className="nutrition-item">
                            <strong>Estimated insulin:</strong> <span
                            className="nutrition-value insulin-units">{insulinUnits} units</span>
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
        </div>

        <div className="barcode-group">
            {activeTab === "camera" && (<>
                {!scanning && (<button
                    onClick={startCamera}
                    className="btn btn-primary"
                >
                    Start Camera Scan
                </button>)}
                {scanning && (<div className="camera-container">
                    <video ref={videoRef} className="scanner-video" autoPlay muted playsInline/>
                    <div className="scanner-instruction">
                        Point camera at barcode to scan
                    </div>
                </div>)}
            </>)}

            {activeTab === "upload" && (<div className="upload-section">

            </div>)}

            {activeTab === "manual" && (<div className="manual-entry">
                <label className="form-label">Enter UPC manually</label>
                <div className="manual-input-group">
                    <input
                        value={manualUPC}
                        onChange={(e) => setManualUPC(e.target.value)}
                        placeholder="0123456789012"
                        className="form-input"
                    />
                    <button onClick={handleManualLookupClick} className="btn btn-secondary">
                        Lookup
                    </button>
                </div>
            </div>)}

            {statusMsg && (<div className="status-message" aria-live="polite">
                <strong>Status:</strong> <span>{statusMsg}</span>
            </div>)}
        </div>
    </div>);
}
