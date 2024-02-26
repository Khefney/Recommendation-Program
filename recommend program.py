import restaurantData
from restaurantData import restaurant_data
from restaurantData import types

print("|￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣￣|")
print("      Welcome to Tanqelo's Restaurant Recommendations")
print("|＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿|")
print("                     \ (•◡•) /")
print("                       \    /")

print('What type of cuisine would you like to eat?')
print('Type the beginning of that food type and press enter\n')
bfoodType = input('Type Here: ')

newTypes = []
newTypes2 = []

for food in types:
    if food.lower().startswith(bfoodType.lower()):
        newTypes.append(food)

print(f"With those beginning letters, your choices are: {newTypes}")

print('What type of cuisine would you like to eat?')
print('Type the beginning of that food type and press enter\n')
bfoodType2 = input('Type Here: ')

for food in newTypes:
    if food.lower().startswith(bfoodType2.lower()):
        newTypes2.append(food)

if len(newTypes2) > 1:
    print(f"With those beginning letters, your choices are: {newTypes2}")
else:
    strnewTypes2 = ''.join(newTypes2)
    print(f"The only food with those beginning letters is {strnewTypes2.capitalize()} Would you like to look at {strnewTypes2.capitalize()} restaurants. Enter 'y' for yes and 'n 'for no.")
    userInput = input()
    if userInput.lower() == 'y':
        for restaurant in restaurant_data:
            if strnewTypes2.lower() == restaurant[0]:
                print("Name:", restaurant[1])
                print("Price:", restaurant[2], "/5")
                print("Rating:", restaurant[3], "/5")
                print("Address:", restaurant[4])
                print("----------")
