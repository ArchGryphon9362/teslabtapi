---
sidebar_position: 4
---
# FromVCSECMessage

Type|Name|Description|Repeated?
-|-|-|-
[`VehicleStatus`](other/vehstatus)|vehicleStatus|The vehicle's closure (everything that has a latch) states and lock state|no
[`SessionInfo`](other/sessioninfo)|sessionInfo|Info about the connection|no
[`AuthenticationRequest`](other/authrequest)|authenticationRequest|A request from the vehicle for you to authenticate to a certain level|no
[`CommandStatus`](other/cmdstatus)|commandStatus|Status of the previous command|no
[`PersonalizationInformation`](other/personinfo)|personalizationInformation|...|no
[`WhitelistInfo`](other/wlinfo)|whitelistInfo|Information about all whitelisted keys|no
[`WhitelistEntryInfo`](other/wlentryinfo)|whitelistEntryInfo|Information about a certain whitelisted key|no
[`VehicleInfo`](other/vehinfo)|vehicleInfo|The vehicle's VIN (Vehicle Identification Number)|no
[`Capabilities`](other/capabilities)|capabilities|Whether the vehicle has the ability to open/close the charge port|no
[`ExternalAuthStatus`](other/extauthstatus)|externalAuthStatus|...|no
[`KeyStatusInfo`](other/kstatusinfo)|keyStatusInfo|The status of all the keys|no
[`ActiveKey`](other/activek)|activeKey|...|no
[`UnknownKeyInfo`](other/unknkinfo)|unknownKeyInfo|...|no
[`UpdaterCommand`](other/updatercmd)|updaterCommand|The vehicle's request to update the keyfob's/TPS' firmware|no
[`GenealogyRequest_E`](enums/genreq_e)|genealogyRequest|The vehicle's request to get the keyfob's/TPS' serial and part number|no
[`SleepManagerRequest`](other/sleepmanreq)|sleepManagerRequest|The vehicle's request to get the keyfob's/TPS' sleep stats or to get them to go to sleep mode after a certain number of time to save battery|no
[`IMURequest_E`](enums/imustate_e)|imuRequest|...|no
[`NFCSERequest_E`](enums/nfcsereq_e)|nfcseRequest|...|no
[`TPDataRequest_E`](enums/tpdatareq)|TPDataRequest|The vehicle's request to get information tracked by the TPS|no
[`ResetTrackerCommand_E`](enums/rsttrckrcmd_e)|resetTrackerCommand|The vehicle's request to read/clear the restart statistics on the TPS|no
[`TPNotifyTrackerCommand_E`](enums/tpnotiftrckrcmd_e)|TPNotifyTrackerCommand|...|no
[`SetTPConfigration`](other/settpconfig)|setTPConfiguration|The vehicle's request to change the configuration of the TPS|no
[`UnsecureNotification`](other/unsecnotif)|unsecureNotification|...|no

:::note
`TP(S)` stands for `tire pressure (sensor)`
:::