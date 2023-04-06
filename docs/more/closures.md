---
sidebar_position: 2
---

# Moving Doors And Closures

## Some Information

Tesla has a messages dedicated to moving closures such as the doors, the frunk, the trunk, and the charging port

## Structure

Just like any other message, this is put inside a `UnsignedMessage` message, signed, and sent off to the vehicle

Here's an example of a message used to open the passenger door (opens completely on Model X vehicles, unlatches on non Model X vehicles), and close the trunk (only on vehicles with powered liftgate) at the same time:

```proto
UnsignedMessage {
    closureMoveRequest: ClosureMoveRequest {
        frontPassengerDoor: CLOSURE_MOVE_TYPE_OPEN
        rearTrunk: CLOSURE_MOVE_TYPE_CLOSE
    }
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
# Derive an AES secret from our private key and the vehicle's public key
aesSecret = privateKey.exchange(ec.ECDH(), ephemeralKey)
# Put the AES secret into the hasher
hasher.update(aesSecret)
# Put the first 16 bytes of the hash into a shared key variable
sharedKey = hasher.finalize()[:16]

# Create a closure move request and fill it with the required data
closureMoveRequest = VCSEC.ClosureMoveRequest()
closureMoveRequest.frontPassengerDoor = VCSEC.ClosureMoveType_E.CLOSURE_MOVE_TYPE_OPEN
closureMoveRequest.rearTrunk = VCSEC.ClosureMoveType_E.CLOSURE_MOVE_TYPE_CLOSE

# Put the move request on an unsigned message and serialize it
unsignedMessage = VCSEC.UnsignedMessage()
unsignedMessage.closureMoveRequest.CopyFrom(closureMoveRequest)
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

# Print the message to be sent to the vehicle
print("\nClosure Move Request Message To Send To Vehicle:")
print(msg.hex(" "))
```

</details>

## Other Closures

| Closure              | Description               |
| -------------------- | ------------------------- |
| `frontDriverDoor`    | Front driver side door    |
| `frontPassengerDoor` | Front passenger side door |
| `rearDriverDoor`     | Rear driver side door     |
| `rearPassengerDoor`  | Rear passenger side door  |
| `rearTrunk`          | Trunk                     |
| `frontTrunk`         | Frunk                     |
| `chargePort`         | Charging port             |

## Other Actions

| Action                    | Description         |
| ------------------------- | ------------------- |
| `CLOSURE_MOVE_TYPE_NONE`  | No action - default |
| `CLOSURE_MOVE_TYPE_MOVE`  | ...                 |
| `CLOSURE_MOVE_TYPE_STOP`  | Stop the movement   |
| `CLOSURE_MOVE_TYPE_OPEN`  | Open the closure    |
| `CLOSURE_MOVE_TYPE_CLOSE` | Close the closure   |
