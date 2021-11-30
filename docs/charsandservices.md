---
sidebar_position: 3
---

# Characteristics And Services

## Services
Service|Description
-|-
`00000211-b2d1-43f0-9b88-960cebf8b91e`|The main service which the car uses for all communication

## Characteristics
### Send messages to the car
    - UUID: 00000212-b2d1-43f0-9b88-960cebf8b91e
    - Properties: WRITE
    - Descriptors:
        - 0x2901 — The descriptor you write to

### Recieve messages from the car
    - UUID: 00000213-b2d1-43f0-9b88-960cebf8b91e
    - Properties: INDICATE
    - Descriptors:
        - 0x2901 — The descriptor you wait for notifications on
        - 0x2902 — ...

### Get communication version
    - UUID: 00000214-b2d1-43f0-9b88-960cebf8b91e
    - Properties: READ
    - Descriptors:
        - 0x2901 — The descriptor you read the version on
