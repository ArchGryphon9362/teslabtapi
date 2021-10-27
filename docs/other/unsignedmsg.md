# UnsignedMessage

Type|Name|Description|Repeated?
-|-|-|-
[`InformationRequest`](inforeq)|InformationRequest|Request certain information from the vehicle|no
[`RKEAction_E`](../enums/rkeaction_e)|RKEAction|Used to send a manual action to the vehicle|no
[`AuthenticationResponse`](authres)|authenticationResponse|Let the vehicle know that it can perform a certain level of actions automatically (for example when a user is next to the vehicle)|no
[`WhitelistOperation`](wlop)|WhitelistOperation|A whitelist operation to say remove/add permissions or keys|no
[`UpdaterResponse`](updaterres)|updaterResponse|...|no
[`GenealogyResponse`](genres)|genealogyResponse|Made for keyfobs and TPS to tell the vehicle their serial and part number|no
[`KeyMetadata`](keymd)|setMetaDataForKey|Sets metadata for a certain key|no
[`KeyfobInfo`](keyfobinfo)|keyfobInfo|Keyfob states such as temperature|no
[`IMUState_E`](../enums/imustate_e)|IMUState|...|no
[`NFCSEState`](nfcsestate)|nfcseState|...|no
[`SleepManagerStats`](sleepmanstats)|lowPowerDeviceSleepManagerStats|Keyfob/TPS sleep statisics|no
[`TPData`](tpdata)|TPData|TP and temperature data|no
[`TPWheelUnitInfo`](tpwhlunitinfo)|TPWheelUnitInfo|TPS info such as battery voltage|no
[`ResetTrackerStats`](rsttrckrstats)|resetTrackerStats|How many times the TPS restarted and for what reasons|no
[`TPNotifyTrackerStats`](tpnotiftrckrstats)|TPNotifyTrackerStats|...|no
[`TPNewSensorData`](tpnewsensdata)|TPNewSensorData|...|no
[`TPLRDetection`](tplrdetect)|TPLRDetection|...|no
[`ConnectionMetrics`](connmetrics)|connectionMetrics|Statistics on number of good/failed connections from the TPS to the vehicle|no
[`Activity_E`](../enums/activity_e)|deviceActivity|Device motion status|no
[`PersonalizationInformation`](personinfo)|personalizationInformation|...|no

:::note
`TP(S)` stands for `tire pressure (sensor)`
:::