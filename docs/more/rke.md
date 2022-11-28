---
sidebar_position: 1
---

# Simple Actions

## Some Information

The basic actions in Tesla vehicles are called RKE actions - Remote Keyless Entry Actions in other word. They can do some simple things like opening the trunk or frunk, or even locking and unlocking the car.

## Structure

RKE Actions are regular old `UnsignedMessage` messages, signed and sent off to the car.

Here's an example of an unlock message:

```proto
UnsignedMessage {
    RKEAction: RKE_ACTION_UNLOCK
}
```

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
# Derive an AES secret from our private key and the car's public key
aesSecret = privateKey.exchange(ec.ECDH(), ephemeralKey)
# Put the AES secret into the hasher
hasher.update(aesSecret)
# Put the first 16 bytes of the hash into a shared key variable
sharedKey = hasher.finalize()[:16]

# Put an rke action on an unsigned message with an unlock action and serialize it
unsignedMessage = VCSEC.UnsignedMessage()
unsignedMessage.RKEAction = VCSEC.RKEAction_E.RKE_ACTION_UNLOCK
unsignedMessageS = unsignedMessage.SerializeToString()

# Print out the unsigned message layout for information purposes
print("Unsigned Message Layout:")
print(unsignedMessage)

# Set counter to 3 and create a nonce from it
counter = 3
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

# Print the message to be sent to the car
print("\nRKE Action Message To Send To Car:")
print(msg.hex(" "))
```

</details>

## Other Actions

As you can see, these are pretty easy to make, here's a table describing what every other action does:

| Action                                    | Description                                                                                                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RKE_ACTION_UNLOCK`                       | Unlocks the vehicle                                                                                                                                                                |
| `RKE_ACTION_LOCK`                         | Locks the vehicle                                                                                                                                                                  |
| `RKE_ACTION_OPEN_TRUNK`                   | Opens the trunk                                                                                                                                                                    |
| `RKE_ACTION_OPEN_FRUNK`                   | Opens the frunk                                                                                                                                                                    |
| `RKE_ACTION_OPEN_CHARGE_PORT`             | Opens the charging port                                                                                                                                                            |
| `RKE_ACTION_CLOSE_CHARGE_PORT`            | Closes the charging port                                                                                                                                                           |
| `RKE_ACTION_CANCEL_EXTERNAL_AUTHENTICATE` | ...                                                                                                                                                                                |
| `RKE_ACTION_SINGLE_PRESS_TOP`             | `Keyfob Action` - Single press top of keyfob                                                                                                                                       |
| `RKE_ACTION_DOUBLE_PRESS_TOP`             | `Keyfob Action` - Double press top of keyfob                                                                                                                                       |
| `RKE_ACTION_TRIPLE_PRESS_TOP`             | `Keyfob Action` - Triple press top of keyfob                                                                                                                                       |
| `RKE_ACTION_HOLD_TOP`                     | `Keyfob Action` - Hold top of keyfob                                                                                                                                               |
| `RKE_ACTION_SINGLE_PRESS_BACK`            | `Keyfob Action` - Single press back of keyfob                                                                                                                                      |
| `RKE_ACTION_DOUBLE_PRESS_BACK`            | `Keyfob Action` - Double press back of keyfob                                                                                                                                      |
| `RKE_ACTION_TRIPLE_PRESS_BACK`            | `Keyfob Action` - Triple press back of keyfob                                                                                                                                      |
| `RKE_ACTION_HOLD_BACK`                    | `Keyfob Action` - Hold back of keyfob                                                                                                                                              |
| `RKE_ACTION_SINGLE_PRESS_FRONT`           | `Keyfob Action` - Single press front of keyfob                                                                                                                                     |
| `RKE_ACTION_DOUBLE_PRESS_FRONT`           | `Keyfob Action` - Double press front of keyfob                                                                                                                                     |
| `RKE_ACTION_TRIPLE_PRESS_FRONT`           | `Keyfob Action` - Triple press front of keyfob                                                                                                                                     |
| `RKE_ACTION_HOLD_FRONT`                   | `Keyfob Action` - Hold front of keyfob                                                                                                                                             |
| `RKE_ACTION_UNKNOWN`                      | ...                                                                                                                                                                                |
| `RKE_ACTION_REMOTE_DRIVE`                 | <ul><li>Pre 2022.16.1.2: Open a 2 minute period within which the vehicle can be started without Pin To Drive</li><li>2022.16.1.2 and later: useless action, does nothing</li></ul> |
| `RKE_ACTION_SINGLE_PRESS_LEFT`            | `Keyfob Action` - Single press left of keyfob                                                                                                                                      |
| `RKE_ACTION_DOUBLE_PRESS_LEFT`            | `Keyfob Action` - Double press left of keyfob                                                                                                                                      |
| `RKE_ACTION_TRIPLE_PRESS_LEFT`            | `Keyfob Action` - Triple press left of keyfob                                                                                                                                      |
| `RKE_ACTION_HOLD_LEFT`                    | `Keyfob Action` - Hold left of keyfob                                                                                                                                              |
| `RKE_ACTION_SINGLE_PRESS_RIGHT`           | `Keyfob Action` - Single press right of keyfob                                                                                                                                     |
| `RKE_ACTION_DOUBLE_PRESS_RIGHT`           | `Keyfob Action` - Double press right of keyfob                                                                                                                                     |
| `RKE_ACTION_TRIPLE_PRESS_RIGHT`           | `Keyfob Action` - Triple press right of keyfob                                                                                                                                     |
| `RKE_ACTION_HOLD_RIGHT`                   | `Keyfob Action` - Hold right of keyfob                                                                                                                                             |
| `RKE_ACTION_AUTO_SECURE_VEHICLE`          | Manually trigger walkaway lock (better than just sending lock command, as it lets the windows roll up if that option is enabled)                                                   |
| `RKE_ACTION_WAKE_VEHICLE`                 | Wake up the vehicle                                                                                                                                                                |
