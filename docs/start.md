---
sidebar_position: 2
---

# Getting Started
## Whitelisting your key
To begin working with the vehicle's BLE API, you'll need to generate and whitelist your public key with the vehicle.

To do this, you'll need to first of all, generate an EC private key with the NISTP256 curve (aka secp256r1, and prime256v1), which you should store and keep safe, this key is used to sign all your message. From that, you'll need to generate a public key serialized to bytes in the DER format, and split it from the 27th byte to the end, where the first byte is 0x04, for now I'll call these `privateKey`, and `publicKey`. Next serialize an unsigned protobuf message from the VCSEC protobuf in the following layout:
```
UnsignedMessage {
	WhitelistOperation {
		addKeyToWhitelistAndAddPermissions {
			key {
				PublicKeyRaw: <publicKey>
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
You may add any other permissions as needed but these are the ones that let you unlock, and start the vehicle. I'll call the previously serialized message the `protoMsg`. Once you have it serialized to bytes, you need to make a ToVCSEC message of the following format:
```
ToVCSEC {
	signedMessage {
		protobufMessageAsBytes: <protoMsg>
		signatureType: SIGNATURE_TYPE_PRESENT_KEY
	}
}
```
Serialize this message to bytes, and I'll call it `authMsg`.
From now on I'll be referencing a function which I'll call `prependLength`. What it does, is take length of some byte array which in most/all cases will be the final serialized message, extend it by 2 bytes, shift all the bytes to the right twice so that the first 2 bytes are empty. Now set the first 2 bytes to the length of the byte array passed into the function (in big-endian, so the least significant byte comes last). So what you get is this:
```python
someMsg = b'\x01\x02'
prependedMsg = prependLength(someMsg)
print(prependedMsg) # b'\x00\x02\x01\x02'
```
Once you have serialized `protoMsg`, and prepended the length, send the message to the vehicle over a normal BluetoothLE connection on the write characteristic:
```
UUID: 00000212-b2d1-43f0-9b88-960cebf8b91e
Descriptor: 0x2901
```
Whenever the vehicle responds, it should always respond with a FromVCSEC message, which after removing the first 2 bytes (which are the length of the message), you can decode. In this case the vehicle should respond with the following message:
```
FromVCSEC {
	commandStauts {
		operationStatus: OPERATIONSTATUS_WAIT
		signedMessageStatus {
		}
	}
}
```
Now tap an existing key card, and you should recieve the following message:
```
FromVCSEC {
	commandStatus {
		signedMessageStatus {
		}
	}
}
```
Congrats! You whitelisted your first key!

## Getting the ephemeral key
To sign messages to send to the vehicle, you'll need to get the vehicle's ephemeral key, which according to the name should change every so often, but I never experienced it change in the few days of testing that I've done.

First of all you'll need to generate the key id, which I'll be calling `keyId`. You can generate that by doing a SHA1 digest of `publicKey`, and taking the first 4 bytes of the digest.

Now that you have your key id, you'll need to request the vehicle's ephemeral key. You can do this by making a ToVCSEC message with the following layout:
```
ToVCSEC {
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
You can serialize this message to bytes and put it into a variable which I'll call `getEphemeralBytes`. Now do `prependLength(getEphemeralBytes)`, and send the value returned to the vehicle. The vehicle should respond with a message which you need to decode. It should looks something like this:
```
FromVCSEC {
	sessionInfo {
		publicKey: <vehicle's ephemeral key>
	}
}
```
When you recieve it, it should be in the X9.62 EncodedPoint format, with the NISTP256 format. Once you load it into a variable, I'll call it `ephemeral_key`. What you now need to do is generate an AES secret from the vehicle's ephemeral public key, and your secret key. Now you need to make a SHA1 of it, and put the first 16 bytes in a variable which I'll call `sharedKey`.

## Authenticating
For the vehicle to know that you are connected, and to be able to send + receive messages, you need to authenticate yourself. To do so, you'll need to generate an authentication message in the following format:
```
UnsignedMessage {
	authenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_NONE
	}
}
```
Set a variable called `counter` to 1 (can be any number that hasn't been used as the counter for this key and must be >= 1), which you should increment each time after using. Now, you need to encrypt this message using the `sharedKey` in GCM mode, with a nonce of the `counter`, split into 4 bytes in big-endian, where the least significant byte is at the end. You should also seperate the encrypted/signed message into 2 variables, `encryptedMsg` (from bytes 0 to `length` - 16), and `msgSignature` (from bytes `length` - 16 to `length`). Now you need to generate a message to send to the vehicle:
```
ToVCSEC {
	signedMessage {
		protobufMessageAsBytes: <encryptedMsg>
		signature: <msgSignature>
		counter: <counter>
		keyId: <keyId>
	}
}
```
Now serialize this message to bytes and pass it to the `prependLength` function, and send that to the vehicle. Now as long as you stay connected to the vehicle's BLE, your key will stay marked in the vehicle as an active key.

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
Once you sign that message, I'll call it `signedAuthMsg`, and its signature `signedAuthSign`, and turn it into a ToVCSEC message like this, which you then serialize, prepend the length, and send to the vehicle:
```
ToVCSEC {
	signedMessage {
		protobufMessageAsBytes: <signedAuthMsg>
		signature: <signedAuthSign>
		counter: <counter>
		keyId: <keyId>
	}
}
```
## Sending actions manually
Say a user interacts with an app or needs to do something that can't be done automatically. In that case you need to send an RKE action. You can send those by making a message in the following format, signing it, prepending length, and sending it to the vehicle like with any other signed message:
```
UnsignedMessage {
	RKEAction_E: <any rke action>
}
```

## More Info
For more info, you can begin looking at [ToVCSEC](tovcsec.md), and [FromVCSEC](fromvcsec.md) (don't forget, VCSEC, is the vehicle's secondary security system, so you send **To**VCSEC messages, and the vehicle sends you back **From**VCSEC messages).