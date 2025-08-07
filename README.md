# Emily's Blood Sugar & Insulin Calculator

A personalized diabetes management web application built for my sister Emily, who has Type 1 diabetes. This app digitizes her doctor's insulin dosing charts to make daily diabetes management quicker and more accurate.

## Key Features

### Blood Sugar Management

Interactive digit controls let you input blood sugar readings easily to get instant feedback:
-  **Too Low** (under 70 mg/dL) - Recommends eating a snack
-  **Normal Range** - No insulin needed
-  **High** - Shows exact insulin units required

### Food & Carb Tracking
Based on Emily's 1:12 carb ratio (1 unit insulin per 12g carbs):
- Simple digit controls for entering carb amounts for ever food item in meal
- Automatic insulin calculation matching her medical chart:
    - 0-6g carbs = 0.5 units
    - 7-12g carbs = 1 unit
    - 13-18g carbs = 1.5 units
    - Up to 102g+ carbs = 8.5 units

### Total Insulin Summary
Combines blood sugar correction insulin with food insulin for a complete dosing picture. No more mental math or fumbling with paper charts.

## Installation Guide
```bash
# Clone the repository
git clone https://github.com/abel-alcala/Blood-Sugar-Regulator.git
cd packages/blood-tracker

# Install dependencies
npm install

# Scripts
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Tech Stack Used
- **React** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **ESLint** - Code quality and consistency
---
