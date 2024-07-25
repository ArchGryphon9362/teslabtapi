---
sidebar_position: 2
---

# Getting Started

import ReactSpoiler from "react-spoiler";

:::info
Tesla uses an irregular nonce size of 4 bytes. Cryptographically, this isn’t a major problem, but many libraries won’t let you use that exact nonce size, so be sure to choose one accordingly. No, you can't just change the nonce size. The resulting message will be different.
:::
:::note
In case you don’t own a Tesla yet, are just here out of curiousity, and are planning on buying one, you can show your support by buying with [our Tesla referral link](https://ts.la/nadiya73350). You'll even get some benefits!

On the other hand, if you do already own a Tesla, you can support our work by [getting us a Ko-fi](https://ko-fi.com/archgryphon9362). Thanks!
:::

## Whitelisting your key

To begin working with the vehicle's BLE API, you'll need to generate and whitelist your public key with the vehicle.

To do this, you'll need two things:

- Generate an EC private key with the NISTP256 curve (aka secp256r1, or prime256v1)
  - Keep this safe! This key is used to sign all your messages.
- Using your private key, you'll need to generate a public key serialized to bytes in the ANSI X9.62/X9.63 Uncompressed Point format
  - If done correctly, the first byte should always be `0x04`
  - <ReactSpoiler blur="10" hoverBlur="2">I never tried it, but Compressed Point might work too, that is where the first byte is <inlineCode>0x02</inlineCode> or <inlineCode>0x03</inlineCode>. If it does work, please tell me so that I can update the documentation! If you're feeling wild and try out any other public key encodings that work, then please notify me too!</ReactSpoiler>

We'll call these `privateKey`, and `publicKey` respectively.

Next serialize, an unsigned protobuf message from the VCSEC protobuf in the following layout:

```proto
UnsignedMessage {
	WhitelistOperation: WhitelistOperation {
		addKeyToWhitelistAndAddPermissions: PermissionChange {
			key: PublicKey {
				PublicKeyRaw: <publicKey>
			}
			permission: WHITELISTKEYPERMISSION_LOCAL_DRIVE
			permission: WHITELISTKEYPERMISSION_LOCAL_UNLOCK
			permission: WHITELISTKEYPERMISSION_REMOTE_DRIVE
			permission: WHITELISTKEYPERMISSION_REMOTE_UNLOCK
		}
		metadataForKey: KeyMetadata {
			keyFormFactor: KEY_FORM_FACTOR_ANDROID_DEVICE
		}
	}
}
```

You may add any other permissions as needed but these are the default ones (the ones that let you unlock, and start the vehicle, among other things). We'll call the previously serialized message the `protoMsg`.

Once you have it serialized to bytes, you need to make a `ToVCSECMessage` message of the following format:

```proto
ToVCSECMessage {
	signedMessage: SignedMessage {
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

```py
someMsg = b'\x01\x02'
prependedMsg = prependLength(someMsg)
print(prependedMsg) # b'\x00\x02\x01\x02'
```

Once you have serialized `protoMsg`, and prepended the length, send the message to the vehicle over a normal BluetoothLE connection on the following write characteristic:

```yaml
Service: 00000211-b2d1-43f0-9b88-960cebf8b91e
Characteristic UUID: 00000212-b2d1-43f0-9b88-960cebf8b91e
```

<details>
<summary>Python Example</summary>

```py
# Import VCSEC and crypto libraries
import VCSEC
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

# Function to prepend message length
def prepend_length(message):
	return (len(message).to_bytes(2, 'big') + message)

try:
    # Try to open and import private key
    privKeyFile = open('private_key.pem', 'rb')
    privateKey = serialization.load_pem_private_key(privKeyFile.read(), None)
    privKeyFile.close()
except FileNotFoundError:
    # If private key file not found, generate private keys
    privKeyFile = open('private_key.pem', 'wb')
    privateKey = ec.generate_private_key(ec.SECP256R1())
    privKeyFile.write(privateKey.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    privKeyFile.close()

# Derive public key in X9.62 Uncompressed Point Encoding
publicKey = privateKey.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)

# Print the public key for information purposes
print("Public Key:")
print(publicKey.hex(" "))

# Create a "public key" variable and set its public key to the one we generated
key = VCSEC.PublicKey()
key.PublicKeyRaw = publicKey

# Add perissions to a "permission change" variable and add the key variable to it
permissionChange = VCSEC.PermissionChange()
permissionChange.permission.append(VCSEC.WhitelistKeyPermission_E.WHITELISTKEYPERMISSION_LOCAL_DRIVE)
permissionChange.permission.append(VCSEC.WhitelistKeyPermission_E.WHITELISTKEYPERMISSION_LOCAL_UNLOCK)
permissionChange.permission.append(VCSEC.WhitelistKeyPermission_E.WHITELISTKEYPERMISSION_REMOTE_DRIVE)
permissionChange.permission.append(VCSEC.WhitelistKeyPermission_E.WHITELISTKEYPERMISSION_REMOTE_UNLOCK)
permissionChange.key.CopyFrom(key)

# Create a "key metadata" variable and set its form factor to android (can technically be anything in the enum)
metadataForKey = VCSEC.KeyMetadata()
metadataForKey.keyFormFactor = VCSEC.KeyFormFactor.KEY_FORM_FACTOR_ANDROID_DEVICE

# Create a "whitelist operation" variable and set its permission change variable to the one we created, and also set its key metadata variable to our's
whitelistOperation = VCSEC.WhitelistOperation()
whitelistOperation.addKeyToWhitelistAndAddPermissions.CopyFrom(permissionChange)
whitelistOperation.metadataForKey.CopyFrom(metadataForKey)

# Create an "unsigned message" variable and set its whitelist operation to our's
unsignedMessage = VCSEC.UnsignedMessage()
unsignedMessage.WhitelistOperation.CopyFrom(whitelistOperation)

# Print the unsigned message layout for information purposes
print("\nUnsigned Message Layout:")
print(unsignedMessage)

# Serialize our unsigned message variable
protoMsg = unsignedMessage.SerializeToString()

# Create a "signed message variable" and set its protobuf message to the one we created, and set the signature type to ask the user to tap the key card
signedMessage = VCSEC.SignedMessage()
signedMessage.protobufMessageAsBytes = protoMsg
signedMessage.signatureType = VCSEC.SignatureType.SIGNATURE_TYPE_PRESENT_KEY

# Create a "to vcsec message" and assign its signed message to the one we created
toVCSECMessage = VCSEC.ToVCSECMessage()
toVCSECMessage.signedMessage.CopyFrom(signedMessage)

# Print the to vcsec message layout for information purposes
print("\nTo VCSEC Message Layout:")
print(toVCSECMessage)

# Serialize the to vcsec message
authMsg = toVCSECMessage.SerializeToString()

# Prepend the length to our message
prependedMsg = prepend_length(authMsg)

# Print the final message needed to send to vehicle
print("\nFinal Message To Send To Vehicle:")
print(prependedMsg.hex(" "))
```

</details>

### Vehicle BLE Name

As of some updates, Tesla has changed the way names are advertised. To find the car's name with the new system, you simply append the last 6 characters of the VIN to the word `Tesla`

For example, if the VIN is `5YJ3E1EA1KF130307`, the VIN is `Tesla 130307`.

Just in case, you should also look out for the old naming, as some have reported it alternating between the 2.

To find out the old way of the naming, do the following:

- Get the vehicle's VIN, we'll call this `vin`
- Get a SHA1 hash of it, we'll call this `vinSHA`
- Get the `vinSHA` as a hex string, and keep only the first 16 characters, we'll call this `middleSection`
- Prepend "S" to middleSection and that is it. The last character is usually C
- All that is currently known about the last letter is that it must be one of the following:
  - C
  - R
  - D
  - P

<details>
<summary>Python Example</summary>

```py
# Import Crypto Library
from cryptography.hazmat.primitives import hashes

# Example VIN As Bytestring
vin = bytes("5YJ3E1EA1KF000000", "UTF8")

# Create A SHA1 Hasher
digest = hashes.Hash(hashes.SHA1())

# Put VIN Into The Hasher
digest.update(vin)

# Set vinSHA To The Hex String Of The VIN Hash
vinSHA = digest.finalize().hex()

# Get The First 16 Characters
middleSection = vinSHA[0:16]

# Prepend S And Append ? As We Don't Know The Last Character
bleName = "S" + middleSection + "?"

# Print The Final BLE Name
print(bleName) # Sa6bab0d54ffaecf1?
```

</details>

### Response

The vehicle will always respond with a `FromVCSECMessage` message.

The first two bytes of this message represent the length of the message.

The rest of the message can then be decoded. Below is an example response to a whilelist request:

```proto
FromVCSECMessage {
	commandStatus: CommandStatus {
		operationStatus: OPERATIONSTATUS_WAIT
	}
}
```

It should be received on the following indication characteristic:

```yaml
Service: 00000211-b2d1-43f0-9b88-960cebf8b91e
Characteristic UUID: 00000213-b2d1-43f0-9b88-960cebf8b91e
```

Now tap an existing key card, and you should recieve the following message:

```proto
FromVCSECMessage {
	commandStatus: CommandStatus {
		whitelistOperationStatus: WhitelistOperation_status {
			signerOfOperation: KeyIdentifier {
				publicKeySHA1: 0x5f0d64b3
			}
			operationStatus: OPERATIONSTATUS_OK # usually won't get printed out along
												# with the message as its tag is 0, and
												# therefore it gets truncated from the
												# message, but that is the default value
												# of the enum when there is no value
		}
	}
}
```

Congrats! You whitelisted your first key!

<details>
<summary>Python Example</summary>

```py
# Import VCSEC Library
import VCSEC

# Example Message That You Should Receive Upon Sending The Whitelist MEssage
exampleMsgRcvd = b'\x00\x04\x22\x02\x08\x01'
# Extracting The Expected Length Of The Message
expectedLength = int.from_bytes(exampleMsgRcvd[0:2], "big")

# Make Sure Message Of Expected Length
if len(exampleMsgRcvd[2:]) == expectedLength:
    print("Message Length Correct!")
else:
    print("Message Not Expected Length, Exiting...")
    exit()

# Decode The Received Message
decodedMsg = VCSEC.FromVCSECMessage()
decodedMsg.ParseFromString(exampleMsgRcvd[2:])

# Check If The Vehicle Is Telling Us To Wait For Something To Happen (the keycard getting tapped in this case)
if decodedMsg.commandStatus.operationStatus == VCSEC.OperationStatus_E.OPERATIONSTATUS_WAIT:
    print("Vehicle Asking To Tap Key Card!")

# Key Card Tapped Example Message
exampleKCTappedMsgRcvd = b'\x00\x0c\x22\x0a\x1a\x08\x12\x06\x0a\x04\x5f\x0d\x64\xb3'
# Extract The Length
expectedKCTappedLength = int.from_bytes(exampleKCTappedMsgRcvd[0:2], "big")

# Check If The Message Length Is Correct
if len(exampleKCTappedMsgRcvd[2:]) == expectedKCTappedLength:
    print("\nKey Card Tapped Message Length Correct!")
else:
    print("\nKey Card Tapped Message Not Expected Length, Exiting...")
    exit()

# Decode The Message
decodedMsg = VCSEC.FromVCSECMessage()
decodedMsg.ParseFromString(exampleKCTappedMsgRcvd[2:])

# Check If Everything Is Ok
if decodedMsg.commandStatus.whitelistOperationStatus.operationStatus == VCSEC.OperationStatus_E.OPERATIONSTATUS_OK:
    print("Key Card Tapped!")
```

</details>

## Getting the ephemeral key

To sign messages to send to the vehicle, you'll need to get the vehicle's ephemeral key.

By definition of its name, this key should change every so often, but I never experienced it change in the many months of testing that I've done.

First, generate the `keyId`. This can be done by taking the first 4 bytes of a SHA1 digest of `publicKey`.

Now that you have your `keyId`, you'll need to request the vehicle's ephemeral key. You can do this by making a `ToVCSECMessage` message with the following layout:

```proto
ToVCSECMessage {
	unsignedMessage: UnsignedMessage {
		InformationRequest: InformationRequest {
			informationRequestType: INFORMATION_REQUEST_TYPE_GET_EPHEMERAL_PUBLIC_KEY
			keyId: KeyIdentifier {
				publicKeySHA1: <keyId>
			}
		}
	}
}
```

Now, serialize this message to bytes as `getEphemeralBytes`. Prepend the message with `prependLength(getEphemeralBytes)`, and send the value to the vehicle.

The vehicle should respond with a message in the ANSI X9.62/X9.63 Uncompressed Point format, with the NISTP256 format. When decoded, it should looks something like this:

```proto
FromVCSECMessage {
	sessionInfo: SessionInfo {
		publicKey: <vehicle's ephemeral key>
	}
}
```

Now that you have the `ephemeralKey`, generate an AES secret from the `ephemeralKey` and your secret key. Next, make a SHA1 of it, and put take the first 16 bytes to form your `sharedKey`.

<details>
<summary>Python Example</summary>

```py
# Import the VCSEC and the crypto libraries
import VCSEC
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization

# Function to prepend message length
def prependLength(message):
    return (len(message).to_bytes(2, 'big') + message)

try:
    # Try to open and import private key
    privKeyFile = open('private_key.pem', 'rb')
    privateKey = serialization.load_pem_private_key(privKeyFile.read(), None)
    privKeyFile.close()
except FileNotFoundError:
    # If private key file not found, generate private keys
    privKeyFile = open('private_key.pem', 'wb')
    privateKey = ec.generate_private_key(ec.SECP256R1())
    privKeyFile.write(privateKey.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    privKeyFile.close()

# Derive public key in X9.62 Uncompressed Point Encoding
publicKey = privateKey.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)

# Hash our public key to get our key id and extract the first 4 bytes
digest = hashes.Hash(hashes.SHA1())
digest.update(publicKey)
keyId = digest.finalize()[:4]

# Create a "key identifier" message and assign our key id to it
keyIdentifier = VCSEC.KeyIdentifier()
keyIdentifier.publicKeySHA1 = keyId

# Create an "information request" message and set its request type and our key id
informationRequest = VCSEC.InformationRequest()
informationRequest.informationRequestType = VCSEC.InformationRequestType.INFORMATION_REQUEST_TYPE_GET_EPHEMERAL_PUBLIC_KEY
informationRequest.keyId.CopyFrom(keyIdentifier)

# Put the information request message on an unsigned message
unsignedMessage = VCSEC.UnsignedMessage()
unsignedMessage.InformationRequest.CopyFrom(informationRequest)

# Put all of that onto a to vcsec message
toVCSEC = VCSEC.ToVCSECMessage()
toVCSEC.unsignedMessage.CopyFrom(unsignedMessage)

# Print the layout for information purposes
print("To VCSEC Message Layout:")
print(toVCSEC)

# Serialize it, prepend the length, and print it out for sending
getEphemeralBytes = toVCSEC.SerializeToString()
prependedMessage = prependLength(getEphemeralBytes)
print("Ephemeral Key Request Message:")
print(prependedMessage.hex(" "))

# Example of a message you get in response
exampleMsgResponse = b'\x00\x45\x12\x43\x1a\x41\x04\x79\xc0\x50\x4a\x21\x6f\xfc\x26\x46\xb7\x57\x80\x39\x9f\x1c\xe1\x23\xf4\x01\x56\x1b\x68\x5c\x31\x83\x64\xfa\x96\xcc\x3f\xe6\x7a\x5a\xc5\x04\x8c\x44\x7a\xf8\x8d\x91\x52\x86\x5a\x1e\xfc\x15\xbb\xd5\x68\x98\xdd\x2c\x46\xf7\xa1\x9b\xad\x4f\xb2\x80\x52\xc4\x60'
# Extract the length
exampleMsgResponseLen = int.from_bytes(exampleMsgResponse[0:2], "big")

# Make sure the length is correct
if len(exampleMsgResponse[2:]) == exampleMsgResponseLen:
    print("\nMessage Length Correct")
else:
    print("\nMessage Not Of Expected Length, Exiting...")
    exit()

# Parse the message into a variable that we can work with
fromVCSEC = VCSEC.FromVCSECMessage()
fromVCSEC.ParseFromString(exampleMsgResponse[2:])

# Print out its layout for information purposes
print("Example Response Message Layout:")
print(fromVCSEC)

# Extract the ephemeral key
ephemeralKey = fromVCSEC.sessionInfo.publicKey
print("Extracted Ephemeral Key:")
print(ephemeralKey.hex(" "))

# Put the known curve of the key into a variable
curve = ec.SECP256R1()
# Use the curve to put the ephemeral key into a workable format
ephemeralKey = ec.EllipticCurvePublicKey.from_encoded_point(curve, ephemeralKey)
# Prepare a hasher
hasher = hashes.Hash(hashes.SHA1())
# Derive an AES secret from our private key and the vehicle's public key
aesSecret = privateKey.exchange(ec.ECDH(), ephemeralKey)
# Put the AES secret into the hasher
hasher.update(aesSecret)
# Put the first 16 bytes of the hash into a shared key variable
sharedKey = hasher.finalize()[:16]

# Print the shared key for information purposes
print("\nShared Key:")
print(sharedKey.hex(' '))
```

</details>

## Authenticating

:::warning
Due to Tesla's implementation of message signing, you are _required_ to use a 4 byte long nonce, which is a problem as it might be deemed insecure by some libraries (such as the one in the example of this section), and they must be modified to remove the limit, or the encryption must be done without a library if that such a modified library is not available.
:::
For the vehicle to know that you are connected and to be able to send/receive messages, you need to generate an authentication message in the following format:

```proto
UnsignedMessage {
	authenticationResponse: AuthenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_NONE
	}
}
```

Set a variable called `counter` to 1 which can be any unsigned 32 bit number (must match the rule `counter >= 1 and counter <= 4294967295`), and must be greater than the last used counter otherwise the vehicle won't accept it. You must change the counter after each use.

Now, you need to encrypt this message using the `sharedKey` with AES128 encryption in GCM mode, with a nonce of the `counter`, split into 4 bytes in big-endian, where the least significant (smaller in value) byte is at the end.

So, if `counter` is `23` (`0x17`), the nonce will be `b'\x00\x00\x00\x17'`.

We'll call this `encryptedMsgWithTag` as it has a signature tag that we'll need to separate.

You should separate the encrypted/signed message into 2 variables, `encryptedMsg` (from byte `0` to `encryptedMsgWithTag.length - 16`), and `msgSignature` (from byte `encryptedMsgWithTag.length - 16` to `encryptedMsgWithTag.length`).

Now you can send the message to the vehicle! Use the following format:

```proto
ToVCSECMessage {
	signedMessage: SignedMessage {
		protobufMessageAsBytes: <encryptedMsg>
		signature: <msgSignature>
		counter: <counter>
		keyId: <keyId>
	}
}
```

Now, prepare the message by serializing and prepending the length of the message. It is now ready to be sent to the vehicle!

Once complete, as long as you stay connected to the vehicle's BLE, your key will stay marked in the vehicle as an active key.

<details>
<summary>Python Example</summary>

```py
import VCSEC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization

# Function to prepend message length
def prependLength(message):
    return (len(message).to_bytes(2, 'big') + message)

try:
    # Try to open and import private key
    privKeyFile = open('private_key.pem', 'rb')
    privateKey = serialization.load_pem_private_key(privKeyFile.read(), None)
    privKeyFile.close()
except FileNotFoundError:
    # If private key file not found, generate private keys
    privKeyFile = open('private_key.pem', 'wb')
    privateKey = ec.generate_private_key(ec.SECP256R1())
    privKeyFile.write(privateKey.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    privKeyFile.close()

# Derive public key in X9.62 Uncompressed Point Encoding
publicKey = privateKey.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)

# Hash our public key to get our key id and extract the first 4 bytes
digest = hashes.Hash(hashes.SHA1())
digest.update(publicKey)
keyId = digest.finalize()[:4]

# Example Ephemeral Key
ephemeralKey = b'\x04\x79\xc0\x50\x4a\x21\x6f\xfc\x26\x46\xb7\x57\x80\x39\x9f\x1c\xe1\x23\xf4\x01\x56\x1b\x68\x5c\x31\x83\x64\xfa\x96\xcc\x3f\xe6\x7a\x5a\xc5\x04\x8c\x44\x7a\xf8\x8d\x91\x52\x86\x5a\x1e\xfc\x15\xbb\xd5\x68\x98\xdd\x2c\x46\xf7\xa1\x9b\xad\x4f\xb2\x80\x52\xc4\x60'

# Put the known curve of the key into a variable
curve = ec.SECP256R1()
# Use the curve to put the ephemeral key into a workable format
ephemeralKey = ec.EllipticCurvePublicKey.from_encoded_point(curve, ephemeralKey)
# Prepare a hasher
hasher = hashes.Hash(hashes.SHA1())
# Derive an AES secret from our private key and the vehicle's public key
aesSecret = privateKey.exchange(ec.ECDH(), ephemeralKey)
# Put the AES secret into the hasher
hasher.update(aesSecret)
# Put the first 16 bytes of the hash into a shared key variable
sharedKey = hasher.finalize()[:16]

# Create an authentication response message with a level of none
authenticationResponse = VCSEC.AuthenticationResponse()
authenticationResponse.authenticationLevel = VCSEC.AuthenticationLevel_E.AUTHENTICATION_LEVEL_NONE

# Put that message on an unsigned message and serialize it
unsignedMessage = VCSEC.UnsignedMessage()
unsignedMessage.authenticationResponse.CopyFrom(authenticationResponse)
unsignedMessageS = unsignedMessage.SerializeToString()

# Print out the unsigned message layout for information purposes
print("Unsigned Message Layout:")
print(unsignedMessage)

# Set counter to 1 and create a nonce from it
counter = 1
nonce = int.to_bytes(counter, 4, "big")

# Initialize an AES encryptor in GCM mode and encrypt the message using it
encryptor = AESGCM(sharedKey)
# This will error out if you're using the latest version of the cryptorgraphy.io library as I'm using a 4 byte long nonce
try:
    encryptedMsgWithTag = encryptor.encrypt(nonce, unsignedMessageS, None)
except ValueError:
    print("Error: The cryptography.io library doesn't allow nonces as small as 4 bytes anymore. Please modify the if statement in the _check_params(nonce, data, associated_date) function in the cryptography.hazmat.primitives.ciphers.aead.AESGCM class to require the minimum length to be 1")
    exit()

# Put all of this onto a "signed message" variable
signedMessage = VCSEC.SignedMessage()
signedMessage.protobufMessageAsBytes = encryptedMsgWithTag[:-16]
signedMessage.counter = counter
signedMessage.signature = encryptedMsgWithTag[-16:]
signedMessage.keyId = keyId

# Put all of this onto a "to vcsec" message
toVCSECMessage = VCSEC.ToVCSECMessage()
toVCSECMessage.signedMessage.CopyFrom(signedMessage)

# Print it out for information purposes
print("\nTo VCSEC Message Layout:")
print(toVCSECMessage)

# Serialize the message and prepend the length
msg = toVCSECMessage.SerializeToString()
msg = prependLength(msg)

# Print the message to be sent to the vehicle
print("\nAuth Message To Send To Vehicle:")
print(msg.hex(" "))
```

</details>

## Authenticating for other things

If you want to let the vehicle do things automatically without sending messages to do things (i.e. like the Tesla App does when you're next to/inside the vehicle), you can send it an authentication response of a higher level to give permission to do everything under and including that level, so say `level = 'UNLOCK'`, you are only letting the vehicle unlock once, but say you do `level = 'DRIVE'`, you can unlock _or_ drive once, not both. Also, everytime the vehicle does something automatically, the vehicle resets level to `NONE`.

All that you have to do is serialize and sign an auth message where the distance is optional, but if not sent to the vehicle, it will just automatically assume that you're next to/inside the vehicle:

```proto
UnsignedMessage {
	AuthenticationResponse: AuthenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_<LEVEL>
		estimatedDistance: <distance> # optional
	}
}
```

Once you sign that message, I'll call it `signedAuthMsg`, and its signature `signedAuthSign`, and turn it into a ToVCSECMessage message like this, which you then serialize, prepend the length, and send to the vehicle:

```proto
ToVCSECMessage {
	signedMessage: SignedMessage {
		protobufMessageAsBytes: <signedAuthMsg>
		signature: <signedAuthSign>
		counter: <counter>
		keyId: <keyId>
	}
}
```

:::note
I recommend only changing this to other auth levels when the vehicle requests it. Here's an example of a message you may get from the vehicle, requesting to unlock it (yes I know this says drive, but that's just how it is):

```proto
FromVCSECMessage {
	authenticationRequest: AuthenticationRequest {
		sessionInfo: SessionInfo {
			token: "some random token that i don't know the use of"
		}
		requestedLevel: AUTHENTICATION_LEVEL_DRIVE
	}
}
```

In this case you'll just send the vehicle back the following message:

```proto
UnsignedMessage {
	AuthenticationResponse: AuthenticationResponse {
		authenticationLevel: AUTHENTICATION_LEVEL_DRIVE
	}
}
```

Don't worry about the walk-away auto-lock, when you walk away the vehicle will automatically lock based off the connection strength (or if the bluetooth disconnects), although I believe in the newer VCSEC version you can send the RKE action `RKE_ACTION_AUTO_SECURE_VEHICLE`, in case you want the vehicle to lock automatically (and auto-close the windows if that option is enabled as simply locking doesn't close them, so this would be prefered)
:::

<details>
<summary>Python Example</summary>

```py
import VCSEC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization

# Function to prepend message length
def prependLength(message):
    return (len(message).to_bytes(2, 'big') + message)

try:
    # Try to open and import private key
    privKeyFile = open('private_key.pem', 'rb')
    privateKey = serialization.load_pem_private_key(privKeyFile.read(), None)
    privKeyFile.close()
except FileNotFoundError:
    # If private key file not found, generate private keys
    privKeyFile = open('private_key.pem', 'wb')
    privateKey = ec.generate_private_key(ec.SECP256R1())
    privKeyFile.write(privateKey.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    privKeyFile.close()

# Derive public key in X9.62 Uncompressed Point Encoding
publicKey = privateKey.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)

# Hash our public key to get our key id and extract the first 4 bytes
digest = hashes.Hash(hashes.SHA1())
digest.update(publicKey)
keyId = digest.finalize()[:4]

# Example Ephemeral Key
ephemeralKey = b'\x04\x79\xc0\x50\x4a\x21\x6f\xfc\x26\x46\xb7\x57\x80\x39\x9f\x1c\xe1\x23\xf4\x01\x56\x1b\x68\x5c\x31\x83\x64\xfa\x96\xcc\x3f\xe6\x7a\x5a\xc5\x04\x8c\x44\x7a\xf8\x8d\x91\x52\x86\x5a\x1e\xfc\x15\xbb\xd5\x68\x98\xdd\x2c\x46\xf7\xa1\x9b\xad\x4f\xb2\x80\x52\xc4\x60'

# Put the known curve of the key into a variable
curve = ec.SECP256R1()
# Use the curve to put the ephemeral key into a workable format
ephemeralKey = ec.EllipticCurvePublicKey.from_encoded_point(curve, ephemeralKey)
# Prepare a hasher
hasher = hashes.Hash(hashes.SHA1())
# Derive an AES secret from our private key and the vehicle's public key
aesSecret = privateKey.exchange(ec.ECDH(), ephemeralKey)
# Put the AES secret into the hasher
hasher.update(aesSecret)
# Put the first 16 bytes of the hash into a shared key variable
sharedKey = hasher.finalize()[:16]

# Example of an auth request message
exampleAuthMsgRcvd = b'\x00\x0c\x1a\x0a\x12\x06\x0a\x04\x00\x01\x0f\x2c\x18\x02'
# Extract the length
exampleAuthMsgRcvdLen = int.from_bytes(exampleAuthMsgRcvd[0:2], "big")

# Make sure the length is correct
if len(exampleAuthMsgRcvd[2:]) == exampleAuthMsgRcvdLen:
    print("Message Length Correct")
else:
    print("Message Not Of Expected Length, Exiting...")
    exit()

fromVCSEC = VCSEC.FromVCSECMessage()
fromVCSEC.ParseFromString(exampleAuthMsgRcvd[2:])

print("Auth Request Message Layout:")
print(fromVCSEC)

# Create an authentication response message with the level requested
authenticationResponse = VCSEC.AuthenticationResponse()
authenticationResponse.authenticationLevel = fromVCSEC.authenticationRequest.requestedLevel

# Put that message on an unsigned message and serialize it
unsignedMessage = VCSEC.UnsignedMessage()
unsignedMessage.authenticationResponse.CopyFrom(authenticationResponse)
unsignedMessageS = unsignedMessage.SerializeToString()

# Print out the unsigned message response layout for information purposes
print("\nUnsigned Message Response Layout:")
print(unsignedMessage)

# Set counter to 2 and create a nonce from it
counter = 2
nonce = int.to_bytes(counter, 4, "big")

# Initialize an AES encryptor in GCM mode and encrypt the message using it
encryptor = AESGCM(sharedKey)
# This will error out if you're using the latest version of the cryptorgraphy.io library as I'm using a 4 byte long nonce
try:
    encryptedMsgWithTag = encryptor.encrypt(nonce, unsignedMessageS, None)
except ValueError:
    print("Error: The cryptography.io library doesn't allow nonces as small as 4 bytes anymore. Please modify the if statement in the _check_params(nonce, data, associated_date) function in the cryptography.hazmat.primitives.ciphers.aead.AESGCM class to require the minimum length to be 1")
    exit()

# Put all of this onto a "signed message" variable
signedMessage = VCSEC.SignedMessage()
signedMessage.protobufMessageAsBytes = encryptedMsgWithTag[:-16]
signedMessage.counter = counter
signedMessage.signature = encryptedMsgWithTag[-16:]
signedMessage.keyId = keyId

# Put all of this onto a "to vcsec" message
toVCSECMessage = VCSEC.ToVCSECMessage()
toVCSECMessage.signedMessage.CopyFrom(signedMessage)

# Print it out for information purposes
print("\nTo VCSEC Message Layout:")
print(toVCSECMessage)

# Serialize the message and prepend the length
msg = toVCSECMessage.SerializeToString()
msg = prependLength(msg)

# Print the message to be responded to the vehicle with
print("\nAuth Message To Send To Vechile:")
print(msg.hex(" "))
```

</details>

## More Info

For more info, you can look at the VCSEC file directly (UnsignedMessage and FromVCSECMessage contain all the fun stuff), or you can look at "More Stuff" in the sidebar.
