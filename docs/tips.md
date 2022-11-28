---
sidebar_position: 4
---

# Tips And Tricks

## Don't Write In BLE Receive Callback

In most systems, when they receive a BLE indication, they lock the BLE thread so that nothing changes during processing. The problem here is that some systems might freeze up on a BLE write command inside of a receive callback, and will either cause instability, or the write command not going through. This could also prevent any new messages from being received either.

To avoid this, my recommendation is to create a queue array of messages to send, and then send them one by one **after** the callback.

## Check That Key Is Added To Car

Whenever you connect to the vehicle, you should check whether your key id, is in the list of added keys, and if not, you should start the key adding flow inside your program. This ensures that your app doesn't get confused in case the key got removed by the user.

Method for checking this will be documented when I have time.

## Stop Scanning Once Connected

Once you find and connect to the vehicle, you should stop scanning, as in some devices (like Android), this can cause the connection to become less stable and sometimes either not even connect or disconnect after a few moments.

## Connection Limit

The vehicle has a BLE connection limit of 3 devices (from what I've seen on my M3LR). If you try to connect another device, it will not be able to, and will just give an error on the device trying to connect.
