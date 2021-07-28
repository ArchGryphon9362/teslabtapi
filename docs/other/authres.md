# AuthenticationResponse

Type|Name|Description|Repeated?
-|-|-|-
[`AuthenticationLevel_E`](../enums/authlevel_e)|authenticationLevel|The level of authentication you are giving the car. For example if you give it unlock level, you can *only* unlock the car, but if you send it a drive level auth response, it can either start the car *or* unlock it but not both, if you want both, you'll need to send the message a second time|no
uint32|estimatedDistance|Estimated distance to car, presubmably in meters. If left empty, defaults to empty, i.e. right next to the car|no
