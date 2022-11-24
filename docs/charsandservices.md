---
sidebar_position: 3
---

# BLE Information
## Name
The vehicle's BLE name is found using the following method (doesn't give last character):
- Get the vehicle's VIN, we'll call this `vin`
- Get a SHA1 hash of it, we'll call this `vinSHA`
- Get the `vinSHA` as a hex string, and keep only the first 16 characters, we'll call this `middleSection`
- Prepend "S" to `middleSection` and that is it. The last character is usually C
- The last letter can be one of the following according to Tesla's app code, but I've never seen that:
  - C
  - R
  - D
  - P
- Theories by trifinite suggest that they might mean [C]enter, [R]ear, [D]river, and [P]assenger, probably for knowing which beacon you are currently comminicating to, but it doesn't matter

<details>
<summary>Python Example</summary>

```py
from cryptography.hazmat.primitives import hashes

vin = bytes("5YJ3E1EA1KF000000", "UTF8")

digest = hashes.Hash(hashes.SHA1())
digest.update(vin)
vinSHA = digest.finalize().hex()
middleSection = vinSHA[0:16]
bleName = "S" + middleSection + "C"

print(bleName) # Sa6bab0d54ffaecf1C
```

</details>

## Services
Service|Description
-|-
`00000211-b2d1-43f0-9b88-960cebf8b91e`|The main service which the car uses for all communication

## Characteristics
### Send messages to the car
```yaml
- UUID: 00000212-b2d1-43f0-9b88-960cebf8b91e
- Properties: WRITE
- Descriptors:
    - 0x2901 — Characteristic Description
```

### Recieve messages from the car
```yaml
- UUID: 00000213-b2d1-43f0-9b88-960cebf8b91e
- Properties: INDICATE
- Descriptors:
    - 0x2901 — Characteristic Description
    - 0x2902 — ...
```

### Get communication version
```yaml
- UUID: 00000214-b2d1-43f0-9b88-960cebf8b91e
- Properties: READ
- Descriptors:
    - 0x2901 — Characteristic Description
```
