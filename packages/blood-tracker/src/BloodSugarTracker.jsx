import React, {useEffect, useState} from 'react';
import './page.css';
import BarcodeScanner from "./BarcodeScanner";

const BloodSugarTracker = () => {
    const [manualBloodSugar, setManualBloodSugar] = useState(0);
    const [currentBloodSugar, setCurrentBloodSugar] = useState(0);
    const [feedback, setFeedback] = useState({show: false, message: '', type: ''});

    const [foodItems, setFoodItems] = useState([]);
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = localStorage.getItem('bs_favorites');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Save favorites whenever they change
    useEffect(() => {
        localStorage.setItem('bs_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const [activeListTab, setActiveListTab] = useState('current'); // 'current' | 'favorites'

    const [foodName, setFoodName] = useState('');
    const [carbs, setCarbs] = useState('');
    const displayValue = manualBloodSugar.toString().padStart(3, '0');
    const hundreds = Math.floor(manualBloodSugar / 100) % 10;
    const tens = Math.floor((manualBloodSugar % 100) / 10);
    const ones = manualBloodSugar % 10;

    const [CarbsTens, setCarbsTens] = useState(0);
    const [CarbsOnes, setCarbsOnes] = useState(0);
    const [CarbsDisplayValue, setCarbsDisplayValue] = useState('00');

    useEffect(() => {
        const value = CarbsTens * 10 + CarbsOnes;
        setCarbsDisplayValue(value.toString().padStart(2, '0'));
        setCarbs(String(value));
    }, [CarbsTens, CarbsOnes]);

    const regulateSugar = (bloodSugar) => {
        if (bloodSugar < 70) return -1; else if (bloodSugar >= 70 && bloodSugar <= 139) return 0; else if (bloodSugar >= 140 && bloodSugar <= 179) return 0.5; else if (bloodSugar >= 180 && bloodSugar <= 219) return 1; else if (bloodSugar >= 220 && bloodSugar <= 259) return 1.5; else if (bloodSugar >= 260 && bloodSugar <= 299) return 2; else if (bloodSugar >= 300 && bloodSugar <= 339) return 2.5; else if (bloodSugar >= 340 && bloodSugar <= 379) return 3; else if (bloodSugar >= 380 && bloodSugar <= 419) return 3.5; else if (bloodSugar >= 420 && bloodSugar <= 459) return 4; else if (bloodSugar >= 460 && bloodSugar <= 499) return 4.5; else if (bloodSugar >= 500 && bloodSugar <= 539) return 5; else return -999;
    };

    const calculateFoodInsulin = (carbs) => {
        const c = Number(carbs) || 0;
        if (c <= 0) return 0;
        const units = c / 12;
        const rounded = Math.round(units * 2) / 2;
        return parseFloat(rounded.toFixed(1));
    };

    const getAlertClass = (type) => {
        switch (type) {
            case 'normal':
                return 'alert alert-normal';
            case 'warning':
                return 'alert alert-warning';
            case 'danger':
                return 'alert alert-danger';
            default:
                return 'alert';
        }
    };

    const setBloodSugarFromDigits = () => {
        const bs = manualBloodSugar;
        if (bs <= 0) {
            setFeedback({show: true, message: "Enter a valid blood sugar level", type: "danger"});
            return;
        }
        setCurrentBloodSugar(bs);
        const units = regulateSugar(bs);

        if (units === -1) {
            setFeedback({show: true, message: "Blood sugar is too low! Eat a snack to raise it.", type: "danger"});
        } else if (units === 0) {
            setFeedback({show: true, message: "Blood sugar is normal. No insulin needed.", type: "normal"});
        } else if (units > 0) {
            setFeedback({show: true, message: `Insulin needed: ${units} units`, type: "warning"});
        } else {
            setFeedback({show: true, message: "Invalid Blood Sugar Level", type: "danger"});
        }
    };

    const updateBloodSugar = (amount) => {
        setManualBloodSugar(prev => {
            const newValue = prev + amount;
            return Math.max(0, Math.min(999, newValue));
        });
    };

    const adjustCarbsDigit = (digit, change) => {
        switch (digit) {
            case 'tens':
                setCarbsTens(prev => Math.max(0, Math.min(9, prev + change)));
                break;
            case 'ones':
                setCarbsOnes(prev => Math.max(0, Math.min(9, prev + change)));
                break;
        }
    };

    const resetDigits = () => {
        setManualBloodSugar(0);
        setFeedback({show: false, message: '', type: ''});
    };

    const addManualFood = () => {
        const insulin = calculateFoodInsulin(parseFloat(carbs));
        const foodItem = {
            id: Date.now(), name: foodName.trim(), carbs: parseFloat(carbs), insulin: insulin
        };
        setFoodItems(prev => [...prev, foodItem]);
        setFoodName('');
        setCarbs('');
        setCarbsDisplayValue('');
        setCarbsOnes(0);
        setCarbsTens(0);
    };

    const handleBarcodeFood = (foodData) => {
        const foodItem = {
            id: Date.now(),
            name: foodData.name || 'Scanned Item',
            carbs: Number(foodData.carbs) || 0,
            insulin: Number(foodData.insulin) || 0
        };
        setFoodItems(prev => [...prev, foodItem]);
    };

    const removeFood = (id) => {
        setFoodItems(prev => prev.filter(item => item.id !== id));
    };

    const clearAllFoods = () => {
        setFoodItems([]);
    };

    const addToFavorites = (item) => {
        // Check for duplicate by name and carbs
        const exists = favorites.some(f => f.name === item.name && f.carbs === item.carbs);
        if (!exists) {
            setFavorites(prev => [...prev, {...item, id: Date.now()}]);
        }
    };

    const removeFavorite = (favId) => {
        setFavorites(prev => prev.filter(f => f.id !== favId));
    };

    const addFromFavorites = (favItem) => {
        const newItem = {
            ...favItem, id: Date.now()
        };
        setFoodItems(prev => [...prev, newItem]);
    };

    const isFavorite = (item) => {
        return favorites.some(f => f.name === item.name && f.carbs === item.carbs);
    };

    const bsInsulin = currentBloodSugar > 0 ? Math.max(0, regulateSugar(currentBloodSugar)) : 0;
    const foodInsulin = foodItems.reduce((total, item) => total + item.insulin, 0);
    const totalInsulin = bsInsulin + foodInsulin;
    const showSummary = foodItems.length > 0 || currentBloodSugar > 0;

    return (<div className="blood-sugar-tracker">
        <div className="tracker-container">
            <div className="header">
                <h1>Emily's Blood Sugar & Insulin Regulator</h1>
            </div>

            <div className="grid-container">
                <div className="card bloodsugar">
                    <h2 className="card-title">
                        Blood Sugar Level
                    </h2>
                    <div className="form-group">
                        <div className="digit-display">{displayValue} mg/dL</div>
                        <div className="digit-controls">
                            <div className="digit-control">
                                <label className="digit-label">Hundreds</label>
                                <div className="digit-buttons">
                                    <svg onClick={() => updateBloodSugar(100)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path
                                            d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                            stroke="currentColor" strokeWidth="12" fill="currentColor"
                                            strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                    <div className="digit-value">{hundreds}</div>
                                    <svg onClick={() => updateBloodSugar(-100)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path transform="rotate(180 241.56 241.56)"
                                              d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                              stroke="currentColor" strokeWidth="11" fill="currentColor"
                                              strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="digit-control">
                                <label className="digit-label">Tens</label>
                                <div className="digit-buttons">
                                    <svg onClick={() => updateBloodSugar(10)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path
                                            d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                            stroke="currentColor" strokeWidth="11" fill="currentColor"
                                            strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                    <div className="digit-value">{tens}</div>
                                    <svg onClick={() => updateBloodSugar(-10)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path transform="rotate(180 241.56 241.56)"
                                              d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                              stroke="currentColor" strokeWidth="11" fill="currentColor"
                                              strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="digit-control">
                                <label className="digit-label">Ones</label>
                                <div className="digit-buttons">
                                    <svg onClick={() => updateBloodSugar(1)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path
                                            d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                            stroke="currentColor" strokeWidth="11" fill="currentColor"
                                            strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                    <div className="digit-value">{ones}</div>
                                    <svg onClick={() => updateBloodSugar(-1)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path transform="rotate(180 241.56 241.56)"
                                              d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                              stroke="currentColor" strokeWidth="11" fill="currentColor"
                                              strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="button-group">
                        <button onClick={setBloodSugarFromDigits} className="btn btn-primary">Check Status</button>
                        <button onClick={resetDigits} className="btn btn-secondary">Reset</button>
                    </div>
                    {feedback.show && (<div className={getAlertClass(feedback.type)}>{feedback.message}</div>)}
                </div>

                <div className="card carbs">
                    <h2 className="card-title">Insulin Calculator</h2>
                    <div className="form-group">
                        <div className="digit-controls">
                            <div className="digit-display">{CarbsDisplayValue} g</div>
                            <div className="digit-control">
                                <label className="digit-label">Tens</label>
                                <div className="digit-buttons">
                                    <svg onClick={() => adjustCarbsDigit('tens', 1)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path
                                            d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                            stroke="currentColor" strokeWidth="11" fill="currentColor"
                                            strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                    <div className="digit-value">{CarbsTens}</div>
                                    <svg onClick={() => adjustCarbsDigit('tens', -1)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path transform="rotate(180 241.56 241.56)"
                                              d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                              stroke="currentColor" strokeWidth="11" fill="currentColor"
                                              strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="digit-control">
                                <label className="digit-label">Ones</label>
                                <div className="digit-buttons">
                                    <svg onClick={() => adjustCarbsDigit('ones', 1)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path
                                            d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                            stroke="currentColor" strokeWidth="11" fill="currentColor"
                                            strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                    <div className="digit-value">{CarbsOnes}</div>
                                    <svg onClick={() => adjustCarbsDigit('ones', -1)} className="digit-btn"
                                         viewBox="-10 30 500 370">
                                        <path transform="rotate(180 241.56 241.56)"
                                              d="M2.728,366.416c6.8,4.9,21.5-1.2,37.2-15.5c28.1-25.7,56.6-51.4,83.4-78.6c41.4-41.9,81.7-84.9,122.4-127.4 c67,79.4,145.5,150,217.8,225.4c3.4,3.6,11.4,6.6,14.9,6.6c6.9,0,5.3-7.4,0.9-16.3c-14.7-29.3-38.2-59.1-64.4-87.1 c-51-54.3-101.2-109.2-154.5-161.7l-0.2-0.2l0,0c-7.4-7.3-19.3-7.2-26.6,0.2c-12.6,12.8-25.2,25.8-37.5,39 c-8.4,7.9-16.8,15.7-25.1,23.6c-52.7,50.4-104.6,101.6-153,155.8C4.128,345.716-4.772,361.116,2.728,366.416z"
                                              stroke="currentColor" strokeWidth="11" fill="currentColor"
                                              strokeLinejoin="round" strokeLinecap="round"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <label className="form-label">Food Name</label>
                    <input type="text" value={foodName} onChange={(e) => setFoodName(e.target.value)}
                           placeholder="Apple, Bread, Rice" className="form-input"/>
                    <div className="button-group">
                        <button onClick={addManualFood} className="btn btn-primary"
                                disabled={!foodName.trim() || Number.isNaN(Number(carbs)) || Number(carbs) < 0}>Add
                            Food
                        </button>
                        <button onClick={clearAllFoods} className="btn btn-secondary">Clear All</button>
                    </div>
                </div>

                <div className="card food-list-card">
                    <BarcodeScanner onAddFood={handleBarcodeFood} calculateFoodInsulin={calculateFoodInsulin}/>
                </div>

                <div className="card items">
                    <h2 className="card-title">Food Items</h2>

                    <div className="items-tabs">
                        <button
                            className={`items-tab-btn ${activeListTab === 'current' ? 'active' : ''}`}
                            onClick={() => setActiveListTab('current')}
                        >
                            Current List
                        </button>
                        <button
                            className={`items-tab-btn ${activeListTab === 'favorites' ? 'active' : ''}`}
                            onClick={() => setActiveListTab('favorites')}
                        >
                            Saved Items
                        </button>
                    </div>

                    {activeListTab === 'current' ? (<div className="food-items-grid">
                        {foodItems.length === 0 ? (<p className="empty-state">No food items added yet.
                            needed</p>) : (foodItems.map(item => (<div key={item.id} className="food-item">
                            <div className="food-item-info">
                                <div className="food-item-name">{item.name}</div>
                                <div className="food-item-carbs">{item.carbs}g carbs - {item.insulin} units</div>
                            </div>
                            <div className="food-item-actions">
                                <button
                                    onClick={() => addToFavorites(item)}
                                    className={`fav-btn ${isFavorite(item) ? 'is-active' : ''}`}
                                    title="Save to Favorites">
                                    ★
                                </button>
                                <button onClick={() => removeFood(item.id)} className="remove-btn">×
                                </button>
                            </div>
                        </div>)))}
                    </div>) : (/* Favorites View */
                        <div className="food-items-grid">
                            {favorites.length === 0 ? (<p className="empty-state">No favorite items yet.
                                them here!</p>) : (favorites.map(fav => (
                                <div key={fav.id} className="food-item favorite-item">
                                    <div className="food-item-info">
                                        <div className="food-item-name">{fav.name}</div>
                                        <div className="food-item-carbs">{fav.carbs}g carbs - {fav.insulin} units</div>
                                    </div>
                                    <div className="food-item-actions fav-actions">
                                        <button onClick={() => addFromFavorites(fav)}
                                                className="add-fav-btn"
                                                title="Add to Daily Log">+
                                        </button>
                                        <button onClick={() => removeFavorite(fav.id)}
                                                className="remove-btn"
                                                title="Remove from Favorites">×
                                        </button>
                                    </div>
                                </div>)))}
                        </div>)}
                </div>

                {showSummary && (<div className="insulin-summary">
                    <h2 className="summary-title">💉 Insulin Summary</h2>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <div className="summary-label">Blood Sugar Regulation</div>
                            <div className="summary-value">{bsInsulin} units</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">Food Items</div>
                            <div className="summary-value">{foodInsulin} units</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">Total Insulin Needed</div>
                            <div className="summary-value">{totalInsulin} units</div>
                        </div>
                    </div>
                </div>)}
            </div>
        </div>
    </div>);
};

export default BloodSugarTracker;