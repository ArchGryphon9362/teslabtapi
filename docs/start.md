---
sidebar_position: 2
---

# Getting Started
:::warning
Tesla has updated their VCSEC for the new Model S and X, among other things. I'm currently in the process of extracting that. The current stuff should continue to work, but I can't predict for how long it'll continue working. Also, since the car uses 4 byte nonces many libraries will deem this as insecure and won't allow you to do that, and after checking out the new Tesla app, sadly the problem still exists and you must modify these libraries to work with the car :/

**Once I extract the protobuf, you'll be able to choose between the new and old version of the documentation!**
:::
:::tip
I really recommend reading this over to grasp an understanding of how this stuff works. If you just want to see what the car can do, skip down to [more info](#more-info).
:::

## Whitelisting your key
To begin working with the vehicle's BLE API, you'll need to generate and whitelist your public key with the vehicle.

To do this, you'll need two things:
- Generate an EC private key with the NISTP256 curve (aka secp256r1, or prime256v1)
  - Keep this safe! This key is used to sign all your messages.
- Using your private key, you'll need to generate a public key serialized to bytes in the ANSI X9.62/X9.63 Uncompressed Point format
  - If done correctly, the first byte should always be `0x04`
  - I never tried it, but Compressed Point might work too, that is where the first byte is `0x02` or `0x03`. If it does work, please tell me so that I can update the documentation! If you're feeling wild and try out any other public key encodings that work, then please notify me too!

We'll call these `privateKey`, and `publicKey` respectively.

Next serialize, an unsigned protobuf message from the VCSEC protobuf in the following layout:
```
UnsignedMessage {
	WhitelistOperation {
		addKeyToWhitelistAndAddPermissions {
			key {				PublicKeyRaw: <publicKey>
			}
			permission: WHITELISTKEYPERMISSION_LOCAL_DRIVE
			permission: WHITELISTKEYPERMISSION_LOCAL_UNLOCK
			permission: WHITELISTKEYPERMISSION_REMOTE_DRIVE
			permission: WHITELISTKEYPERMISSION_REMOTE_UNLOCK
		}
		metadataForKey {
			keyFormFactor: KEY_FORM_FACTOR_ANDROID_DEVICE
		}
	}
}
```
You may add any other permissions as needed but these are the default ones (the ones that let you unlock, and start the vehicle, among other things). We'll call the previously serialized message the `protoMsg`.

Once you have it serialized to bytes, you need to make a `ToVCSECMessage` message of the following format:
```
ToVCSECMessage {
	signedMessage {
		protobufMessageAsBytes: <protoMsg>
		signatureType: SIGNATURE_TYPE_PRESENT_KEY
	}
}
```
Now, serialize this message to bytes. We'll call this `authMsg`.

We need to prepare this message by defining a function `prependLength`:
- Extends the length of the byte array by two
- Shifts all bytes to the right by two
- Sets the first two bytes to the length of the message
  - Note: In most/all cases the byte array will be the final serialized message

```python
someMsg = b'\x01\x02'
prependedMsg = prependLength(someMsg)
print(prependedMsg) # b'\x00\x02\x01\x02'
```
Once you have serialized `protoMsg`, and prepended the length, send the message to the vehicle over a normal BluetoothLE connection on the following write characteristic:
```
Serivce: 00000211-b2d1-43f0-9b88-960cebf8b91e
UUID: 00000212-b2d1-43f0-9b88-960cebf8b91e
Descriptor: 0x2901
```

### Vehicle BLE Name
The vehicle's BLE name is fairly easy to figure out. You need to do the following to get the whole name except the last character:
- Get the vehicle's VIN, we'll call this `vin`
- Get a SHA1 hash of it, we'll call this `vinSHA`
- Get the `vinSHA` as a hex string, and keep only the first 16 characters, we'll call this `middleSection`
- Prepend "S" to `middleSection` and that is it. The last character will be any letter from A to F, but you don't have to pay attention to that
- All that is currently known about the last letter is that it must be one of the following:
  - C
  - R
  - D
  - P
#### Python Example
```py
from cryptography.hazmat.primitives import hashes

vin = bytes("5YJ3E1EA1KF000000", "UTF8")

digest = hashes.Hash(hashes.SHA1())
digest.update(vin)
vinSHA = digest.finalize().hex()
middleSection = vinSHA[0:16]
bleName = "S" + middleSection + "?"

print(bleName) # Sa6bab0d54ffaecf1?
```

### Response

The vehicle will always respond with a `FromVCSECMessage` message.

The first two bytes of this message represent the length of the message.

The rest of the message can then be decoded. Below is an example response to a whilelist request:
```
FromVCSECMessage {
	commandStatus {
		operationStatus: OPERATIONSTATUS_WAIT
	}
}
```
It should be received on the following indication characteristic:
```
Serivce: 00000211-b2d1-43f0-9b88-960cebf8b91e
UUID: 00000213-b2d1-43f0-9b88-960cebf8b91e
Descriptor: 0x2901
```
Now tap an existing key card, and you should recieve the following message:
```
FromVCSECMessage {
	commandStatus {
		whitelistOperationStatus {
			signerOfOperation {
				publicKeySHA1: 0x5f0d64b3
			}
		}
	}
}
```
Congrats! You whitelisted your first key!

## Getting the ephemeral key
To sign messages to send to the vehicle, you'll need to get the vehicle's ephemeral key.

By definition, this name should change every so often, but I never experienced it change in the few days of testing that I've done.

First, generate the `keyId`. This can be done by taking the first 4 bytes of a SHA1 digest of `publicKey`.

Now that you have your `keyId`, you'll need to request the vehicle's ephemeral key. You can do this by making a `ToVCSECMessage` message with the following layout:
```
ToVCSECMessage {
	unsignedMessage {
		InformationRequest {
			informationRequestType: INFORMATION_REQUEST_TYPE_GET_EPHEMERAL_PUBLIC_KEY
			keyId {
				publicKeySHA1: <keyId>
			}
		}
	}
}
```
Now, serialize this message to bytes as `getEphemeralBytes`. Prepend the message with `prependLength(getEphemeralBytes)`, and send the value to the vehicle.

The vehicle should respond with a message in the ANSI X9.62/X9.63 Uncompressed Point format, with the NISTP256 format. When decoded, it should looks something like this:
```
FromVCSECMessage {
	sessionInfo {
		publicKey: <vehicle's ephemeral key>
	}
}
```
Now that you have the `ephemeral_key`, generate an AES secret from the `ephemeral_key` and your secret key. Next, make a SHA1 of it, and put take the first 16 bytes to form your `sharedKey`.

## Authenticating
For the vehicle to know that you are connected and to be able to send/receive messages, you need to generate an authentication message in the following format:
```
UnsignedMessage {
	authenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_NONE
	}
}
```
Set a variable called `counter` to 1 (can be any number that hasn't been used as the counter for this key and must be >= 1), which you should increment each time after using.

Now, you need to encrypt this message using the `sharedKey` with AES encryption in GCM mode, with a nonce of the `counter`, split into 4 bytes in big-endian, where the least significant byte is at the end.

For example, if `counter` is 23, the nonce will be `b'\x00\x00\x00\x17'`.

You should also separate the encrypted/signed message into 2 variables, `encryptedMsg` (from bytes 0 to `length` - 16), and `msgSignature` (from bytes `length` - 16 to `length`).

Now you can send the message to the vehicle! Use the following format:
```
ToVCSECMessage {
	signedMessage {
		protobufMessageAsBytes: <encryptedMsg>
		signature: <msgSignature>
		counter: <counter>
		keyId: <keyId>
	}
}
```
Now, prepare the message by serializing and prepending the length of the message. It is now ready to be sent to the vehicle!

Once complete, as long as you stay connected to the vehicle's BLE, your key will stay marked in the vehicle as an active key.

## Authenticating for other things
If you want to let the vehicle do things automatically without sending messages to do things (i.e. like the Tesla App does when you're next to/inside the vehicle), you can send it an authentication response of a higher level to give permission to do everything under and including that level, so say `level = 'UNLOCK'`, you are only letting the vehicle unlock, but say you do `level = 'DRIVE'`, you can unlock *or* drive. Also, everytime the vehicle does something automatically, the vehicle resets level to `NONE`.

All that you have to do is serialize and sign an auth message where the distance is optional, but if not sent to the vehicle, it will just automatically assume that you're next to/inside the vehicle:
```
UnsignedMessage {
	AuthenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_<LEVEL>
		estimatedDistance: <distance> # optional
	}
}
```
Once you sign that message, I'll call it `signedAuthMsg`, and its signature `signedAuthSign`, and turn it into a ToVCSECMessage message like this, which you then serialize, prepend the length, and send to the vehicle:
```
ToVCSECMessage {
	signedMessage {
		protobufMessageAsBytes: <signedAuthMsg>
		signature: <signedAuthSign>
		counter: <counter>
		keyId: <keyId>
	}
}
```

:::note
I recommend only changing this to other auth levels when the car requests it. Here's an example of a message you may get from the car, requesting to unlock it:
```
FromVCSECMessage {
	authenticationRequest {
	sessionInfo {
		token: "some random token that i don't know the use of"
	}
	requestedLevel: AUTHENTICATION_LEVEL_DRIVE
	}
}
```
In this case you'll just send the car back the following message:
```
UnsignedMessage {
	AuthenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_DRIVE
	}
}
```
Don't worry about the walk-away car lock, when you walk away the car will automatically lock
:::
## Sending manual actions
Say a user interacts with an app or needs to do something that can't be done automatically. In that case you need to send an RKE action. You can send those by making a message in the following format, signing it, prepending length, and sending it to the vehicle like with any other signed message:
```
UnsignedMessage {
	RKEAction_E: <any rke action>
}
```

## More Info
For more info, you can begin looking at [ToVCSECMessage](tovcsec) ([UnsignedMessage](other/unsignedmsg) in particular) to see things you can send to the car, and [FromVCSECMessage](fromvcsec) to see things you receive to the car.

Don't forget, VCSEC is the vehicle's secondary security system, so you send `ToVCSECMessage` messages, and the vehicle sends you back `FromVCSECMessage` messages.

:::note
There is only one exception to this rule: when you added your key as keyfob. In this case you would use `FromKeyfobMessage` instead of `ToVCSECMessage`, and `ToKeyfobMessage` instead of `FromVCSECMessage`.

There is also an exception for tire pressure sensors, but I have absolutely no idea of how they work, and don't have time to research.
:::
