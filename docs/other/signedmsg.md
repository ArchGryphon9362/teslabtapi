# SignedMessage

Type|Name|Description|Repeated?
-|-|-|-
byte array|token|Not sure what this is used for|no
uint32|counter|The current crypto counter|no
byte array|keyId|Your key's key id|no
byte array|protobufMessageAsBytes|[UnsignedMessage](unsignedmsg.md) serialized to bytes and encrypted without the tag, can be unencrypted when whitelisting the public key|no
[`SignatureType`](../enums/signaturetype)|signatureType|The signature type, which is AESGCM by default so you don't need to specify it, unless you are whitelisting a public key, in which case it is PRESENT_KEY|no
byte array|signature|When encrypting a message, this is the 16 byte tag|no
