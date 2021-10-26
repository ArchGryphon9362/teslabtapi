# AuthenticationResponse

Type|Name|Description|Repeated?
-|-|-|-
[`AuthenticationLevel_E`](../enums/authlevel_e)|authenticationLevel|The level of authentication you are giving the vehicle. For example if you give it unlock level, you can *only* unlock the vehicle, but if you send it a drive level auth response, it can either start the vehicle *or* unlock it but not both, if you want both, you'll need to send the message a second time|no
uint32|estimatedDistance|Estimated distance to vehicle, presubmably in meters. If left empty, defaults to empty, i.e. right next to the vehicle|no
