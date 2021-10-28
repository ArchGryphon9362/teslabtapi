---
sidebar_position: 9
---
# ToTPWheelUnitMessage

Type|Name|Description|Repeated?
-|-|-|-
[`UpdaterCommand`](other/updatercmd)|updaterCommand|The vehicle's request to update the TPS' firmware|no
[`GenealogyRequest_E`](enums/genreq_e)|genealogyRequest|The vehicle's request to get the TPS' serial and part number|no
[`SleepManagerRequest`](other/sleepmanreq)|sleepManagerRequest|The vehicle's request to get the TPS' sleep stats or to get them to go to sleep mode after a certain number of time to save battery|no
[`TPDataRequest_E`](enums/tpdatareq)|TPDataRequest|The vehicle's request to get information tracked by the TPS|no
[`ResetTrackerCommand_E`](enums/rsttrckrcmd_e)|resetTrackerCommand|The vehicle's request to read/clear the restart statistics on the TPS|no
[`TPNotifyTrackerCommand_E`](enums/tpnotiftrckrcmd_e)|TPNotifyTrackerCommand|...|no
[`SetTPConfigration`](other/settpconfig)|setTPConfiguration|The vehicle's request to change the configuration of the TPS|no

:::note
`TP(S)` stands for `tire pressure (sensor)`
:::