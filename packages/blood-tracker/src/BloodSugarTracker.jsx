import React, { useState, useEffect } from 'react';
import './page.css';

const BloodSugarTracker = () => {
    const [bloodSugar, setBloodSugar] = useState('');
    const [currentBloodSugar, setCurrentBloodSugar] = useState(0);
    const [foodItems, setFoodItems] = useState([]);
    const [foodName, setFoodName] = useState('');
    const [carbs, setCarbs] = useState('');
    const [bloodSugarResult, setBloodSugarResult] = useState({ show: false, message: '', type: '' });
    const [bloodSugarResult2, setBloodSugarResult2] = useState({ show: false, message: '', type: '' });
    const [hundreds, setHundreds] = useState(0);
    const [tens, setTens] = useState(0);
    const [ones, setOnes] = useState(0);
    const [displayValue, setDisplayValue] = useState('000');

    useEffect(() => {
        const value = hundreds * 100 + tens * 10 + ones;
        setDisplayValue(value.toString().padStart(3, '0'));
    }, [hundreds, tens, ones]);


    const regulateSugar = (bloodSugar) => {
        if (bloodSugar < 70) {
            return -1; // Sugar Low
        } else if (bloodSugar >= 70 && bloodSugar <= 139) {
            return 0; // Normal
        } else if (bloodSugar >= 140 && bloodSugar <= 179) {
            return 0.5;
        } else if (bloodSugar >= 180 && bloodSugar <= 219) {
            return 1;
        } else if (bloodSugar >= 220 && bloodSugar <= 259) {
            return 1.5;
        } else if (bloodSugar >= 260 && bloodSugar <= 299) {
            return 2;
        } else if (bloodSugar >= 300 && bloodSugar <= 339) {
            return 2.5;
        } else if (bloodSugar >= 340 && bloodSugar <= 379) {
            return 3;
        } else if (bloodSugar >= 380 && bloodSugar <= 419) {
            return 3.5;
        } else if (bloodSugar >= 420 && bloodSugar <= 459) {
            return 4;
        } else if (bloodSugar >= 460 && bloodSugar <= 499) {
            return 4.5;
        } else if (bloodSugar >= 500 && bloodSugar <= 539) {
            return 5;
        } else {
            return -999; // Invalid BS Level
        }
    };

    const calculateFoodInsulin = (carbs) => {
        if (carbs === 0) {
            return 0;
        } else if (carbs > 0 && carbs <= 6) {
            return 0.5;
        } else if (carbs > 6 && carbs <= 12) {
            return 1;
        } else if (carbs > 12 && carbs <= 18) {
            return 1.5;
        } else if (carbs > 18 && carbs <= 24) {
            return 2;
        } else if (carbs > 24 && carbs <= 30) {
            return 2.5;
        } else if (carbs > 30 && carbs <= 36) {
            return 3;
        } else if (carbs > 36 && carbs <= 42) {
            return 3.5;
        } else if (carbs > 42 && carbs <= 48) {
            return 4;
        } else if (carbs > 48 && carbs <= 54) {
            return 4.5;
        } else if (carbs > 54 && carbs <= 60) {
            return 5.5;
        } else if (carbs > 66 && carbs <= 72) {
            return 6;
        } else if (carbs > 72 && carbs <= 78) {
            return 6.5;
        } else if (carbs > 78 && carbs <= 84) {
            return 7;
        } else if (carbs > 84 && carbs <= 90) {
            return 7.5;
        } else if (carbs > 90 && carbs <= 96) {
            return 8;
        } else if (carbs > 96 && carbs <= 102) {
            return 8.5;
        } else {
            return 9;
        }
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

    const checkBloodSugar = () => {
        const bs = parseFloat(bloodSugar);

        if (isNaN(bs) || bs <= 0) {
            setBloodSugarResult({
                show: true,
                message: "❗ Enter a valid blood sugar level",
                type: "danger"
            });
            return;
        }

        setCurrentBloodSugar(bs);
        const units = regulateSugar(bs);

        if (units === -1) {
            setBloodSugarResult({
                show: true,
                message: "⚠️ Blood sugar is too low! Eat a snack to raise it.",
                type: "danger"
            });
        } else if (units === 0) {
            setBloodSugarResult({
                show: true,
                message: "✅ Blood sugar is normal. No insulin needed.",
                type: "normal"
            });
        } else if (units > 0) {
            setBloodSugarResult({
                show: true,
                message: `💉 Insulin needed: ${units} units`,
                type: "warning"
            });
        } else {
            setBloodSugarResult({
                show: true,
                message: "❗ Invalid Blood Sugar Level",
                type: "danger"
            });
        }
    };

    const setBloodSugarFromDigits = () => {
        const bs = hundreds * 100 + tens * 10 + ones;

        if (bs <= 0) {
            setBloodSugarResult2({
                show: true,
                message: "❗ Enter a valid blood sugar level",
                type: "danger"
            });
            return;
        }

        setCurrentBloodSugar(bs);
        const units = regulateSugar(bs);

        if (units === -1) {
            setBloodSugarResult2({
                show: true,
                message: "⚠️ Blood sugar is too low! Eat a snack to raise it.",
                type: "danger"
            });
        } else if (units === 0) {
            setBloodSugarResult2({
                show: true,
                message: "✅ Blood sugar is normal. No insulin needed.",
                type: "normal"
            });
        } else if (units > 0) {
            setBloodSugarResult2({
                show: true,
                message: `💉 Insulin needed: ${units} units`,
                type: "warning"
            });
        } else {
            setBloodSugarResult2({
                show: true,
                message: "❗ Invalid Blood Sugar Level",
                type: "danger"
            });
        }
    };

    const adjustDigit = (digit, change) => {
        switch (digit) {
            case 'hundreds':
                setHundreds(prev => Math.max(0, Math.min(9, prev + change)));
                break;
            case 'tens':
                setTens(prev => Math.max(0, Math.min(9, prev + change)));
                break;
            case 'ones':
                setOnes(prev => Math.max(0, Math.min(9, prev + change)));
                break;
            case 'CarbsTens':
                setCarbsTens(prev => Math.max(0, Math.min(9, prev + change)));
                break;
            case 'CarbsOnes':
                setCarbsOnes(prev => Math.max(0, Math.min(9, prev + change)));
                break;
        }
    };

    const resetDigits = () => {
        setHundreds(0);
        setTens(0);
        setOnes(0);
        setBloodSugarResult2({ show: false, message: '', type: '' });
    };



    const addFood = () => {
        if (!foodName.trim() || isNaN(parseFloat(carbs)) || parseFloat(carbs) < 0) {
            alert('Please fill in both fields');
            return;
        }

        const insulin = calculateFoodInsulin(parseFloat(carbs));
        const foodItem = {
            id: Date.now(),
            name: foodName.trim(),
            carbs: parseFloat(carbs),
            insulin: insulin
        };

        setFoodItems(prev => [...prev, foodItem]);
        setFoodName('');
        setCarbs('');
    };

    const removeFood = (id) => {
        setFoodItems(prev => prev.filter(item => item.id !== id));
    };

    const clearAllFoods = () => {
        setFoodItems([]);
    };

    const bsInsulin = currentBloodSugar > 0 ? Math.max(0, regulateSugar(currentBloodSugar)) : 0;
    const foodInsulin = foodItems.reduce((total, item) => total + item.insulin, 0);
    const totalInsulin = bsInsulin + foodInsulin;
    const showSummary = foodItems.length > 0 || currentBloodSugar > 0;

    return (
        <div className="blood-sugar-tracker">
            <div className="tracker-container">
                <div className="header">
                    <h1>🩸Emily's Blood Sugar & Insulin Regulator</h1>
                </div>

                <div className="grid-container">
                    {/* Blood Sugar Setter */}
                    <div className="card">
                        <h2 className="card-title">
                            <span className="card-title-icon">🩸</span>Blood Sugar Level (mg/dL)
                        </h2>
                        <div className="form-group">
                            <div className="digit-display">
                                {displayValue} mg/dL
                            </div>
                            <div className="digit-controls">
                                {/* Hundreds */}
                                <div className="digit-control">
                                    <label className="digit-label">Hundreds</label>
                                    <div className="digit-buttons">
                                        <button
                                            onClick={() => adjustDigit('hundreds', 1)}
                                            className="digit-btn"
                                        >
                                            +
                                        </button>
                                        <div className="digit-value">{hundreds}</div>
                                        <button
                                            onClick={() => adjustDigit('hundreds', -1)}
                                            className="digit-btn"
                                        >
                                            -
                                        </button>
                                    </div>
                                </div>

                                {/* Tens */}
                                <div className="digit-control">
                                    <label className="digit-label">Tens</label>
                                    <div className="digit-buttons">
                                        <button
                                            onClick={() => adjustDigit('tens', 1)}
                                            className="digit-btn"
                                        >
                                            +
                                        </button>
                                        <div className="digit-value">{tens}</div>
                                        <button
                                            onClick={() => adjustDigit('tens', -1)}
                                            className="digit-btn"
                                        >
                                            -
                                        </button>
                                    </div>
                                </div>

                                {/* Ones */}
                                <div className="digit-control">
                                    <label className="digit-label">Ones</label>
                                    <div className="digit-buttons">
                                        <button
                                            onClick={() => adjustDigit('ones', 1)}
                                            className="digit-btn"
                                        >
                                            +
                                        </button>
                                        <div className="digit-value">{ones}</div>
                                        <button
                                            onClick={() => adjustDigit('ones', -1)}
                                            className="digit-btn"
                                        >
                                            -
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="button-group">
                            <button onClick={setBloodSugarFromDigits} className="btn btn-primary">
                                Set & Check Status
                            </button>
                            <button onClick={resetDigits} className="btn btn-secondary">
                                Reset
                            </button>
                        </div>
                        {bloodSugarResult2.show && (
                            <div className={getAlertClass(bloodSugarResult2.type)}>
                                {bloodSugarResult2.message}
                            </div>
                        )}
                    </div>

                    {/* Food Tracker */}
                    <div className="card">
                        <h2 className="card-title">
                            <span className="card-title-icon">🍎</span>Food Tracker
                        </h2>
                        <div className="form-group">
                            <label className="form-label">Food Name</label>
                            <input
                                type="text"
                                value={foodName}
                                onChange={(e) => setFoodName(e.target.value)}
                                placeholder="Apple, Bread, Rice"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Carbohydrates (g)</label>
                            <input
                                type="number"
                                value={carbs}
                                onChange={(e) => setCarbs(e.target.value)}
                                placeholder="Enter carbs in grams"
                                min="0"
                                className="form-input"
                            />
                        </div>
                        <div className="button-group">
                            <button onClick={addFood} className="btn btn-primary">
                                Add Food
                            </button>
                            <button onClick={clearAllFoods} className="btn btn-secondary">
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Food Items List */}
                    <div className="card food-list-card">
                        <h2 className="card-title">
                            <span className="card-title-icon">📋</span>Food Items & Insulin
                        </h2>
                        <div className="food-items-grid">
                            {foodItems.length === 0 ? (
                                <p className="empty-state">
                                    No food items added yet. Add foods to calculate insulin needed
                                </p>
                            ) : (
                                foodItems.map(item => (
                                    <div key={item.id} className="food-item">
                                        <div className="food-item-info">
                                            <div className="food-item-name">
                                                {item.name}
                                            </div>
                                            <div className="food-item-carbs">
                                                {item.carbs}g carbs
                                            </div>
                                        </div>
                                        <div className="food-item-actions">
                                            <div className="insulin-badge">
                                                {item.insulin} units
                                            </div>
                                            <button
                                                onClick={() => removeFood(item.id)}
                                                className="remove-btn"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Insulin Summary */}
                {showSummary && (
                    <div className="insulin-summary">
                        <h3 className="summary-title">
                            💉 Insulin Summary
                        </h3>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <div className="summary-label">
                                    Blood Sugar Regulation
                                </div>
                                <div className="summary-value">
                                    {bsInsulin} units
                                </div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-label">
                                    Food Items
                                </div>
                                <div className="summary-value">
                                    {foodInsulin} units
                                </div>
                            </div>
                            <div className="summary-item">
                                <div className="summary-label">
                                    Total Insulin Needed
                                </div>
                                <div className="summary-value">
                                    {totalInsulin} units
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BloodSugarTracker;