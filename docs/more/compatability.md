---
sidebar_position: 3
---

# BLE Compatability

## Some Information

Not all Tesla vehicles support BLE communication, and we want to know whether or not they do to inform users that the app or product you made isn't compatible with their vehicle. This can be done with a pretty simple check of the VIN, which I've reverse engineered from Tesla's offical app.

## Quick VIN Breakdown

First of all let's understand what means what in the VIN:

```
                                     A: 2010
                                     B: 2011
                                     C: 2012
                                     ...
                                     ▲
                       Chassis   ┌───┘
                      Attribute  │
                          ▲    ┌─►Model Year
                          │    │  ____
                          │    │ /    \ ─────►Unique Serial
                      5YJ3E1EA1KF000000          Number
                      \_/│ \_/  │
                       │ │  │   └──►Production
      Manufacturer ◄───┘ ▼  │         Plant
      Identifier:      Model└───┐
                                ▼
5YJ - Tesla Fremont           Certain
7SA - Tesla Fremont          Attributes
LRW - Tesla China
XP7 - Tesla Germany
SFZ - Tesla UK (roadster)
```

## Doing The Check

For this check, we need:

- Model (4th character)
- Motor/drive unit (8th character - 3rd attribute)
- Model year (10th character)

In the case of the above example, we have `3` for the model, `A` for the motor/drive unit, and `K` for the model year.

First we check the model year:

### Less than or equal to `L` (2020)

If model is `3` or `Y`, then the vehicle is `compatible`, otherwise, it is `incompatible`

### Exactly `M` (2021)

If the model/drive unit is `1`, `2`, `3`, or `4`, the vehicle is `incompatible`, otherwise it is `compatible`

### Otherwise (`N` (2022) or later)

The vehicle is `compatible`

<details>
<summary>Python Example</summary>

```py
INCOMPATIBLE_DRIVE_UNITS = ["1", "2", "3", "4"]
COMPATIBLE_MODELS = ["3", "Y"]

example_vin = "5YJ3E1EA1KF000000"

model = example_vin[3]
drive_unit = example_vin[7]
model_year = example_vin[9]

if model_year <= "L":
    if model in COMPATIBLE_MODELS:
        print(f"{example_vin} is compatible!")
    else:
        print(f"{example_vin} is incompatible!")
elif model_year == "M":
    if drive_unit not in INCOMPATIBLE_DRIVE_UNITS:
        print(f"{example_vin} is compatible!")
    else:
        print(f"{example_vin} is incompatible!")
else:
    print(f"{example_vin} is compatible!")
```

</details>
