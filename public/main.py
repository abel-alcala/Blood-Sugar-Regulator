class UserInfo:
    def __init__(self, bloodSugar, name, age):
        self.bloodSugar = bloodSugar
        self.name = name
        self.age = age

    def display_info(self):
        print(f"Name: {self.name}\nBloodSugar Level: {self.bloodSugar}\nAge: {self.age}")

    def regulateSugar(self):
        if self.bloodSugar < 70:
            return -1 # Sugar Low Insulin needed
        elif 70 <= self.bloodSugar <= 139:
            return 0 # No insulin needed
        elif 140 <= self.bloodSugar <= 179:
            return 0.5 # Insulin needed
        elif 180 <= self.bloodSugar <= 219:
            return 1
        elif 220 <= self.bloodSugar <= 259:
            return 1.5
        elif 260 <= self.bloodSugar <= 299:
            return 2
        elif 300 <= self.bloodSugar <= 339:
            return 2.5
        elif 340 <= self.bloodSugar <= 379:
            return 3
        elif 380 <= self.bloodSugar <= 419:
            return 3.5
        elif 420 <= self.bloodSugar <= 459:
            return 4
        elif 460 <= self.bloodSugar <= 499:
            return 4.5
        elif 500 <= self.bloodSugar <= 539:
            return 5
        else:
            return -999 # Invalid Blood Sugar Level

    def display_regulation(self):
        units = self.regulateSugar()
        if units == -1:
            print("⚠️ Blood sugar is too low! Snack on something to raise it.")
        elif units == 0:
            print("✅ Blood sugar is normal. No insulin needed.")
        elif units > 0:
            print(f"💉Insulin needed: {units} units")
        else:
            print("❗Invalid blood sugar level.")


class FoodItem:
    def __init__(self, name, carbs, amount):
        self.name = name
        self.carbs = carbs
        self.amount = amount

    def calculate_insulin(self):
        if self.carbs == 0:
            return 0
        elif 0 < self.carbs <= 6:
            return 0.5
        elif 6 < self.carbs <= 12:
            return 1
        elif 12 < self.carbs <= 18:
            return 1.5
        elif 18 < self.carbs <= 24:
            return 2
        elif 24 < self.carbs <= 30:
            return 2.5
        elif 30 < self.carbs <= 36:
            return 3
        elif 36 < self.carbs <= 42:
            return 3.5
        elif 42 < self.carbs <= 48:
            return 4
        elif 48 < self.carbs <= 54:
            return 4.5
        elif 54 < self.carbs <= 60:
            return 5.5
        elif 66 < self.carbs <= 72:
            return 6
        elif 72 < self.carbs <= 78:
            return 6.5
        elif 78 < self.carbs <= 84:
            return 7
        elif 84 < self.carbs <= 90:
            return 7.5
        elif 90 < self.carbs <= 96:
            return 8
        elif 96 < self.carbs <= 102:
            return 8.5

    def display_calculation(self):
        insulin_needed = self.calculate_insulin()
        if insulin_needed == 0:
            print(f"✅ No insulin needed for {self.name}.")
        elif insulin_needed > 0:
            print(f"💉 {insulin_needed} units of Insulin needed for {self.amount}g of {self.name}.")
        else:
            print("❗Invalid carbohydrate amount.")


def main():
    print("Hello Rata I see you need help regulating your blood sugar 🐀")
    user = UserInfo(
        bloodSugar=float(input("Enter your current blood sugar level🩸: ")),
        name="Emily",
        age=6
    )
    menuSelection = int(input("Select an option:\n1. Display User Info\n2. Regulate Blood Sugar\n3. Add Food Item\n4. Calculate Insulin for Food Item\n5. Exit\n"))
    food_items = []
    while menuSelection != 5:
        if menuSelection == 1:
            user.display_info()
        elif menuSelection == 2:
            user.display_regulation()
        elif menuSelection == 3:
            food_name = input("Enter food name: ")
            carbs = float(input("Enter carbohydrate amount in grams: "))
            amount = float(input("Enter amount of food in grams: "))
            food_items.append(FoodItem(food_name, carbs, amount))
        elif menuSelection == 4:
            insulinUnits = user.regulateSugar()
            if not food_items:
                print("No food items added yet.")
            else:
                extraUnits = 0
                for item in food_items:
                    extraUnits += item.calculate_insulin()
                print(f"Total insulin needed: {insulinUnits + extraUnits} units\n\t{insulinUnits} units for Blood Sugar regulation ({user.bloodSugar} BS)\n\t{extraUnits} units for food items.")

        else:
            print("Invalid selection. Please try again.")

        menuSelection = int(input("\nSelect an option:\n1. Display User Info\n2. Regulate Blood Sugar\n3. Add Food Item\n4. Calculate Insulin for Food Item\n5. Exit\n"))

if __name__ == "__main__":
    main()



