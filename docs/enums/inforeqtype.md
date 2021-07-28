# InformationRequestType
Option|Description
-|-
INFORMATION_REQUEST_TYPE_GET_STATUS|Returns a [`vehicleStatus`](../rcv/vehiclestatus) message
INFORMATION_REQUEST_TYPE_GET_TOKEN|Returns the car's token, not sure what it is, but I believe it is for the card emulation service
INFORMATION_REQUEST_TYPE_GET_COUNTER|Returns the current crypto counter, can't seem to get it to work
INFORMATION_REQUEST_TYPE_GET_EPHEMERAL_PUBLIC_KEY|Returns the car's ephemeral key, unknown expiration time
INFORMATION_REQUEST_TYPE_GET_SESSION_DATA|Returns a [`SessionInfo`](../rcv/sessioninfo) message
INFORMATION_REQUEST_TYPE_GET_WHITELIST_INFO|Returns a [`WhitelistInfo`](../rcv/whitelistinfo) message
INFORMATION_REQUEST_TYPE_GET_WHITELIST_ENTRY_INFO|Returns a [`WhitelistEntryInfo`](../rcv/whitelistentryinfo) message
INFORMATION_REQUEST_TYPE_GET_VEHICLE_INFO|Returns a [`VehicleInfo`](../rcv/vehicleinfo) message, but I couldn't get it to work
INFORMATION_REQUEST_TYPE_GET_KEYSTATUS_INFO|Returns a [`KeyStatus`](../rcv/keystatus) message
INFORMATION_REQUEST_TYPE_GET_ACTIVE_KEY|Returns a [`activeKey`](../rcv/activekey) message
INFORMATION_REQUEST_TYPE_GET_CAPABILITIES|Returns a ['Capabilities'](../rcv/capabilities) message
