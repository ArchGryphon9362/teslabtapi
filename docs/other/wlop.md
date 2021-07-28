# WhitelistOperation

Type|Name|Description|Repeated?
-|-|-|-
[`PublicKey`](publickey)|addPublicKeyToWhitelist|Add a public key to whitelist without any permissions|no
[`PublicKey`](publickey)|removePublicKeyFromWhitelist|Remove a public key from the whitelist, must have the `REMOVE_FROM_WHITELIST` permission|no
[`PermissionChange`](permchange)|addPermissionsToPublicKey|Add permissions to an existing public key, must have the `CHANGE_PERMISSIONS` permission|no
[`PermissionChange`](permchange)|removePermissionsFromPublicKey|Remove permissions from an existing public key, must have the `CHANGE_PERMISSIONS` permission|no
[`PermissionChange`](permchange)|addKeyToWhitelistAndAddPermissions|Add a public key to whitelist and add permissions to it|no
[`PermissionChange`](permchange)|updateKeyAndPermissions|Update public key and permissions on it|no
[`KeyMetadata`](keymetadata)|metadataForKey|A key's metadata|no
