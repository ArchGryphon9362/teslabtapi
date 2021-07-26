---
sidebar_position: 2
---

# Getting Started
## Whitelisting your key
To begin working with the car's BLE API, you'll need to generate and whitelist your public key with the car.
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
You may add any other permissions as needed but these are the ones that let you unlock, and start the car. I'll call this serialized message `protoMsg`. Once you have it serialized to bytes, you need to make a ToVCSEC message of the following format:
```
ToVCSEC {
	signedMessage {
		protobufMessageAsBytes: <protoMsg>
		signatureType: SIGNATURE_TYPE_PRESENT_KEY
	}
}
```
Serialize this function to bytes and I'll call it `authMsg`.
From now on I'll be referencing a function which I'll call `prependLength`. What it does, is take length of some byte array which in most/all cases will be the serialized final message, extend it by 2 bytes, shift all the bytes to the right so that the first 2 bytes are empty. Now set the first to bytes to the length of the byte array passed into the function. So what you get is this:
```
someMsg = b'\x01\x02'
prependLength(someMsg)

# the function returns b'\x00\x02\x01\x02'
```
Once you have the function ready, pass it in the `protoMsg` message, and send it to the car over BLE. The car should always respond with a FromVCSEC message, which after removing the first 2 bytes (which are the length of the message), you can decode. In this case the car should respond with the following message:
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
## Getting ephemeral key
To sign messages to send to the car, you'll need to get the car's ephemeral key, which according to the name should change every so often, but I never experienced it change in the few days of testing that I've done.

First of all you'll need to generate the key id, which I'll be calling `keyId`. You can generate that by doing a SHA1 digest of `publicKey`, and taking the first 4 bytes of the digest.

Now that you have your key id, you'll need to request the car's ephemeral key. You can do this by making a ToVCSEC message with the following layout:
```
ToVCSEC {
	unsignedMessage {
		InformationRequest {
			informationRequestType: INFORMATION_REQUEST_TYPE_GET_EPHEMERAL_PUBLIC_KEY
			keyId {
				publicKeySHA1: <keyId>
			}
		{
	}
}
```
You can serialize this message to bytes and put it into a variable which I'll call `getEphemeralBytes`. Now do prependLength(getEphemeralBytes), and send the return value of it to the car. The car should respond with a message which you need to decode. It should looks something like this:
```
FromVCSEC {
	sessionInfo {
		publicKey: <car's ephemeral key>
	}
}
```
When you recieve it, it should be in the X9.62 UnencodedPoint format, with the NISTP256 format. Once you load it I'll call it `ephemeral_key`. What you now need to do is generate an AES secret from the car's ephemeral public key, and your secret key. Now you need to make a SHA1 of itand put the first 16 bytes in a variable which I'll call `sharedKey`.
## Authenticating
For the car to know that you are connected, and to be able to send you requests, you need to authenticate yourself. To do so, you'll need to generate an authentication message in the following format:
```
UnsignedMessage {
	authenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_NONE
	}
}
```
Set a variable called `counter` to 1 (can be any number that hasn't been used as the counter for this key except 0), which you should increment each time after using. Now, you need to encrypt this message using the `sharedKey` in GCM mode, with a nonce which is a byte array of the counter split into 4 bytes. You should also seperate the encrypted/signed message into 2 variables, `encryptedMsg` (from bytes 0 to length - 16), and `msgSignature` (from bytes length - 16 to length). Now you need to generate a message to send to the car:
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
Now serialize this message to bytes and pass it to the `prependLength` function, and send that to the car. Now as long as you stay connected to the car's BLE, your key will stay marked in the car as an active key.
